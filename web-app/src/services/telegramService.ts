import axios from 'axios';
import type { TelegramConfig } from '../types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export const uploadFileToTelegram = async (
    config: TelegramConfig,
    file: File,
    _mediaType: 'image' | 'video' | 'document' = 'image',
    onProgress?: (progress: number) => void
): Promise<{ fileId: string; messageId: number }> => {
    const { token, chatId } = config;

    if (!token || !chatId) {
        throw new Error('Telegram config not set');
    }

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', file);

    try {
        const response = await axios.post(`${TELEGRAM_API_BASE}${token}/sendDocument`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });

        const fileId = response.data?.result?.document?.file_id ||
            response.data?.result?.video?.file_id ||
            response.data?.result?.photo?.[response.data.result.photo.length - 1]?.file_id;
        const messageId = response.data?.result?.message_id;

        if (!fileId || !messageId) throw new Error("No file ID or message ID returned from Telegram");

        return { fileId, messageId };
    } catch (error: any) {
        console.error('Telegram upload error:', error.response?.data || error.message);
        throw error;
    }
};

export const deleteTelegramMessage = async (config: TelegramConfig, messageId: number): Promise<void> => {
    const { token, chatId } = config;
    if (!token || !chatId) throw new Error('Telegram config not set');

    try {
        await axios.post(`${TELEGRAM_API_BASE}${token}/deleteMessage`, {
            chat_id: chatId,
            message_id: messageId
        });
    } catch (error: any) {
        console.error('Telegram delete error:', error.response?.data || error.message);
    }
};

export const getFileDownloadUrl = async (config: TelegramConfig, fileId: string): Promise<string> => {
    const { token } = config;
    if (!token) throw new Error("No token");

    const response = await axios.get(`${TELEGRAM_API_BASE}${token}/getFile?file_id=${fileId}`);
    const filePath = response.data?.result?.file_path;

    if (!filePath) throw new Error("Could not get file path");

    return `https://api.telegram.org/file/bot${token}/${filePath}`;
};
export const sendTextMessage = async (config: TelegramConfig, text: string): Promise<void> => {
    const { token, chatId } = config;
    if (!token || !chatId) throw new Error('Telegram config not set');

    try {
        await axios.post(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
            chat_id: chatId,
            text: text
        });
    } catch (error: any) {
        console.error('Telegram message error:', error.response?.data || error.message);
        throw error;
    }
};

export const getBotInfo = async (token: string): Promise<{ username: string; first_name: string }> => {
    const response = await axios.get(`${TELEGRAM_API_BASE}${token}/getMe`);
    if (response.data?.ok) {
        return {
            username: response.data.result.username,
            first_name: response.data.result.first_name
        };
    }
    throw new Error('Failed to fetch bot info');
};
