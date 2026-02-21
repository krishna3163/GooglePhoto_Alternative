import axios from 'axios';
import { getTelegramConfig } from './storage';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

// NOTE: Telegram Bot API limit is 50MB for uploads. 20MB is a safe bet for Expo.
export const uploadFileToTelegram = async (fileUri: string, mediaType: 'image' | 'video' | 'document' = 'image'): Promise<string> => {
    const { token, chatId } = await getTelegramConfig();

    if (!token || !chatId) {
        throw new Error('Telegram config not set');
    }

    const formData = new FormData();
    formData.append('chat_id', chatId);

    const fileName = fileUri.split('/').pop() || 'file';
    let mimeType = 'application/octet-stream';
    if (mediaType === 'image') mimeType = 'image/jpeg';
    if (mediaType === 'video') mimeType = 'video/mp4';
    if (mediaType === 'document') mimeType = 'application/pdf'; // Basic fallback, ideally passed in

    // Create a file object for React Native
    const file: any = {
        uri: fileUri,
        name: fileName,
        type: mimeType,
    };

    formData.append('document', file);

    try {
        const response = await axios.post(`${TELEGRAM_API_BASE}${token}/sendDocument`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const fileId = response.data?.result?.document?.file_id ||
            response.data?.result?.video?.file_id ||
            response.data?.result?.photo?.[response.data.result.photo.length - 1]?.file_id;

        if (!fileId) throw new Error("No file ID returned from Telegram");

        return fileId;
    } catch (error: any) {
        console.error('Telegram upload error:', error.response?.data || error.message);
        throw error;
    }
};

export const getFileDownloadUrl = async (fileId: string): Promise<string> => {
    const { token } = await getTelegramConfig();
    if (!token) throw new Error("No token");

    // 1. Get File Path
    const response = await axios.get(`${TELEGRAM_API_BASE}${token}/getFile?file_id=${fileId}`);
    const filePath = response.data?.result?.file_path;

    if (!filePath) throw new Error("Could not get file path");

    // 2. Construct Download URL
    return `https://api.telegram.org/file/bot${token}/${filePath}`;
};
