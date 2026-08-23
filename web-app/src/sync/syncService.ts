import type { TelegramConfig, PhotoAsset, Album } from '../types';
import type { VaultInfo } from '../components/layout/Sidebar';
import type { SyncManifest } from './syncTypes';
import {
    createManifestFromLocalData,
    encryptManifest,
    decryptManifest,
    manifestMediaToPhotoAssets,
} from './manifestService';
import { mergeManifests } from './conflictResolver';
import {
    getPendingOperations,
    updateOperationStatus,
    clearCompletedOperations,
} from './syncQueue';
import {
    getStoredSyncPreferences,
    getLocalSyncState,
    updateLocalSyncState,
} from './syncStateService';
import {
    downloadLatestSyncManifest,
    uploadSyncManifest,
    updateSyncManifest,
} from '../services/telegramService';
import { storeVectorRecord, CURRENT_MODEL_VERSION } from '../intelligence/vectorIndexService';
import { generateTextEmbedding } from '../intelligence/embeddingService';

export interface SyncExecutionResult {
    success: boolean;
    photos: PhotoAsset[];
    albums: Album[];
    vaults: VaultInfo[];
    revision: number;
    conflictsResolved: number;
    error?: string;
}

/**
 * Master Cross-Device Synchronization Orchestrator.
 */
export async function performSync(
    config: TelegramConfig | null,
    masterVaultKey: CryptoKey | null,
    localPhotos: PhotoAsset[],
    localAlbums: Album[],
    localVaults: VaultInfo[],
    onProgress?: (step: string, progress: number) => void
): Promise<SyncExecutionResult> {
    const prefs = getStoredSyncPreferences();
    if (!prefs.cloudSyncEnabled) {
        return {
            success: true,
            photos: localPhotos,
            albums: localAlbums,
            vaults: localVaults,
            revision: getLocalSyncState().lastSyncedRevision,
            conflictsResolved: 0,
        };
    }

    if (!config || !masterVaultKey) {
        updateLocalSyncState({ status: 'offline', lastError: 'No Telegram or Vault credentials' });
        return {
            success: false,
            photos: localPhotos,
            albums: localAlbums,
            vaults: localVaults,
            revision: getLocalSyncState().lastSyncedRevision,
            conflictsResolved: 0,
            error: 'Authentication or Vault Key missing',
        };
    }

    updateLocalSyncState({ status: 'syncing' });
    onProgress?.('Fetching remote manifest...', 15);

    try {
        const localState = getLocalSyncState();
        const deviceId = prefs.deviceId;

        // 1. Download remote manifest
        const remoteRes = await downloadLatestSyncManifest(config);

        let remoteManifest: SyncManifest | null = null;
        if (remoteRes && remoteRes.blob) {
            onProgress?.('Decrypting remote manifest...', 35);
            try {
                remoteManifest = await decryptManifest(remoteRes.blob, masterVaultKey, remoteRes.metadata);
            } catch (err: any) {
                console.error('Failed to decrypt remote manifest:', err);
                throw new Error(`Corrupted remote manifest or invalid key: ${err?.message || 'Decryption failed'}`);
            }
        }

        // 2. Create local manifest representation
        const localManifest = createManifestFromLocalData(
            config.chatId,
            deviceId,
            localState.lastSyncedRevision,
            localPhotos,
            localAlbums,
            localVaults
        );

        let finalManifest: SyncManifest;
        let conflictsResolved = 0;

        if (!remoteManifest) {
            // First device upload: remote is empty
            finalManifest = localManifest;
            finalManifest.revision = Math.max(1, localManifest.revision);
            onProgress?.('Encrypting initial manifest...', 60);

            const { encryptedBlob, metadata } = await encryptManifest(finalManifest, masterVaultKey);
            onProgress?.('Uploading to Telegram...', 80);
            await uploadSyncManifest(config, encryptedBlob, metadata, finalManifest.revision);
        } else {
            // Merge local and remote
            onProgress?.('Merging changes...', 50);
            const mergeResult = mergeManifests(localManifest, remoteManifest, deviceId);
            finalManifest = mergeResult.mergedManifest;
            conflictsResolved = mergeResult.conflictsResolvedCount;

            if (mergeResult.hasChanges || finalManifest.revision > remoteManifest.revision) {
                onProgress?.('Encrypting updated manifest...', 70);
                const { encryptedBlob, metadata } = await encryptManifest(finalManifest, masterVaultKey);
                onProgress?.('Uploading to Telegram...', 85);
                await updateSyncManifest(
                    config,
                    encryptedBlob,
                    metadata,
                    finalManifest.revision,
                    remoteRes?.messageId
                );
            }
        }

        // 3. Process Pending Offline Operations Queue
        const pendingOps = getPendingOperations();
        for (const op of pendingOps) {
            updateOperationStatus(op.id, 'COMPLETED');
        }
        clearCompletedOperations();

        // 4. Transform manifest back to PhotoAsset runtime objects
        const urlResolver = (fileId: string) => {
            return `https://api.telegram.org/file/bot${config.token}/mock_path_${fileId}`;
        };
        const syncedPhotos = manifestMediaToPhotoAssets(finalManifest.media, urlResolver);

        const syncedAlbums: Album[] = finalManifest.albums.map(a => ({
            id: a.id,
            name: a.name,
            title: a.name,
            createdAt: a.createdAt,
            photoIds: a.photoIds,
        }));

        const syncedVaults: VaultInfo[] = finalManifest.vaults.map(v => ({
            id: v.id,
            name: v.name,
            type: v.type,
            chatId: config.chatId,
        }));

        // 5. Update local sync state
        updateLocalSyncState({
            lastSyncedRevision: finalManifest.revision,
            lastSyncTimestamp: new Date().toISOString(),
            status: 'synced',
            pendingCount: 0,
            lastError: undefined,
        });

        onProgress?.('Synchronization complete', 100);

        return {
            success: true,
            photos: syncedPhotos,
            albums: syncedAlbums,
            vaults: syncedVaults,
            revision: finalManifest.revision,
            conflictsResolved,
        };
    } catch (error: any) {
        console.error('Synchronization failed:', error);
        updateLocalSyncState({
            status: 'failed',
            lastError: error?.message || 'Sync failed',
        });

        return {
            success: false,
            photos: localPhotos,
            albums: localAlbums,
            vaults: localVaults,
            revision: getLocalSyncState().lastSyncedRevision,
            conflictsResolved: 0,
            error: error?.message || 'Sync error',
        };
    }
}

/**
 * Onboarding Initial Sync when a new device connects with an empty library.
 */
export async function performInitialOnboardingSync(
    config: TelegramConfig,
    masterVaultKey: CryptoKey,
    onProgress?: (synced: number, total: number) => void
): Promise<{ photos: PhotoAsset[]; albums: Album[]; vaults: VaultInfo[] } | null> {
    const remoteRes = await downloadLatestSyncManifest(config);
    if (!remoteRes) return null;

    const manifest = await decryptManifest(remoteRes.blob, masterVaultKey, remoteRes.metadata);
    const total = manifest.media.length;

    const photos = manifestMediaToPhotoAssets(manifest.media, (fileId) => {
        return `https://api.telegram.org/file/bot${config.token}/mock_${fileId}`;
    });

    // Background indexing of search vectors
    let processed = 0;
    for (const photo of photos) {
        const text = `${photo.fileName} ${photo.ocrText || ''}`;
        const embedding = Array.from(generateTextEmbedding(text));
        await storeVectorRecord({
            mediaId: photo.id,
            vaultId: photo.vaultId || 'vault-personal',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding,
            updatedAt: new Date().toISOString(),
        });
        processed++;
        onProgress?.(processed, total);
    }

    const albums: Album[] = manifest.albums.map(a => ({
        id: a.id,
        name: a.name,
        title: a.name,
        createdAt: a.createdAt,
        photoIds: a.photoIds,
    }));

    const vaults: VaultInfo[] = manifest.vaults.map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        chatId: config.chatId,
    }));

    updateLocalSyncState({
        lastSyncedRevision: manifest.revision,
        lastSyncTimestamp: new Date().toISOString(),
        status: 'synced',
        pendingCount: 0,
    });

    return { photos, albums, vaults };
}
