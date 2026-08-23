import type { TelegramConfig, PhotoAsset, Album } from '../types';
import type { VaultInfo } from '../components/layout/Sidebar';
import { createManifestFromLocalData, encryptManifest } from './manifestService';
import { uploadSyncManifest } from '../services/telegramService';
import { getStoredSyncPreferences } from './syncStateService';

const MIGRATION_FLAG_KEY = 'telegphoto_migration_v1_done';

/**
 * Checks if migration from legacy local-only storage to remote encrypted manifest is needed.
 */
export function isMigrationNeeded(localPhotos: PhotoAsset[]): boolean {
    if (typeof localStorage === 'undefined') return false;
    const migrationDone = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (migrationDone) return false;

    // If local photos exist from previous versions, migration is needed
    return localPhotos.length > 0;
}

/**
 * Idempotently executes migration of local-only library to remote encrypted manifest.
 */
export async function runLegacyDataMigration(
    config: TelegramConfig,
    masterVaultKey: CryptoKey,
    localPhotos: PhotoAsset[],
    localAlbums: Album[],
    localVaults: VaultInfo[]
): Promise<boolean> {
    if (!isMigrationNeeded(localPhotos)) return false;

    try {
        const prefs = getStoredSyncPreferences();
        const initialManifest = createManifestFromLocalData(
            config.chatId,
            prefs.deviceId,
            1,
            localPhotos,
            localAlbums,
            localVaults
        );

        const { encryptedBlob, metadata } = await encryptManifest(initialManifest, masterVaultKey);
        await uploadSyncManifest(config, encryptedBlob, metadata, initialManifest.revision);

        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        return true;
    } catch (err) {
        console.error('Data migration error:', err);
        return false;
    }
}
