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
    encryptedSession: string;
    createdAt: number;
    isActive: boolean;
}

export interface TelegramConfig {
    token: string;
    chatId: string;
    isDeveloperMode?: boolean;
    telegramUser?: TelegramUser | null;
    storageModel?: 'model1' | 'model3';
    model3Session?: TelegramSession | null;
    encryptionKey?: string;
    vaults?: { id: string; name: string; chatId: string; type: 'photos' | 'videos' | 'documents' | 'family' }[];
}

export interface ExifData {
    cameraModel?: string;
    lens?: string;
    iso?: number | string;
    fNumber?: number | string;
    exposureTime?: string;
    dimensions?: { width: number; height: number };
    fileSizeBytes?: number;
    gps?: { lat: number; lng: number };
    dateTaken?: string;
}

export interface PhotoAsset {
    id: string;
    url: string;
    mediaType: 'image' | 'video' | 'document';
    fileName: string;
    timestamp: string;
    fileSizeBytes?: number;
    ocrText?: string;
    isFavourite?: boolean;
    isTrash?: boolean;
    deletedAt?: string;
    albumIds?: string[];
    exif?: ExifData;
    pHash?: string;
    isEncrypted?: boolean;
    encryptionMetadata?: {
        v: number;
        alg: 'AES-256-GCM';
        iv: string;
        salt?: string;
    };
    location?: {
        name: string;
        lat?: number;
        lng?: number;
    };
    faces?: string[];
    messageId?: number;
    fileId?: string;
}

export interface Album {
    id: string;
    name: string;
    coverPhotoUrl?: string;
    createdAt: string;
    photoIds: string[];
}

export interface UploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'failed';
    progress: number;
    speedMbPerSec?: number;
    retries: number;
    error?: string;
    fileId?: string | null;
    messageId?: number | null;
}
