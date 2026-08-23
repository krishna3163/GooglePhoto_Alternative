import { describe, it, expect } from 'vitest';
import {
    calculateFaceDistance,
    clusterFaces,
    renamePersonGroup,
    type FaceDescriptor,
} from '../../src/intelligence/faceClusteringService';
import type { PhotoAsset } from '../../src/types';

describe('Phase 3.3 - Privacy-First Face Clustering Engine Suite', () => {
    // Generate synthetic 128-d normalized embeddings with distinct angular directions
    const makeEmbedding = (seed: number, jitter: number = 0): number[] => {
        const arr = new Array(128).fill(0).map((_, i) => Math.sin(seed * (i + 1)) + jitter);
        const norm = Math.sqrt(arr.reduce((acc, v) => acc + v * v, 0));
        return arr.map(v => v / norm);
    };

    const personA_emb1 = makeEmbedding(1.0);
    const personA_emb2 = makeEmbedding(1.0, 0.05); // slight variation of Person A
    const personB_emb1 = makeEmbedding(7.5); // completely orthogonal Person B

    const mockPhotosMap = new Map<string, PhotoAsset>([
        ['photo-1', { id: 'photo-1', url: 'https://example.com/p1.jpg', fileName: 'p1.jpg', mediaType: 'image', timestamp: '2026-08-01' }],
        ['photo-2', { id: 'photo-2', url: 'https://example.com/p2.jpg', fileName: 'p2.jpg', mediaType: 'image', timestamp: '2026-08-02' }],
        ['photo-3', { id: 'photo-3', url: 'https://example.com/p3.jpg', fileName: 'p3.jpg', mediaType: 'image', timestamp: '2026-08-03' }],
    ]);

    it('1. Calculates Euclidean face distance accurately', () => {
        const distSame = calculateFaceDistance(personA_emb1, personA_emb1);
        expect(distSame).toBe(0);

        const distClose = calculateFaceDistance(personA_emb1, personA_emb2);
        expect(distClose).toBeLessThan(0.1);

        const distFar = calculateFaceDistance(personA_emb1, personB_emb1);
        expect(distFar).toBeGreaterThan(0.4);
    });

    it('2. Clusters matching faces into unified Person Groups with default names', () => {
        const faces: FaceDescriptor[] = [
            { faceId: 'face-1', photoId: 'photo-1', embedding: personA_emb1 },
            { faceId: 'face-2', photoId: 'photo-2', embedding: personA_emb2 }, // Same Person A
            { faceId: 'face-3', photoId: 'photo-3', embedding: personB_emb1 }, // Distinct Person B
        ];

        const groups = clusterFaces(faces, mockPhotosMap);

        expect(groups).toHaveLength(2);

        // Person A cluster has 2 photos
        const groupA = groups.find(g => g.faceIds.includes('face-1'));
        expect(groupA?.faceIds).toContain('face-2');
        expect(groupA?.photoIds).toContain('photo-1');
        expect(groupA?.photoIds).toContain('photo-2');
        expect(groupA?.name).toBe('Person #1');

        // Person B cluster has 1 photo
        const groupB = groups.find(g => g.faceIds.includes('face-3'));
        expect(groupB?.faceIds).toHaveLength(1);
        expect(groupB?.photoIds).toContain('photo-3');
        expect(groupB?.name).toBe('Person #2');
    });

    it('3. Allows user to safely customize / rename Person Groups', () => {
        const faces: FaceDescriptor[] = [
            { faceId: 'face-1', photoId: 'photo-1', embedding: personA_emb1 },
        ];

        let groups = clusterFaces(faces, mockPhotosMap);
        const targetId = groups[0].id;

        groups = renamePersonGroup(groups, targetId, 'Krishna (Brother)');
        expect(groups[0].name).toBe('Krishna (Brother)');

        // Reject empty names
        groups = renamePersonGroup(groups, targetId, '   ');
        expect(groups[0].name).toBe('Krishna (Brother)');
    });
});
