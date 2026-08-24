import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export interface TelegramUploadResult {
  chatId: string;
  messageId: number;
  fileId: string;
}

export class TelegramStorageService {
  /**
   * Resolve active bot token (user-provided or server-level master bot token).
   */
  private static getBotToken(customToken?: string): string {
    const isProd = process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production';
    const token = customToken || env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      if (!isProd) {
        return 'mock_bot_token';
      }
      throw new AppError(500, 'TELEGRAM_CONFIG_MISSING', 'Telegram bot token is not configured in production');
    }
    return token;
  }

  /**
   * Upload an encrypted file buffer / stream directly to Telegram via sendDocument.
   */
  public static async uploadEncryptedMedia(
    buffer: Buffer,
    fileName: string,
    chatId: string,
    customBotToken?: string
  ): Promise<TelegramUploadResult> {
    const isProd = process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production';
    const token = this.getBotToken(customBotToken);

    if (token.startsWith('mock_') || token.startsWith('demo_')) {
      if (isProd) {
        throw new AppError(500, 'INVALID_PRODUCTION_STORAGE', 'Mock Telegram storage cannot be used in production environment');
      }
      const mockMsgId = Math.floor(Math.random() * 900000) + 100000;
      return {
        chatId: chatId || 'mock_chat_id',
        messageId: mockMsgId,
        fileId: `mock_file_id_${mockMsgId}_${fileName}`,
      };
    }

    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('document', buffer, { filename: `${fileName}.enc` });

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${token}/sendDocument`,
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60000,
        }
      );

      const result = response.data?.result;
      const fileId = result?.document?.file_id;
      const messageId = result?.message_id;

      if (!fileId || !messageId) {
        throw new Error('Telegram API did not return valid fileId/messageId');
      }

      return {
        chatId,
        messageId,
        fileId,
      };
    } catch (err: any) {
      console.error('Telegram upload failure:', err?.response?.data || err?.message || err);
      throw new AppError(502, 'TELEGRAM_UPLOAD_FAILED', 'Failed to upload media to Telegram storage');
    }
  }

  /**
   * Retrieve download URL or stream from Telegram getFile API.
   */
  public static async downloadMediaBuffer(
    fileId: string,
    customBotToken?: string
  ): Promise<Buffer> {
    const token = this.getBotToken(customBotToken);

    if (token.startsWith('mock_') || token.startsWith('demo_') || fileId.startsWith('mock_')) {
      // Return a simulated encrypted payload buffer for mock testing
      return Buffer.from('mock_encrypted_media_data_stream');
    }

    try {
      const getFileRes = await axios.get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
        { timeout: 15000 }
      );

      const filePath = getFileRes.data?.result?.file_path;
      if (!filePath) {
        throw new Error('Telegram returned empty file_path');
      }

      const downloadRes = await axios.get(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
        {
          responseType: 'arraybuffer',
          timeout: 60000,
        }
      );

      return Buffer.from(downloadRes.data);
    } catch (err: any) {
      console.error('Telegram download failure:', err?.response?.data || err?.message || err);
      throw new AppError(502, 'TELEGRAM_DOWNLOAD_FAILED', 'Failed to retrieve media from Telegram storage');
    }
  }

  /**
   * Delete a message containing media from Telegram chat.
   */
  public static async deleteMediaMessage(
    chatId: string,
    messageId: number,
    customBotToken?: string
  ): Promise<boolean> {
    const token = this.getBotToken(customBotToken);

    if (token.startsWith('mock_') || token.startsWith('demo_')) {
      return true;
    }

    try {
      await axios.post(`https://api.telegram.org/bot${token}/deleteMessage`, {
        chat_id: chatId,
        message_id: messageId,
      });
      return true;
    } catch (err: any) {
      console.warn('Telegram deleteMessage notice:', err?.response?.data || err?.message);
      return false; // Soft fail on Telegram deletion so local records can still be cleaned up
    }
  }

  /**
   * Validate Telegram bot token and return bot user info.
   */
  public static async validateBotToken(botToken: string): Promise<{ id: number; username: string; first_name: string }> {
    if (botToken.startsWith('mock_') || botToken.startsWith('demo_')) {
      return { id: 12345678, username: 'MockTeleGBot', first_name: 'TeleGphoto Bot' };
    }

    try {
      const res = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 10000 });
      if (!res.data?.ok || !res.data?.result) {
        throw new Error('Invalid bot token');
      }
      return res.data.result;
    } catch (err: any) {
      throw new AppError(400, 'INVALID_TELEGRAM_BOT_TOKEN', 'Telegram Bot Token is invalid or inaccessible');
    }
  }
}
