import { describe, it, expect, beforeEach } from 'vitest';
import {
    storeVectorRecord,
    getVectorRecord,
    deleteVectorRecord,
    clearVectorIndex,
    CURRENT_MODEL_VERSION,
    type VectorRecord,
} from '../../src/intelligence/vectorIndexService';

describe('Phase 3.2 - Durable Vector Index Suite', () => {
    beforeEach(async () => {
        await clearVectorIndex();
    });

    it('1. Stores and retrieves vector embedding with modelVersion and vaultId', async () => {
        const mockVector: VectorRecord = {
            mediaId: 'photo-v1',
            vaultId: 'vault-personal',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: [0.12, 0.45, 0.78, 0.99],
            updatedAt: new Date().toISOString(),
        };

        await storeVectorRecord(mockVector);
        const retrieved = await getVectorRecord('photo-v1');

        expect(retrieved).not.toBeNull();
        expect(retrieved?.mediaId).toBe('photo-v1');
        expect(retrieved?.vaultId).toBe('vault-personal');
        expect(retrieved?.modelVersion).toBe(CURRENT_MODEL_VERSION);
        expect(retrieved?.embedding).toEqual(mockVector.embedding);
    });

    it('2. Deletes vector embedding cleanly upon media removal', async () => {
        const mockVector: VectorRecord = {
            mediaId: 'photo-to-delete',
            vaultId: 'vault-personal',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: [0.33, 0.66],
            updatedAt: new Date().toISOString(),
        };

        await storeVectorRecord(mockVector);
        expect(await getVectorRecord('photo-to-delete')).not.toBeNull();

        await deleteVectorRecord('photo-to-delete');
        expect(await getVectorRecord('photo-to-delete')).toBeNull();
    });

    it('3. Clears entire vector store cleanly', async () => {
        await storeVectorRecord({
            mediaId: 'p1',
            vaultId: 'v1',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: [1, 2],
            updatedAt: new Date().toISOString(),
        });
        await storeVectorRecord({
            mediaId: 'p2',
            vaultId: 'v1',
            modelVersion: CURRENT_MODEL_VERSION,
            embedding: [3, 4],
            updatedAt: new Date().toISOString(),
        });

        await clearVectorIndex();
        expect(await getVectorRecord('p1')).toBeNull();
        expect(await getVectorRecord('p2')).toBeNull();
    });
});
