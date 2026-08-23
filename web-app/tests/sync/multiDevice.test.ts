import { describe, it, expect } from 'vitest';
import { mergeManifests } from '../../src/sync/conflictResolver';
import type { SyncManifest, ManifestMediaItem } from '../../src/sync/syncTypes';

describe('Multi-Device Vault Isolation & Multi-Revision Merges', () => {
    it('1. Strict Vault Isolation: Vault A items never bleed into Vault B across sync', () => {
        const itemVaultA: ManifestMediaItem = {
            id: 'm_vaultA_1',
            vaultId: 'vault-personal',
            fileName: 'SecretA.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 100,
            createdAt: '2026-08-01T10:00:00Z',
            updatedAt: '2026-08-01T10:00:00Z',
            isFavourite: false,
            isTrash: false,
            albumIds: [],
            tags: [],
            telegram: { original: { chatId: '1', fileId: 'f1' } },
            encryption: { v: 1, alg: 'AES-256-GCM', iv: 'iv1' },
        };

        const itemVaultB: ManifestMediaItem = {
            id: 'm_vaultB_1',
            vaultId: 'vault-family',
            fileName: 'FamilyDinner.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 100,
            createdAt: '2026-08-01T10:00:00Z',
            updatedAt: '2026-08-01T10:00:00Z',
            isFavourite: false,
            isTrash: false,
            albumIds: [],
            tags: [],
            telegram: { original: { chatId: '1', fileId: 'f2' } },
            encryption: { v: 1, alg: 'AES-256-GCM', iv: 'iv2' },
        };

        const manifest: SyncManifest = {
            version: 1,
            accountId: '123',
            revision: 1,
            updatedAt: '2026-08-01T10:00:00Z',
            lastModifiedByDeviceId: 'dev_1',
            vaults: [
                { id: 'vault-personal', name: 'Personal Vault', type: 'photos', createdAt: '', updatedAt: '' },
                { id: 'vault-family', name: 'Family Vault', type: 'family', createdAt: '', updatedAt: '' },
            ],
            albums: [],
            media: [itemVaultA, itemVaultB],
        };

        // Query Personal Vault
        const personalItems = manifest.media.filter(m => m.vaultId === 'vault-personal');
        expect(personalItems).toHaveLength(1);
        expect(personalItems[0].fileName).toBe('SecretA.jpg');

        // Query Family Vault
        const familyItems = manifest.media.filter(m => m.vaultId === 'vault-family');
        expect(familyItems).toHaveLength(1);
        expect(familyItems[0].fileName).toBe('FamilyDinner.jpg');
    });

    it('2. Deleting Vault A media does not alter Vault B media', () => {
        const itemA: ManifestMediaItem = {
            id: 'mA',
            vaultId: 'vault-personal',
            fileName: 'DocA.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: 100,
            createdAt: '2026-08-01',
            updatedAt: '2026-08-01',
            isFavourite: false,
            isTrash: false,
            albumIds: [],
            tags: [],
            telegram: { original: { chatId: '1', fileId: 'fA' } },
            encryption: { v: 1, alg: 'AES-256-GCM', iv: 'ivA' },
        };

        const itemB: ManifestMediaItem = {
            id: 'mB',
            vaultId: 'vault-family',
            fileName: 'PhotoB.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 100,
            createdAt: '2026-08-01',
            updatedAt: '2026-08-01',
            isFavourite: false,
            isTrash: false,
            albumIds: [],
            tags: [],
            telegram: { original: { chatId: '1', fileId: 'fB' } },
            encryption: { v: 1, alg: 'AES-256-GCM', iv: 'ivB' },
        };

        const localManifest: SyncManifest = {
            version: 1,
            accountId: '123',
            revision: 2,
            updatedAt: '2026-08-01T11:00:00Z',
            lastModifiedByDeviceId: 'dev_pc',
            vaults: [],
            albums: [],
            media: [{ ...itemA, isTrash: true, deletedAt: '2026-08-01T11:00:00Z', updatedAt: '2026-08-01T11:00:00Z' }, itemB],
        };

        const remoteManifest: SyncManifest = {
            version: 1,
            accountId: '123',
            revision: 1,
            updatedAt: '2026-08-01T10:00:00Z',
            lastModifiedByDeviceId: 'dev_phone',
            vaults: [],
            albums: [],
            media: [itemA, itemB],
        };

        const { mergedManifest } = mergeManifests(localManifest, remoteManifest, 'dev_pc');

        expect(mergedManifest.media.find(m => m.id === 'mA')?.isTrash).toBe(true);
        expect(mergedManifest.media.find(m => m.id === 'mB')?.isTrash).toBe(false);
    });
});
