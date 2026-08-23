import { describe, it, expect, beforeEach } from 'vitest';
import {
    enqueueSyncOperation,
    getStoredSyncQueue,
    getPendingOperations,
    getFailedOperations,
    updateOperationStatus,
    clearCompletedOperations,
    retryFailedOperations,
    getRetryDelayMs,
} from '../../src/sync/syncQueue';

describe('Offline Sync Operation Queue & Exponential Backoff', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('1. Enqueues offline operations and persists in local storage', () => {
        enqueueSyncOperation('CREATE_MEDIA', 'm_1', 'vault_personal', { fileName: 'OfflinePhoto.jpg' }, 'dev_1');
        enqueueSyncOperation('UPDATE_MEDIA', 'm_1', 'vault_personal', { isFavourite: true }, 'dev_1');

        const queue = getStoredSyncQueue();
        expect(queue).toHaveLength(2);
        expect(queue[0].type).toBe('CREATE_MEDIA');
        expect(queue[1].type).toBe('UPDATE_MEDIA');
        expect(queue[0].status).toBe('PENDING');
    });

    it('2. Drains pending operations and clears completed operations', () => {
        const op = enqueueSyncOperation('DELETE_MEDIA', 'm_2', 'vault_personal', {}, 'dev_1');
        expect(getPendingOperations()).toHaveLength(1);

        updateOperationStatus(op.id, 'COMPLETED');
        expect(getPendingOperations()).toHaveLength(0);

        clearCompletedOperations();
        expect(getStoredSyncQueue()).toHaveLength(0);
    });

    it('3. Implements exponential backoff retry delays and caps at MAX_RETRIES', () => {
        expect(getRetryDelayMs(0)).toBe(2000);
        expect(getRetryDelayMs(1)).toBe(5000);
        expect(getRetryDelayMs(2)).toBe(15000);
        expect(getRetryDelayMs(3)).toBe(60000);
        expect(getRetryDelayMs(10)).toBe(60000); // capped

        const op = enqueueSyncOperation('CREATE_ALBUM', 'alb_1', 'vault_personal', { name: 'Test' }, 'dev_1');

        // Simulate 4 failed attempts
        updateOperationStatus(op.id, 'FAILED', 'Network error');
        updateOperationStatus(op.id, 'FAILED', 'Network timeout');
        updateOperationStatus(op.id, 'FAILED', '503 Service Unavailable');
        updateOperationStatus(op.id, 'FAILED', 'Max attempts exceeded');

        const failed = getFailedOperations();
        expect(failed).toHaveLength(1);
        expect(failed[0].status).toBe('FAILED');
        expect(failed[0].retryCount).toBe(4);

        // Manual retry resets to PENDING
        retryFailedOperations();
        expect(getPendingOperations()).toHaveLength(1);
        expect(getPendingOperations()[0].retryCount).toBe(0);
    });
});
