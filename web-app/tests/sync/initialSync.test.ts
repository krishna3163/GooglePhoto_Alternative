import { describe, it, expect, beforeEach } from 'vitest';
import { initializeVault } from '../../src/services/cryptoService';
import { createManifestFromLocalData, encryptManifest, decryptManifest, manifestMediaToPhotoAssets } from '../../src/sync/manifestService';
import type { PhotoAsset, Album } from '../../src/types';

describe('Initial Device Onboarding & Lazy Media Sync', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('1. Device B restores full 10-photo library from remote manifest without re-uploading', async () => {
        const { masterKey } = await initializeVault('CrossDeviceVaultKey');

        // Device A library
        const deviceAPhotos: PhotoAsset[] = Array.from({ length: 10 }, (_, i) => ({
            id: `media_${i + 1}`,
            fileName: `Photo_${i + 1}.jpg`,
            url: `https://example.com/media_${i + 1}.jpg`,
            mediaType: 'image',
            timestamp: `2026-08-0${i + 1}T10:00:00Z`,
            isFavourite: i % 2 === 0,
            vaultId: 'vault-personal',
            fileId: `tg_file_id_${i + 1}`,
            messageId: 1000 + i,
        }));

        const deviceAAlbums: Album[] = [
            { id: 'album_1', name: 'Vacation', createdAt: '2026-08-01', photoIds: ['media_1', 'media_2'] },
        ];

        // Device A generates and encrypts remote manifest
        const manifestA = createManifestFromLocalData(
            '123456789',
            'device_pc_A',
            1,
            deviceAPhotos,
            deviceAAlbums,
            [{ id: 'vault-personal', name: 'Personal Vault', type: 'photos', chatId: '123456789' }]
        );

        const { encryptedBlob, metadata } = await encryptManifest(manifestA, masterKey);

        // --- SIMULATE DEVICE B (Empty Local Database) ---
        const deviceBLocalPhotos: PhotoAsset[] = [];
        expect(deviceBLocalPhotos).toHaveLength(0);

        // Device B downloads and decrypts manifest using the same Master Vault Key
        const decryptedManifestB = await decryptManifest(encryptedBlob, masterKey, metadata);
        expect(decryptedManifestB.media).toHaveLength(10);
        expect(decryptedManifestB.albums).toHaveLength(1);

        // Device B maps metadata to runtime PhotoAsset records with lazy Telegram file resolvers
        const deviceBPhotos = manifestMediaToPhotoAssets(decryptedManifestB.media, (fileId) => {
            return `https://api.telegram.org/file/botToken/${fileId}`;
        });

        expect(deviceBPhotos).toHaveLength(10);
        expect(deviceBPhotos[0].fileName).toBe('Photo_1.jpg');
        expect(deviceBPhotos[0].isFavourite).toBe(true);
        expect(deviceBPhotos[0].fileId).toBe('tg_file_id_1');
        expect(deviceBPhotos[0].url).toBe('https://api.telegram.org/file/botToken/tg_file_id_1');
    });

    it('2. Lazy media loading: only metadata is downloaded initially; actual payload is fetched on demand', async () => {
        const { masterKey } = await initializeVault('LazyLoadKey');

        const mockPhoto: PhotoAsset = {
            id: 'photo_highres',
            fileName: '4K_Landscape.png',
            url: '',
            mediaType: 'image',
            timestamp: '2026-08-15',
            fileSizeBytes: 25 * 1024 * 1024, // 25 MB
            vaultId: 'vault-personal',
            fileId: 'tg_large_file_99',
        };

        const manifest = createManifestFromLocalData('123', 'dev_A', 1, [mockPhoto], [], []);
        const { encryptedBlob, metadata } = await encryptManifest(manifest, masterKey);

        // Manifest payload size is small metadata (< 2KB), NOT 25MB media
        expect(encryptedBlob.size).toBeLessThan(3000);

        const decrypted = await decryptManifest(encryptedBlob, masterKey, metadata);
        const assets = manifestMediaToPhotoAssets(decrypted.media);

        // Asset metadata is present, original large media payload is not pre-fetched
        expect(assets[0].fileName).toBe('4K_Landscape.png');
        expect(assets[0].fileSizeBytes).toBe(25 * 1024 * 1024);
    });
});
