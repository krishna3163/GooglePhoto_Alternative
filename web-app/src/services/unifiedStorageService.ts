import type { TelegramConfig, PhotoAsset } from '../types';
import {
    uploadFileToTelegram as uploadToModel1,
    getFileDownloadUrl as getModel1FileUrl,
    deleteTelegramMessage as deleteModel1Message
} from './telegramService';
import {
    uploadFileToModel3 as uploadToModel3,
    getModel3FileUrl,
    deleteModel3Message,
    fetchSavedMessages
} from './model3Service';

/**
 * Unified Storage Service - Handles both Model 1 (Bot) and Model 3 (Account) storage
 */

export const uploadFile = async (
    config: TelegramConfig,
    file: File,
    mediaType: 'image' | 'video' | 'document' = 'image',
    onProgress?: (progress: number) => void
): Promise<{ fileId: string; messageId: number }> => {
    const storageModel = config.storageModel || 'model1';

    if (storageModel === 'model3' && config.model3Session) {
        // Use Model 3 (Account-based storage)
        return await uploadToModel3(config.model3Session, file, onProgress);
    } else {
        // Use Model 1 (Bot-based storage) - Default
        return await uploadToModel1(config, file, mediaType, onProgress);
    }
};

export const getFileUrl = async (
    config: TelegramConfig,
    fileId: string
): Promise<string> => {
    const storageModel = config.storageModel || 'model1';

    if (storageModel === 'model3' && config.model3Session) {
        // Use Model 3
        return await getModel3FileUrl(config.model3Session, fileId);
    } else {
        // Use Model 1
        return await getModel1FileUrl(config, fileId);
    }
};

export const deleteFile = async (
    config: TelegramConfig,
    messageId: number
): Promise<void> => {
    const storageModel = config.storageModel || 'model1';

    if (storageModel === 'model3' && config.model3Session) {
        // Use Model 3
        return await deleteModel3Message(config.model3Session, messageId);
    } else {
        // Use Model 1
        return await deleteModel1Message(config, messageId);
    }
};

export const fetchGalleryMedia = async (
    config: TelegramConfig,
    limit: number = 50,
    offset: number = 0
) => {
    const storageModel = config.storageModel || 'model1';

    if (storageModel === 'model3' && config.model3Session) {
        // Fetch from Saved Messages for Model 3
        return await fetchSavedMessages(config.model3Session, limit, offset);
    } else {
        // Model 1 uses a different method (not implemented in this service)
        // This would be called from the main app logic
        return { messages: [], hasMore: false, totalCount: 0 };
    }
};

export const getStorageInfo = (config: TelegramConfig): {
    model: 'model1' | 'model3';
    name: string;
    description: string;
    isExperimental: boolean;
} => {
    const storageModel = config.storageModel || 'model1';

    if (storageModel === 'model3') {
        return {
            model: 'model3',
            name: 'Telegram Account Cloud',
            description: 'Store files in your Telegram account Saved Messages',
            isExperimental: true
        };
    } else {
        return {
            model: 'model1',
            name: 'Telegram Bot Storage',
            description: 'Store files using a Telegram bot channel',
            isExperimental: false
        };
    }
};
