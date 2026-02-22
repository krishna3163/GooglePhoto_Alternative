export interface TelegramConfig {
    token: string;
    chatId: string;
    isDeveloperMode?: boolean;
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
