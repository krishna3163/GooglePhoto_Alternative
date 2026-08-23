import { describe, it, expect } from 'vitest';
import { computeSHA256, hammingDistance, findDuplicates } from '../../src/services/duplicateService';
import type { PhotoAsset } from '../../src/types';

describe('DuplicateService - Media Hashing & Similarity Suite', () => {
    it('1. Computes matching SHA-256 hash for identical blobs', async () => {
        const data1 = new Blob(['sample-identical-photo-stream-12345'], { type: 'image/jpeg' });
        const data2 = new Blob(['sample-identical-photo-stream-12345'], { type: 'image/jpeg' });
        const data3 = new Blob(['different-photo-stream-99999'], { type: 'image/jpeg' });

        const hash1 = await computeSHA256(data1);
        const hash2 = await computeSHA256(data2);
        const hash3 = await computeSHA256(data3);

        expect(hash1).toHaveLength(64);
        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('2. Calculates Hamming Distance accurately', () => {
        const hashA = '1111000011110000';
        const hashB = '1111000011110000'; // 0 diff
        const hashC = '1111000011110001'; // 1 diff
        const hashD = '0000111100001111'; // 16 diff

        expect(hammingDistance(hashA, hashB)).toBe(0);
        expect(hammingDistance(hashA, hashC)).toBe(1);
        expect(hammingDistance(hashA, hashD)).toBe(16);
    });

    it('3. Detects duplicate groups without mutating or dropping originals', () => {
        const mockPhotos: PhotoAsset[] = [
            {
                id: 'photo-1',
                url: 'https://example.com/1.jpg',
                fileName: 'vacation_sunset.jpg',
                mediaType: 'image',
                timestamp: '2026-08-20T10:00:00Z',
                fileSizeBytes: 2048500,
            },
            {
                id: 'photo-2',
                url: 'https://example.com/2.jpg',
                fileName: 'vacation_sunset.jpg', // exact duplicate name & size
                mediaType: 'image',
                timestamp: '2026-08-20T10:05:00Z',
                fileSizeBytes: 2048500,
            },
            {
                id: 'photo-3',
                url: 'https://example.com/3.jpg',
                fileName: 'unique_mountain.jpg',
                mediaType: 'image',
                timestamp: '2026-08-21T12:00:00Z',
                fileSizeBytes: 4192000,
            },
        ];

        const duplicateGroups = findDuplicates(mockPhotos);

        expect(duplicateGroups).toHaveLength(1);
        expect(duplicateGroups[0].original.id).toBe('photo-1');
        expect(duplicateGroups[0].duplicates).toHaveLength(1);
        expect(duplicateGroups[0].duplicates[0].id).toBe('photo-2');
    });
});
