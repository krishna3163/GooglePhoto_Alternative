import { describe, it, expect } from 'vitest';
import { initializeVault } from '../../src/services/cryptoService';
import {
    createManifestFromLocalData,
    encryptManifest,
    decryptManifest,
    validateManifest,
} from '../../src/sync/manifestService';
import type { PhotoAsset, Album } from '../../src/types';

describe('Remote Sync Manifest Encryption & Schema Validation', () => {
    it('1. Serializes local library and encrypts with AES-256-GCM', async () => {
        const { masterKey } = await initializeVault('SyncPassword2026!');

        const mockPhotos: PhotoAsset[] = [
            {
                id: 'media_101',
                fileName: 'Himalayas.jpg',
                url: 'https://example.com/101.jpg',
                mediaType: 'image',
                timestamp: '2026-08-10T10:00:00Z',
                isFavourite: true,
                vaultId: 'vault-personal',
            },
        ];
        const mockAlbums: Album[] = [
            {
                id: 'album_1',
                name: 'Travel Memories',
                createdAt: '2026-08-10T10:00:00Z',
                photoIds: ['media_101'],
            },
        ];

        const manifest = createManifestFromLocalData(
            '123456789',
            'dev_pc_1',
            1,
            mockPhotos,
            mockAlbums,
            [{ id: 'vault-personal', name: 'Personal Vault', type: 'photos', chatId: '123456789' }]
        );

        expect(validateManifest(manifest)).toBe(true);
        expect(manifest.media).toHaveLength(1);
        expect(manifest.revision).toBe(1);

        // Encrypt
        const { encryptedBlob, metadata } = await encryptManifest(manifest, masterKey);
        expect(metadata.alg).toBe('AES-256-GCM');
        expect(metadata.iv).toBeDefined();
        expect(encryptedBlob.size).toBeGreaterThan(50);

        // Decrypt
        const decrypted = await decryptManifest(encryptedBlob, masterKey, metadata);
        expect(decrypted.accountId).toBe('123456789');
        expect(decrypted.media[0].fileName).toBe('Himalayas.jpg');
        expect(decrypted.media[0].isFavourite).toBe(true);
    });

    it('2. Fails safely and rejects decryption when wrong vault key is supplied', async () => {
        const { masterKey: correctKey } = await initializeVault('CorrectPassword');
        const { masterKey: wrongKey } = await initializeVault('WrongPassword');

        const manifest = createManifestFromLocalData('123', 'dev_1', 1, [], [], []);
        const { encryptedBlob, metadata } = await encryptManifest(manifest, correctKey);

        await expect(decryptManifest(encryptedBlob, wrongKey, metadata)).rejects.toThrow();
    });

    it('3. Fails safely on corrupted manifest data without crashing', async () => {
        const { masterKey } = await initializeVault('TestPassword');
        const corruptedBlob = new Blob(['{ corrupted bytes invalid payload }'], { type: 'application/octet-stream' });
        const metadata = { v: 1, alg: 'AES-256-GCM', iv: 'AAABBBCCCDDDEEEFFF111222' };

        await expect(decryptManifest(corruptedBlob, masterKey, metadata)).rejects.toThrow();
    });
});
