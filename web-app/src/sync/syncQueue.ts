import type { SyncOperation, SyncOperationType } from './syncTypes';

const QUEUE_STORAGE_KEY = 'telegphoto_sync_queue';
const RETRY_DELAYS_MS = [2000, 5000, 15000, 60000];
const MAX_RETRIES = 4;

/**
 * Loads all queued operations from persistent local storage.
 */
export function getStoredSyncQueue(): SyncOperation[] {
    try {
        const data = localStorage.getItem(QUEUE_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Persists the sync operations queue.
 */
export function saveSyncQueue(queue: SyncOperation[]): void {
    try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
        console.error('Failed to persist sync queue:', err);
    }
}

/**
 * Enqueue a new operation.
 */
export function enqueueSyncOperation(
    type: SyncOperationType,
    entityId: string,
    vaultId: string,
    payload: any,
    deviceId: string
): SyncOperation {
    const queue = getStoredSyncQueue();
    const operation: SyncOperation = {
        id: `sync-op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        entityId,
        vaultId,
        payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        retryCount: 0,
        status: 'PENDING',
        deviceId,
    };

    queue.push(operation);
    saveSyncQueue(queue);
    return operation;
}

/**
 * Get all operations pending execution.
 */
export function getPendingOperations(): SyncOperation[] {
    const queue = getStoredSyncQueue();
    return queue.filter(op => op.status === 'PENDING' || op.status === 'SYNCING');
}

/**
 * Get failed operations requiring user review or manual retry.
 */
export function getFailedOperations(): SyncOperation[] {
    const queue = getStoredSyncQueue();
    return queue.filter(op => op.status === 'FAILED');
}

/**
 * Update operation status.
 */
export function updateOperationStatus(
    opId: string,
    status: SyncOperation['status'],
    error?: string
): void {
    const queue = getStoredSyncQueue();
    const updated = queue.map(op => {
        if (op.id === opId) {
            const nextRetry = status === 'FAILED' ? op.retryCount + 1 : op.retryCount;
            const finalStatus = nextRetry >= MAX_RETRIES ? 'FAILED' : status;
            return {
                ...op,
                status: finalStatus,
                retryCount: nextRetry,
                lastError: error,
                updatedAt: new Date().toISOString(),
            };
        }
        return op;
    });

    saveSyncQueue(updated);
}

/**
 * Remove completed operations from the persistent queue.
 */
export function clearCompletedOperations(): void {
    const queue = getStoredSyncQueue();
    const filtered = queue.filter(op => op.status !== 'COMPLETED');
    saveSyncQueue(filtered);
}

/**
 * Reset all failed operations to PENDING for manual retry.
 */
export function retryFailedOperations(): void {
    const queue = getStoredSyncQueue();
    const updated = queue.map(op => {
        if (op.status === 'FAILED') {
            return {
                ...op,
                status: 'PENDING' as const,
                retryCount: 0,
                lastError: undefined,
                updatedAt: new Date().toISOString(),
            };
        }
        return op;
    });
    saveSyncQueue(updated);
}

/**
 * Calculate next retry delay using exponential backoff.
 */
export function getRetryDelayMs(retryCount: number): number {
    return RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
}
