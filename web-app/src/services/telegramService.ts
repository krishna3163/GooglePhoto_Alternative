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

/**
 * Manifest Sync Primitives
 */
const MANIFEST_CAPTION_PREFIX = '#TELEGPHOTO_SYNC_MANIFEST';

export interface TelegramManifestUploadResult {
    fileId: string;
    messageId: number;
    revision: number;
}

export interface TelegramManifestDownloadResult {
    blob: Blob;
    metadata: any;
    revision: number;
    messageId: number;
}

export const pinChatMessage = async (config: TelegramConfig, messageId: number): Promise<void> => {
    const { token, chatId } = config;
    if (!token || !chatId) return;

    try {
        await axios.post(`${TELEGRAM_API_BASE}${token}/pinChatMessage`, {
            chat_id: chatId,
            message_id: messageId,
            disable_notification: true
        });
    } catch (err: any) {
        console.warn('Telegram pin message notice:', err.response?.data || err.message);
    }
};

export const uploadSyncManifest = async (
    config: TelegramConfig,
    encryptedBlob: Blob,
    metadata: any,
    revision: number
): Promise<TelegramManifestUploadResult> => {
    const { token, chatId } = config;
    if (!token || !chatId) throw new Error('Telegram config not set');

    const manifestFile = new File([encryptedBlob], `manifest_rev_${revision}.dat`, {
        type: 'application/octet-stream'
    });

    const captionData = JSON.stringify({
        tag: MANIFEST_CAPTION_PREFIX,
        rev: revision,
        meta: metadata,
        ts: new Date().toISOString()
    });

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', manifestFile);
    formData.append('caption', captionData);

    const response = await axios.post(`${TELEGRAM_API_BASE}${token}/sendDocument`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    const fileId = response.data?.result?.document?.file_id;
    const messageId = response.data?.result?.message_id;

    if (!fileId || !messageId) {
        throw new Error('Telegram manifest upload failed: no fileId or messageId returned.');
    }

    // Save manifest tracking locally
    localStorage.setItem('telegphoto_remote_manifest_ref', JSON.stringify({
        fileId,
        messageId,
        revision,
        metadata
    }));

    // Pin manifest message for remote discovery on fresh devices & Incognito
    await pinChatMessage(config, messageId);

    return { fileId, messageId, revision };
};

export const downloadLatestSyncManifest = async (
    config: TelegramConfig
): Promise<TelegramManifestDownloadResult | null> => {
    const { token, chatId } = config;
    if (!token) throw new Error('Telegram config not set');

    // 1. Check local cache reference first (fast path)
    let refData = localStorage.getItem('telegphoto_remote_manifest_ref');

    // 2. If no local cache (Fresh Device / Incognito Session), discover remotely via Telegram Chat
    if (!refData && chatId) {
        try {
            const chatRes = await axios.get(`${TELEGRAM_API_BASE}${token}/getChat?chat_id=${chatId}`);
            const pinned = chatRes.data?.result?.pinned_message;

            if (pinned && pinned.caption && pinned.caption.includes(MANIFEST_CAPTION_PREFIX)) {
                const parsedCaption = JSON.parse(pinned.caption);
                const fileId = pinned.document?.file_id;
                const messageId = pinned.message_id;

                if (fileId && messageId) {
                    refData = JSON.stringify({
                        fileId,
                        messageId,
                        revision: parsedCaption.rev || 1,
                        metadata: parsedCaption.meta || {}
                    });
                    localStorage.setItem('telegphoto_remote_manifest_ref', refData);
                }
            }
        } catch (discoverErr: any) {
            console.warn('Remote manifest discovery notice:', discoverErr.response?.data || discoverErr.message);
        }
    }

    if (!refData) return null;

    try {
        const { fileId, messageId, revision, metadata } = JSON.parse(refData);
        const downloadUrl = await getFileDownloadUrl(config, fileId);
        const response = await axios.get(downloadUrl, { responseType: 'blob' });

        return {
            blob: response.data,
            metadata,
            revision,
            messageId
        };
    } catch (err) {
        console.warn('Failed to download latest sync manifest from Telegram:', err);
        return null;
    }
};

export const getManifestRevision = async (
    config: TelegramConfig
): Promise<number | null> => {
    const res = await downloadLatestSyncManifest(config);
    return res ? res.revision : null;
};

export const updateSyncManifest = async (
    config: TelegramConfig,
    encryptedBlob: Blob,
    metadata: any,
    revision: number,
    oldMessageId?: number
): Promise<TelegramManifestUploadResult> => {
    const uploadRes = await uploadSyncManifest(config, encryptedBlob, metadata, revision);

    // Clean up older manifest message asynchronously to prevent storage clutter
    if (oldMessageId && oldMessageId !== uploadRes.messageId) {
        deleteTelegramMessage(config, oldMessageId).catch(() => {});
    }

    return uploadRes;
};
