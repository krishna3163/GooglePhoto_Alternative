import { describe, it, expect } from 'vitest';
import { mergeManifests } from '../../src/sync/conflictResolver';
import type { SyncManifest, ManifestMediaItem } from '../../src/sync/syncTypes';

describe('Delta Synchronization & Monotonic Revision Flow', () => {
    it('1. Propagates incremental updates without downloading unchanged items', () => {
        const photo1: ManifestMediaItem = {
            id: 'm_1',
            vaultId: 'vault_personal',
            fileName: 'A.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 1000,
            createdAt: '2026-08-01T10:00:00Z',
            updatedAt: '2026-08-01T10:00:00Z',
            isFavourite: false,
            isTrash: false,
            albumIds: [],
            tags: [],
            telegram: { original: { chatId: '1', fileId: 'f1' } },
            encryption: { v: 1, alg: 'AES-256-GCM', iv: 'iv1' },
        };

        const photo2: ManifestMediaItem = {
            ...photo1,
            id: 'm_2',
            fileName: 'B.jpg',
        };

        // Device A has rev 1
        const manifestA: SyncManifest = {
            version: 1,
            accountId: '123',
            revision: 1,
            updatedAt: '2026-08-01T10:00:00Z',
            lastModifiedByDeviceId: 'dev_A',
            vaults: [],
            albums: [],
            media: [photo1, photo2],
        };

        // Device B updates photo2 to favorite on rev 2
        const manifestB: SyncManifest = {
            ...manifestA,
            revision: 2,
            updatedAt: '2026-08-01T10:05:00Z',
            lastModifiedByDeviceId: 'dev_B',
            media: [photo1, { ...photo2, isFavourite: true, updatedAt: '2026-08-01T10:05:00Z' }],
            deltaHistory: [{
                revision: 2,
                timestamp: '2026-08-01T10:05:00Z',
                deviceId: 'dev_B',
                operations: [{ opType: 'UPDATE_MEDIA', entityId: 'm_2', vaultId: 'vault_personal', fieldModified: 'isFavourite' }],
            }],
        };

        const { mergedManifest, hasChanges } = mergeManifests(manifestA, manifestB, 'dev_A');

        expect(hasChanges).toBe(true);
        expect(mergedManifest.revision).toBe(3);
        expect(mergedManifest.media.find(m => m.id === 'm_2')?.isFavourite).toBe(true);
        expect(mergedManifest.media.find(m => m.id === 'm_1')?.isFavourite).toBe(false);
    });

    it('2. Rejects stale revisions from overwriting newer server revisions', () => {
        const itemV1: ManifestMediaItem = {
            id: 'm_1',
            vaultId: 'v1',
            fileName: 'OldName.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 100,
            createdAt: '2026-08-01T08:00:00Z',
            updatedAt: '2026-08-01T08:00:00Z',
            isFavourite: false,
            isTrash: false,
            albumIds: [],
            tags: [],
            telegram: { original: { chatId: '1', fileId: 'f1' } },
            encryption: { v: 1, alg: 'AES-256-GCM', iv: 'iv1' },
        };

        const currentRemote: SyncManifest = {
            version: 1,
            accountId: '123',
            revision: 10,
            updatedAt: '2026-08-01T12:00:00Z',
            lastModifiedByDeviceId: 'dev_server',
            vaults: [],
            albums: [],
            media: [{ ...itemV1, fileName: 'CurrentNewName.jpg', updatedAt: '2026-08-01T12:00:00Z' }],
        };

        const staleLocal: SyncManifest = {
            version: 1,
            accountId: '123',
            revision: 3,
            updatedAt: '2026-08-01T09:00:00Z',
            lastModifiedByDeviceId: 'dev_offline',
            vaults: [],
            albums: [],
            media: [itemV1],
        };

        const { mergedManifest } = mergeManifests(staleLocal, currentRemote, 'dev_offline');
        expect(mergedManifest.media[0].fileName).toBe('CurrentNewName.jpg');
    });
});
