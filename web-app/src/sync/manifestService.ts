import type {
    SyncManifest,
    ManifestMediaItem,
    ManifestAlbumItem,
    ManifestVaultItem,
} from './syncTypes';
import { CURRENT_MANIFEST_VERSION } from './syncTypes';
import type { PhotoAsset, Album } from '../types';
import type { VaultInfo } from '../components/layout/Sidebar';
import { encryptMediaWithVaultKey, decryptMediaWithVaultKey } from '../services/cryptoService';

/**
 * Converts local PhotoAsset array and Album array into a structured SyncManifest.
 */
export function createManifestFromLocalData(
    accountId: string,
    deviceId: string,
    revision: number,
    photos: PhotoAsset[],
    albums: Album[],
    vaults: VaultInfo[]
): SyncManifest {
    const manifestMedia: ManifestMediaItem[] = photos.map(p => ({
        id: p.id,
        vaultId: p.vaultId || 'vault-personal',
        fileName: p.fileName,
        mimeType: p.mediaType === 'video' ? 'video/mp4' : p.mediaType === 'document' ? 'application/pdf' : 'image/jpeg',
        fileSizeBytes: p.fileSizeBytes || (p.exif?.fileSizeBytes) || 0,
        createdAt: p.timestamp,
        updatedAt: p.timestamp,
        isFavourite: !!p.isFavourite,
        isTrash: !!p.isTrash,
        deletedAt: p.deletedAt || null,
        albumIds: p.albumIds || [],
        tags: [],
        ocrText: p.ocrText,
        exif: p.exif,
        pHash: p.pHash,
        telegram: {
            original: {
                chatId: '',
                messageId: p.messageId,
                fileId: p.fileId || p.id,
            },
        },
        encryption: p.encryptionMetadata || {
            v: 1,
            alg: 'AES-256-GCM',
            iv: '',
        },
    }));

    const manifestAlbums: ManifestAlbumItem[] = albums.map(a => ({
        id: a.id,
        name: a.name || a.title || 'Untitled Album',
        coverPhotoId: a.coverPhotoUrl ? undefined : undefined,
        createdAt: a.createdAt,
        updatedAt: a.createdAt,
        photoIds: a.photoIds || [],
    }));

    const manifestVaults: ManifestVaultItem[] = vaults.map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));

    return {
        version: CURRENT_MANIFEST_VERSION,
        accountId,
        revision,
        updatedAt: new Date().toISOString(),
        lastModifiedByDeviceId: deviceId,
        vaults: manifestVaults,
        albums: manifestAlbums,
        media: manifestMedia,
        deltaHistory: [],
    };
}

/**
 * Validates a decrypted SyncManifest structure.
 */
export function validateManifest(manifest: any): manifest is SyncManifest {
    if (!manifest || typeof manifest !== 'object') return false;
    if (typeof manifest.version !== 'number') return false;
    if (typeof manifest.revision !== 'number') return false;
    if (!Array.isArray(manifest.media)) return false;
    if (!Array.isArray(manifest.vaults)) return false;
    if (!Array.isArray(manifest.albums)) return false;
    return true;
}

/**
 * Encrypts a SyncManifest using the Master Vault Key (Zero-Knowledge AES-256-GCM).
 */
export async function encryptManifest(
    manifest: SyncManifest,
    masterVaultKey: CryptoKey
): Promise<{ encryptedBlob: Blob; metadata: any }> {
    const jsonStr = JSON.stringify(manifest);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return await encryptMediaWithVaultKey(blob, masterVaultKey);
}

/**
 * Decrypts and validates an encrypted SyncManifest.
 */
export async function decryptManifest(
    encryptedBlob: Blob,
    masterVaultKey: CryptoKey,
    metadata: any
): Promise<SyncManifest> {
    const decryptedBlob = await decryptMediaWithVaultKey(encryptedBlob, masterVaultKey, metadata);
    const jsonStr = await decryptedBlob.text();
    const parsed = JSON.parse(jsonStr);

    if (!validateManifest(parsed)) {
        throw new Error('Decrypted manifest failed structural schema validation.');
    }

    return parsed;
}

/**
 * Transforms ManifestMediaItem entries into runtime PhotoAsset objects.
 */
export function manifestMediaToPhotoAssets(
    mediaItems: ManifestMediaItem[],
    telegramDownloadUrlResolver?: (fileId: string, id?: string) => string
): PhotoAsset[] {
    return mediaItems.map(m => ({
        id: m.id,
        url: telegramDownloadUrlResolver ? telegramDownloadUrlResolver(m.telegram.original.fileId, m.id) : '',
        mediaType: m.mimeType.startsWith('video/') ? 'video' : m.mimeType.startsWith('application/pdf') ? 'document' : 'image',
        fileName: m.fileName,
        timestamp: m.createdAt,
        fileSizeBytes: m.fileSizeBytes,
        ocrText: m.ocrText,
        isFavourite: m.isFavourite,
        isTrash: m.isTrash,
        deletedAt: m.deletedAt || undefined,
        albumIds: m.albumIds,
        exif: m.exif,
        pHash: m.pHash,
        isEncrypted: true,
        encryptionMetadata: m.encryption,
        vaultId: m.vaultId,
        messageId: m.telegram.original.messageId,
        fileId: m.telegram.original.fileId,
    }));
}
