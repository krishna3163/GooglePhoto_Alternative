export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

export interface TelegramSession {
    sessionId: string;
    userId: number;
    phoneNumber: string;
    accessHash?: string;
    encryptedSession: string; // Encrypted session data
    createdAt: number;
    isActive: boolean;
}

export interface TelegramConfig {
    token: string;
    chatId: string;
    isDeveloperMode?: boolean;
    telegramUser?: TelegramUser | null;
    storageModel?: 'model1' | 'model3'; // 'model1' = Bot-based (default), 'model3' = Account-based
    model3Session?: TelegramSession | null; // For MTProto account login
}

export interface PhotoAsset {
    id: string;
    url: string;
    mediaType: 'image' | 'video' | 'document';
    fileName: string;
    timestamp: string;
    ocrText?: string;
    isFavourite?: boolean;
    location?: {
        name: string;
        lat?: number;
        lng?: number;
    };
    faces?: string[]; // Face IDs or names
    messageId?: number;
    fileId?: string;
}

export interface UploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'failed';
    progress: number;
    retries: number;
    error?: string;
    fileId?: string | null;
    messageId?: number | null;
}
