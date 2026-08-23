import { describe, it, expect, beforeEach } from 'vitest';
import { initializeVault } from '../../src/services/cryptoService';
import {
    createManifestFromLocalData,
    encryptManifest,
    decryptManifest,
    manifestMediaToPhotoAssets,
} from '../../src/sync/manifestService';
import type { PhotoAsset, Album } from '../../src/types';

describe('Incognito Session & Ephemeral Storage Full Restoration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('1. Restores entire library in Incognito session 1, clears storage, then restores again in Incognito session 2', async () => {
        const { masterKey } = await initializeVault('IncognitoMasterKey2026!');

        // --- STEP 1: PC UPLOADS MEDIA & CREATES REMOTE MANIFEST ---
        const pcPhotos: PhotoAsset[] = [
            { id: 'incog_p1', fileName: 'Sunset.jpg', url: 'https://tg/1', mediaType: 'image', timestamp: '2026-08-01', isFavourite: true, vaultId: 'vault-personal' },
            { id: 'incog_p2', fileName: 'Mountain.jpg', url: 'https://tg/2', mediaType: 'image', timestamp: '2026-08-02', isFavourite: false, vaultId: 'vault-personal' },
            { id: 'incog_p3', fileName: 'Beach.jpg', url: 'https://tg/3', mediaType: 'image', timestamp: '2026-08-03', isFavourite: true, vaultId: 'vault-personal' },
        ];
        const pcAlbums: Album[] = [{ id: 'incog_a1', name: 'Nature', createdAt: '2026-08-01', photoIds: ['incog_p1', 'incog_p2'] }];

        const pcManifest = createManifestFromLocalData('1253687962', 'dev_pc', 1, pcPhotos, pcAlbums, [
            { id: 'vault-personal', name: 'Personal Vault', type: 'photos', chatId: '1253687962' }
        ]);
        const { encryptedBlob: remoteBlob, metadata: remoteMeta } = await encryptManifest(pcManifest, masterKey);

        // --- STEP 2: OPEN INCOGNITO WINDOW 1 (Storage is 100% empty) ---
        localStorage.clear();
        expect(localStorage.length).toBe(0);

        // Incognito Window 1 downloads remote manifest and decrypts locally
        const incognito1Manifest = await decryptManifest(remoteBlob, masterKey, remoteMeta);
        const incognito1Photos = manifestMediaToPhotoAssets(incognito1Manifest.media);

        expect(incognito1Photos).toHaveLength(3);
        expect(incognito1Photos.filter(p => p.isFavourite)).toHaveLength(2);
        expect(incognito1Manifest.albums).toHaveLength(1);
        expect(incognito1Manifest.albums[0].name).toBe('Nature');

        // --- STEP 3: CLOSE INCOGNITO WINDOW 1 (All local data erased) ---
        localStorage.clear();
        sessionStorage.clear();
        expect(localStorage.length).toBe(0);

        // --- STEP 4: OPEN INCOGNITO WINDOW 2 (Storage is 100% empty again) ---
        const incognito2Manifest = await decryptManifest(remoteBlob, masterKey, remoteMeta);
        const incognito2Photos = manifestMediaToPhotoAssets(incognito2Manifest.media);

        expect(incognito2Photos).toHaveLength(3);
        expect(incognito2Photos[0].fileName).toBe('Sunset.jpg');
        expect(incognito2Photos[2].fileName).toBe('Beach.jpg');
        expect(incognito2Manifest.revision).toBe(1);
    });
});
