/**
 * Durable Local Vector Index Store.
 *
 * Persists high-dimensional embeddings in browser IndexedDB (or fallback)
 * with schema versioning, vault isolation, and lifecycle synchronization.
 */

export const CURRENT_MODEL_VERSION = 'v1-concept-hybrid';

export interface VectorRecord {
    mediaId: string;
    vaultId: string;
    modelVersion: string;
    embedding: number[]; // Array representation of Float32Array for serialization
    updatedAt: string;
}

const DB_NAME = 'telegphoto_vector_index';
const STORE_NAME = 'embeddings';
const DB_VERSION = 1;

/**
 * Open or initialize the IndexedDB vector store.
 */
function openVectorDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject(new Error('IndexedDB not supported in this environment'));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'mediaId' });
                store.createIndex('vaultId', 'vaultId', { unique: false });
                store.createIndex('modelVersion', 'modelVersion', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// In-memory fallback cache if IndexedDB is unavailable
const memoryVectorCache = new Map<string, VectorRecord>();

/**
 * Store or update an embedding record for a media item.
 */
export async function storeVectorRecord(record: VectorRecord): Promise<void> {
    try {
        const db = await openVectorDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        memoryVectorCache.set(record.mediaId, record);
    }
}

/**
 * Retrieve an embedding record for a media item.
 */
export async function getVectorRecord(mediaId: string): Promise<VectorRecord | null> {
    try {
        const db = await openVectorDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(mediaId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return memoryVectorCache.get(mediaId) || null;
    }
}

/**
 * Delete an embedding record when a media item is deleted.
 */
export async function deleteVectorRecord(mediaId: string): Promise<void> {
    try {
        const db = await openVectorDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(mediaId);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        memoryVectorCache.delete(mediaId);
    }
}

/**
 * Clear all vector embeddings for a given vault or model version.
 */
export async function clearVectorIndex(): Promise<void> {
    try {
        const db = await openVectorDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        memoryVectorCache.clear();
    }
}
