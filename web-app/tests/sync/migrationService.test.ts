import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isMigrationNeeded, runLegacyDataMigration } from '../../src/sync/migrationService';
import { initializeVault } from '../../src/services/cryptoService';
import * as telegramService from '../../src/services/telegramService';
import type { PhotoAsset, Album } from '../../src/types';

describe('Legacy Local Data Migration to Remote Encrypted Manifest', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(telegramService, 'uploadSyncManifest').mockImplementation(async (_cfg, _blob, meta, rev) => {
            localStorage.setItem('telegphoto_remote_manifest_ref', JSON.stringify({
                fileId: 'mock_migrated_file_id',
                messageId: 9999,
                revision: rev,
                metadata: meta,
            }));
            return { fileId: 'mock_migrated_file_id', messageId: 9999, revision: rev };
        });
    });

    it('1. Detects legacy installation with local photos and creates initial remote manifest', async () => {
        const { masterKey } = await initializeVault('MigrationPassword123');

        const localPhotos: PhotoAsset[] = [
            {
                id: 'legacy_1',
                fileName: 'LegacyMemory.jpg',
                url: 'https://example.com/legacy_1.jpg',
                mediaType: 'image',
                timestamp: '2025-12-01T12:00:00Z',
                isFavourite: true,
                vaultId: 'vault-personal',
            },
        ];
        const localAlbums: Album[] = [];

        expect(isMigrationNeeded(localPhotos)).toBe(true);

        const config = { token: 'mock_token', chatId: '1253687962' };
        const migrated = await runLegacyDataMigration(config, masterKey, localPhotos, localAlbums, [
            { id: 'vault-personal', name: 'Personal Vault', type: 'photos', chatId: '1253687962' }
        ]);

        expect(migrated).toBe(true);
        expect(localStorage.getItem('telegphoto_migration_v1_done')).toBe('true');
        expect(localStorage.getItem('telegphoto_remote_manifest_ref')).toBeDefined();

        // 2. Idempotency: Second run should return false and not re-upload
        expect(isMigrationNeeded(localPhotos)).toBe(false);
        const secondRun = await runLegacyDataMigration(config, masterKey, localPhotos, localAlbums, []);
        expect(secondRun).toBe(false);
    });

    it('2. Does not trigger migration if local library is already empty', () => {
        expect(isMigrationNeeded([])).toBe(false);
    });
});
