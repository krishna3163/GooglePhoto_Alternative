import { describe, it, expect, beforeEach } from 'vitest';
import { initializeVault, encryptMediaWithVaultKey, decryptMediaWithVaultKey } from '../../src/services/cryptoService';
import {
    createManifestFromLocalData,
    encryptManifest,
    decryptManifest,
    manifestMediaToPhotoAssets,
} from '../../src/sync/manifestService';
import { mergeManifests } from '../../src/sync/conflictResolver';
import type { PhotoAsset, Album } from '../../src/types';
import type { VaultInfo } from '../../src/components/layout/Sidebar';
import type { SyncManifest } from '../../src/sync/syncTypes';

describe('Complete Cross-Device Cloud Sync End-to-End Flow', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('Executes complete full-lifecycle cross-device sync across Device A & Device B', async () => {
        // --- 1. SETUP MASTER VAULT ENVELOPE ENCRYPTION ---
        const { masterKey } = await initializeVault('MasterVaultPass2026!');

        // --- 2. DEVICE A: UPLOAD 10 PHOTOS & CREATE ALBUM ---
        const deviceAPhotos: PhotoAsset[] = Array.from({ length: 10 }, (_, i) => ({
            id: `media_id_${i + 1}`,
            fileName: `IMG_${i + 1}.jpg`,
            url: `https://mock.telegram.org/media_${i + 1}`,
            mediaType: 'image',
            timestamp: `2026-08-01T10:0${i}:00Z`,
            isFavourite: i === 0 || i === 1, // 2 favorites
            isTrash: false,
            vaultId: 'vault-personal',
            fileId: `tg_file_devA_${i + 1}`,
            messageId: 2000 + i,
            encryptionMetadata: { v: 1, alg: 'AES-256-GCM', iv: `iv_${i + 1}` },
        }));

        const deviceAAlbums: Album[] = [
            { id: 'album_trip', name: 'Summer Trip', createdAt: '2026-08-01', photoIds: ['media_id_1', 'media_id_2'] },
        ];

        const vaults: VaultInfo[] = [
            { id: 'vault-personal', name: 'Personal Vault', type: 'photos', chatId: '987654321' },
        ];

        // Device A pushes initial Manifest Rev 1
        const manifestA_Rev1 = createManifestFromLocalData(
            '987654321',
            'device_windows_PC',
            1,
            deviceAPhotos,
            deviceAAlbums,
            vaults
        );

        const { encryptedBlob: remoteBlobRev1, metadata: remoteMetaRev1 } = await encryptManifest(manifestA_Rev1, masterKey);

        // --- 3. DEVICE B: LOGIN & INITIAL ONBOARDING SYNC ---
        // Device B has empty local storage
        let deviceBPhotos: PhotoAsset[] = [];
        let deviceBAlbums: Album[] = [];
        expect(deviceBPhotos).toHaveLength(0);

        // Device B downloads and decrypts Manifest Rev 1
        const decryptedRev1 = await decryptManifest(remoteBlobRev1, masterKey, remoteMetaRev1);
        expect(decryptedRev1.revision).toBe(1);

        deviceBPhotos = manifestMediaToPhotoAssets(decryptedRev1.media);
        deviceBAlbums = decryptedRev1.albums.map(a => ({
            id: a.id,
            name: a.name,
            createdAt: a.createdAt,
            photoIds: a.photoIds,
        }));

        // Device B now has all 10 photos, 2 favorites, and 1 album immediately without re-uploading
        expect(deviceBPhotos).toHaveLength(10);
        expect(deviceBPhotos.filter(p => p.isFavourite)).toHaveLength(2);
        expect(deviceBAlbums).toHaveLength(1);
        expect(deviceBAlbums[0].name).toBe('Summer Trip');

        // --- 4. DEVICE B: ON-DEMAND ENCRYPTED MEDIA DECRYPT ---
        const testPayload = 'High resolution photo raw bytes content';
        const rawBlob = new Blob([testPayload], { type: 'image/jpeg' });
        const { encryptedBlob: encryptedPhotoData, metadata: photoMeta } = await encryptMediaWithVaultKey(rawBlob, masterKey);

        // Decrypt in memory on Device B
        const decryptedPhotoBlob = await decryptMediaWithVaultKey(encryptedPhotoData, masterKey, photoMeta);
        expect(await decryptedPhotoBlob.text()).toBe(testPayload);

        // --- 5. DEVICE B: CRUD EDITS WHILE ACTIVE ---
        // (a) Favorite photo 3
        deviceBPhotos = deviceBPhotos.map(p => p.id === 'media_id_3' ? { ...p, isFavourite: true, timestamp: '2026-08-02T10:00:00Z' } : p);

        // (b) Rename photo 4
        deviceBPhotos = deviceBPhotos.map(p => p.id === 'media_id_4' ? { ...p, fileName: 'Goa_Sunset.jpg', timestamp: '2026-08-02T10:00:00Z' } : p);

        // (c) Move photo 5 to Trash
        deviceBPhotos = deviceBPhotos.map(p => p.id === 'media_id_5' ? { ...p, isTrash: true, deletedAt: '2026-08-02T10:00:00Z', timestamp: '2026-08-02T10:00:00Z' } : p);

        // (d) Create new Album "Best of 2026"
        const newAlbumB: Album = { id: 'album_best', name: 'Best of 2026', createdAt: '2026-08-02', photoIds: ['media_id_3', 'media_id_4'] };
        deviceBAlbums.push(newAlbumB);

        // Device B creates and encrypts Manifest Rev 2
        const manifestB_Rev2 = createManifestFromLocalData(
            '987654321',
            'device_android_phone',
            2,
            deviceBPhotos,
            deviceBAlbums,
            vaults
        );

        const { encryptedBlob: remoteBlobRev2, metadata: remoteMetaRev2 } = await encryptManifest(manifestB_Rev2, masterKey);

        // --- 6. DEVICE A: BACKGROUND SYNC TO PULL REV 2 ---
        const decryptedRev2 = await decryptManifest(remoteBlobRev2, masterKey, remoteMetaRev2);
        const { mergedManifest } = mergeManifests(manifestA_Rev1, decryptedRev2, 'device_windows_PC');

        const deviceAPhotosAfterSync = manifestMediaToPhotoAssets(mergedManifest.media);
        const deviceAAlbumsAfterSync = mergedManifest.albums;

        // Verify Device A reflects all Device B changes seamlessly!
        expect(deviceAPhotosAfterSync.find(p => p.id === 'media_id_3')?.isFavourite).toBe(true);
        expect(deviceAPhotosAfterSync.find(p => p.id === 'media_id_4')?.fileName).toBe('Goa_Sunset.jpg');
        expect(deviceAPhotosAfterSync.find(p => p.id === 'media_id_5')?.isTrash).toBe(true);
        expect(deviceAAlbumsAfterSync.some(a => a.name === 'Best of 2026')).toBe(true);
        expect(deviceAAlbumsAfterSync.some(a => a.name === 'Summer Trip')).toBe(true);
    });
});
