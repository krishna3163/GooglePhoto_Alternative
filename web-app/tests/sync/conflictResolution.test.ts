import { describe, it, expect } from 'vitest';
import { mergeManifests, mergeMediaItem, mergeAlbumItem } from '../../src/sync/conflictResolver';
import type { SyncManifest, ManifestMediaItem, ManifestAlbumItem } from '../../src/sync/syncTypes';

describe('Cross-Device Conflict Resolution Engine', () => {
    const baseItem: ManifestMediaItem = {
        id: 'photo_1',
        vaultId: 'vault_personal',
        fileName: 'IMG_Original.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 2048,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
        isFavourite: false,
        isTrash: false,
        albumIds: [],
        tags: [],
        telegram: { original: { chatId: '123', fileId: 'f1' } },
        encryption: { v: 1, alg: 'AES-256-GCM', iv: 'iv1' },
    };

    it('1. Independent field merge: PC favorites photo, Phone renames photo -> Both survive', () => {
        const pcEdit: ManifestMediaItem = {
            ...baseItem,
            isFavourite: true,
            updatedAt: '2026-08-01T11:00:00Z',
        };

        const phoneEdit: ManifestMediaItem = {
            ...baseItem,
            fileName: 'Vacation_Goa.jpg',
            updatedAt: '2026-08-01T11:05:00Z',
        };

        const { merged, hadConflict } = mergeMediaItem(pcEdit, phoneEdit);

        expect(hadConflict).toBe(true);
        expect(merged.isFavourite).toBe(true);
        expect(merged.fileName).toBe('Vacation_Goa.jpg');
        expect(new Date(merged.updatedAt).getTime()).toBe(new Date('2026-08-01T11:05:00Z').getTime());
    });

    it('2. Same-field conflict: Last-Write-Wins based on deterministic timestamp', () => {
        const olderEdit: ManifestMediaItem = {
            ...baseItem,
            fileName: 'Sunset_Early.jpg',
            updatedAt: '2026-08-01T12:00:00Z',
        };

        const newerEdit: ManifestMediaItem = {
            ...baseItem,
            fileName: 'Sunset_Final.jpg',
            updatedAt: '2026-08-01T12:30:00Z',
        };

        const { merged } = mergeMediaItem(olderEdit, newerEdit);
        expect(merged.fileName).toBe('Sunset_Final.jpg');
    });

    it('3. Delete vs Restore precedence', () => {
        const deletedItem: ManifestMediaItem = {
            ...baseItem,
            isTrash: true,
            deletedAt: '2026-08-01T14:00:00Z',
            updatedAt: '2026-08-01T14:00:00Z',
        };

        const restoredItem: ManifestMediaItem = {
            ...baseItem,
            isTrash: false,
            deletedAt: null,
            updatedAt: '2026-08-01T14:15:00Z',
        };

        const { merged } = mergeMediaItem(deletedItem, restoredItem);
        expect(merged.isTrash).toBe(false);
        expect(merged.deletedAt).toBeNull();
    });

    it('4. Album photo union: photos added from different devices are all preserved', () => {
        const pcAlbum: ManifestAlbumItem = {
            id: 'alb_1',
            name: 'Summer Trip',
            createdAt: '2026-08-01T10:00:00Z',
            updatedAt: '2026-08-01T10:30:00Z',
            photoIds: ['photo_1', 'photo_2'],
        };

        const phoneAlbum: ManifestAlbumItem = {
            id: 'alb_1',
            name: 'Summer Trip',
            createdAt: '2026-08-01T10:00:00Z',
            updatedAt: '2026-08-01T10:45:00Z',
            photoIds: ['photo_1', 'photo_3'],
        };

        const merged = mergeAlbumItem(pcAlbum, phoneAlbum);
        expect(merged.photoIds).toContain('photo_1');
        expect(merged.photoIds).toContain('photo_2');
        expect(merged.photoIds).toContain('photo_3');
        expect(merged.photoIds).toHaveLength(3);
    });

    it('5. Full manifest merge increases revision monotonically when changes exist', () => {
        const localManifest: SyncManifest = {
            version: 1,
            accountId: 'acc1',
            revision: 5,
            updatedAt: '2026-08-01T10:00:00Z',
            lastModifiedByDeviceId: 'dev_pc',
            vaults: [{ id: 'v1', name: 'Vault', type: 'photos', createdAt: '', updatedAt: '' }],
            albums: [],
            media: [baseItem],
        };

        const remoteManifest: SyncManifest = {
            version: 1,
            accountId: 'acc1',
            revision: 5,
            updatedAt: '2026-08-01T10:30:00Z',
            lastModifiedByDeviceId: 'dev_phone',
            vaults: [{ id: 'v1', name: 'Vault', type: 'photos', createdAt: '', updatedAt: '' }],
            albums: [],
            media: [{ ...baseItem, isFavourite: true, updatedAt: '2026-08-01T10:30:00Z' }],
        };

        const result = mergeManifests(localManifest, remoteManifest, 'dev_pc');
        expect(result.hasChanges).toBe(true);
        expect(result.mergedManifest.revision).toBe(6);
        expect(result.mergedManifest.media[0].isFavourite).toBe(true);
    });
});
