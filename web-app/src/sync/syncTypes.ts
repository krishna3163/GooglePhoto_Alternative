import type { ExifData, EncryptionMetadata } from '../types';

/**
 * Manifest version for backward/forward compatibility schema upgrades.
 */
export const CURRENT_MANIFEST_VERSION = 1;

/**
 * Telegram Storage References for Media and Thumbnails.
 */
export interface TelegramMediaRef {
    chatId: string;
    messageId?: number;
    fileId: string;
}

export interface TelegramStorageMetadata {
    original: TelegramMediaRef;
    thumbnail?: TelegramMediaRef;
}

/**
 * Individual Media Item inside the Remote Sync Manifest.
 */
export interface ManifestMediaItem {
    id: string;
    vaultId: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    createdAt: string;
    updatedAt: string;
    isFavourite: boolean;
    isTrash: boolean;
    deletedAt?: string | null;
    albumIds: string[];
    tags: string[];
    ocrText?: string;
    exif?: ExifData;
    pHash?: string;
    telegram: TelegramStorageMetadata;
    encryption: EncryptionMetadata;
}

/**
 * Vault Entry inside the Sync Manifest.
 */
export interface ManifestVaultItem {
    id: string;
    name: string;
    type: 'photos' | 'videos' | 'documents' | 'family';
    createdAt: string;
    updatedAt: string;
    description?: string;
}

/**
 * Album Entry inside the Sync Manifest.
 */
export interface ManifestAlbumItem {
    id: string;
    name: string;
    coverPhotoId?: string;
    createdAt: string;
    updatedAt: string;
    photoIds: string[];
}

/**
 * Delta History Record for granular delta synchronizations.
 */
export interface ManifestDeltaRecord {
    revision: number;
    timestamp: string;
    deviceId: string;
    operations: SyncOperationSummary[];
}

export interface SyncOperationSummary {
    opType: SyncOperationType;
    entityId: string;
    vaultId: string;
    fieldModified?: string;
}

/**
 * Remote Metadata Sync Manifest - Canonical Cross-Device Source of Truth.
 */
export interface SyncManifest {
    version: number;
    accountId: string;
    revision: number;
    updatedAt: string;
    lastModifiedByDeviceId: string;
    vaults: ManifestVaultItem[];
    albums: ManifestAlbumItem[];
    media: ManifestMediaItem[];
    deltaHistory?: ManifestDeltaRecord[];
}

/**
 * Sync Operation Types supported by Offline Operation Queue.
 */
export type SyncOperationType =
    | 'CREATE_MEDIA'
    | 'UPDATE_MEDIA'
    | 'DELETE_MEDIA'
    | 'RESTORE_MEDIA'
    | 'PERMANENT_DELETE_MEDIA'
    | 'CREATE_ALBUM'
    | 'UPDATE_ALBUM'
    | 'DELETE_ALBUM'
    | 'CREATE_VAULT'
    | 'UPDATE_VAULT';

/**
 * Offline Sync Queue Operation Entry.
 */
export interface SyncOperation {
    id: string;
    type: SyncOperationType;
    entityId: string;
    vaultId: string;
    payload: any;
    createdAt: string;
    updatedAt: string;
    retryCount: number;
    status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';
    lastError?: string;
    deviceId: string;
}

/**
 * Local Sync State and Preferences.
 */
export type SyncStatus = 'synced' | 'syncing' | 'failed' | 'offline' | 'uninitialized';

export interface SyncPreferences {
    cloudSyncEnabled: boolean;
    syncOnWifiOnly: boolean;
    backgroundSync: boolean;
    downloadOriginals: 'wifi_only' | 'always' | 'on_demand';
    deviceName: string;
    deviceId: string;
}

export interface LocalSyncState {
    lastSyncedRevision: number;
    lastSyncTimestamp?: string;
    status: SyncStatus;
    pendingCount: number;
    lastError?: string;
}
