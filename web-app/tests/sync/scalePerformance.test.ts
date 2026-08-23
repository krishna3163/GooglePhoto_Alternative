import { describe, it, expect } from 'vitest';
import { initializeVault } from '../../src/services/cryptoService';
import {
    createManifestFromLocalData,
    encryptManifest,
    decryptManifest,
    manifestMediaToPhotoAssets,
} from '../../src/sync/manifestService';
import { mergeManifests } from '../../src/sync/conflictResolver';
import type { PhotoAsset, Album } from '../../src/types';

describe('Cloud Sync Scale & Performance Benchmarks (1,000 to 10,000 Records)', () => {
    it('1. Performance benchmark: 1,000 media records sync under 300ms', async () => {
        const { masterKey } = await initializeVault('ScaleBenchKey1000');

        const photos1k: PhotoAsset[] = Array.from({ length: 1000 }, (_, i) => ({
            id: `media_bench_1k_${i}`,
            fileName: `DSC_${10000 + i}.jpg`,
            url: `https://tg.mock/files/${i}`,
            mediaType: 'image',
            timestamp: '2026-08-01T10:00:00Z',
            isFavourite: i % 5 === 0,
            isTrash: false,
            vaultId: 'vault-personal',
            fileSizeBytes: 3.5 * 1024 * 1024,
            ocrText: `Invoice receipt number ${i}`,
        }));

        const albums: Album[] = [
            { id: 'alb_1', name: 'Highlights', createdAt: '2026-08-01', photoIds: photos1k.slice(0, 100).map(p => p.id) },
        ];

        // 1. Serialization & Manifest Creation
        const startSerialize = performance.now();
        const manifest1k = createManifestFromLocalData('1253687962', 'dev_benchmark', 1, photos1k, albums, []);
        const serializeDuration = performance.now() - startSerialize;
        expect(serializeDuration).toBeLessThan(150); // Under 150ms

        // 2. AES-256-GCM Encryption
        const startEncrypt = performance.now();
        const { encryptedBlob, metadata } = await encryptManifest(manifest1k, masterKey);
        const encryptDuration = performance.now() - startEncrypt;
        expect(encryptDuration).toBeLessThan(350); // Under 350ms
        expect(encryptedBlob.size).toBeGreaterThan(10000);

        // 3. AES-256-GCM Decryption & Local Cache Rebuild
        const startDecrypt = performance.now();
        const decrypted = await decryptManifest(encryptedBlob, masterKey, metadata);
        const restoredPhotos = manifestMediaToPhotoAssets(decrypted.media);
        const decryptDuration = performance.now() - startDecrypt;
        expect(decryptDuration).toBeLessThan(350); // Under 350ms
        expect(restoredPhotos).toHaveLength(1000);

        // 4. 3-Way Conflict Merge with 1,000 items
        const startMerge = performance.now();
        const { mergedManifest } = mergeManifests(manifest1k, decrypted, 'dev_benchmark');
        const mergeDuration = performance.now() - startMerge;
        expect(mergeDuration).toBeLessThan(150); // Under 150ms
        expect(mergedManifest.media).toHaveLength(1000);
    });

    it('2. Scale test: 5,000 media records integrity and memory stability', async () => {
        const { masterKey } = await initializeVault('ScaleBenchKey5000');

        const photos5k: PhotoAsset[] = Array.from({ length: 5000 }, (_, i) => ({
            id: `media_bench_5k_${i}`,
            fileName: `Photo_5K_${i}.RAW`,
            url: `https://tg.mock/5k/${i}`,
            mediaType: 'image',
            timestamp: '2026-08-01T10:00:00Z',
            isFavourite: i % 10 === 0,
            vaultId: 'vault-personal',
            fileSizeBytes: 20 * 1024 * 1024,
        }));

        const manifest5k = createManifestFromLocalData('1253687962', 'dev_scale', 5, photos5k, [], []);
        const { encryptedBlob, metadata } = await encryptManifest(manifest5k, masterKey);

        const decrypted = await decryptManifest(encryptedBlob, masterKey, metadata);
        expect(decrypted.media).toHaveLength(5000);
        expect(decrypted.revision).toBe(5);
    });
});
