import { describe, it, expect, beforeEach } from 'vitest';
import {
    storeVectorRecord,
    getVectorRecord,
    deleteVectorRecord,
    clearVectorIndex,
    CURRENT_MODEL_VERSION,
    type VectorRecord,
} from '../../src/intelligence/vectorIndexService';
import { generateTextEmbedding, cosineSimilarity } from '../../src/intelligence/embeddingService';

describe('Phase 3.2 Hardening - Vector Index Lifecycle & Scale Suite', () => {
    beforeEach(async () => {
        await clearVectorIndex();
    });

    it('1. Upload -> Persist -> Reload: Embedding persists with mandatory vaultId', async () => {
        const photoId = 'photo-upload-101';
        const vaultId = 'vault-personal';
        const embedding = Array.from(generateTextEmbedding('sunset beach golden hour'));

        const record: VectorRecord = {
            mediaId: photoId,
            vaultId,
            modelVersion: CURRENT_MODEL_VERSION,
            embedding,
            updatedAt: new Date().toISOString(),
        };

        await storeVectorRecord(record);

        // Simulate reload by fetching from store
        const loaded = await getVectorRecord(photoId);
        expect(loaded).not.toBeNull();
        expect(loaded?.mediaId).toBe(photoId);
        expect(loaded?.vaultId).toBe('vault-personal');
        expect(loaded?.modelVersion).toBe('v1-concept-hybrid');
        expect(loaded?.embedding).toHaveLength(embedding.length);
    });

    it('2. Metadata Edit: Updates vector embedding in-place without duplicate records', async () => {
        const photoId = 'photo-edit-202';
        const initialVector = Array.from(generateTextEmbedding('beach'));

        await storeVectorRecord({
            mediaId: photoId,
            vaultId: 'vault-personal',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: initialVector,
            updatedAt: '2026-08-20T10:00:00Z',
        });

        // Edit metadata -> regenerate vector
        const updatedVector = Array.from(generateTextEmbedding('beach sunset mountain'));
        const newTimestamp = '2026-08-23T12:00:00Z';

        await storeVectorRecord({
            mediaId: photoId,
            vaultId: 'vault-personal',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: updatedVector,
            updatedAt: newTimestamp,
        });

        const result = await getVectorRecord(photoId);
        expect(result?.updatedAt).toBe(newTimestamp);
        expect(result?.embedding).toEqual(updatedVector);
    });

    it('3. Permanent Delete: Completely deletes vector entry from storage', async () => {
        const photoId = 'photo-delete-303';
        await storeVectorRecord({
            mediaId: photoId,
            vaultId: 'vault-personal',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: [0.1, 0.2, 0.3],
            updatedAt: new Date().toISOString(),
        });

        expect(await getVectorRecord(photoId)).not.toBeNull();

        await deleteVectorRecord(photoId);
        expect(await getVectorRecord(photoId)).toBeNull();
    });

    it('4. Model Version Migration: Detects outdated model versions for reindexing', async () => {
        const photoId = 'legacy-photo-404';
        await storeVectorRecord({
            mediaId: photoId,
            vaultId: 'vault-personal',
            modelVersion: 'v0-experimental-old', // outdated model version
            embedding: [0.99, 0.88],
            updatedAt: '2025-01-01T00:00:00Z',
        });

        const loaded = await getVectorRecord(photoId);
        expect(loaded?.modelVersion).not.toBe(CURRENT_MODEL_VERSION);

        // Controlled reindex
        const reindexedEmbedding = Array.from(generateTextEmbedding('reindexed photo'));
        await storeVectorRecord({
            mediaId: photoId,
            vaultId: loaded!.vaultId,
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: reindexedEmbedding,
            updatedAt: new Date().toISOString(),
        });

        const upgraded = await getVectorRecord(photoId);
        expect(upgraded?.modelVersion).toBe(CURRENT_MODEL_VERSION);
    });

    it('5. Scale & Performance: 1,000+ vectors queried in under 50ms', () => {
        const targetQuery = generateTextEmbedding('sunset beach ocean waves');
        const vectorBank: Float32Array[] = [];

        for (let i = 0; i < 1000; i++) {
            const desc = i === 42 ? 'sunset beach ocean waves tropical' : `random photo description keyword ${i}`;
            vectorBank.push(generateTextEmbedding(desc));
        }

        const start = performance.now();
        let topIndex = -1;
        let topScore = -1;

        for (let i = 0; i < vectorBank.length; i++) {
            const score = cosineSimilarity(targetQuery, vectorBank[i]);
            if (score > topScore) {
                topScore = score;
                topIndex = i;
            }
        }
        const elapsed = performance.now() - start;

        expect(topIndex).toBe(42);
        expect(topScore).toBeGreaterThan(0.7);
        expect(elapsed).toBeLessThan(50); // Fast vector similarity search across 1000+ items
    });
});
