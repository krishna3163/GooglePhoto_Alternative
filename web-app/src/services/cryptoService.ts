/**
 * Production-Grade Zero-Knowledge Cryptographic & Key Management Architecture.
 *
 * Implements:
 * 1. Envelope Encryption (User Password -> KEK -> Wrapped Vault Key -> AES-256-GCM Media).
 * 2. Instant Password Change (Re-wrap Vault Key without re-encrypting media library).
 * 3. Offline Emergency Recovery Key (Cryptographically secure recovery phrase unwrap).
 * 4. Key & Algorithm Versioning (Backward-compatible schema).
 * 5. Unique, non-repeating 96-bit IV per encrypted item.
 * 6. Object URL Memory Hygiene helpers.
 */

const CURRENT_KEY_VERSION = 1;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const SALT_LENGTH = 16;

export interface EncryptionMetadata {
    v: number;
    alg: 'AES-256-GCM';
    iv: string; // Base64
    salt?: string; // Base64
}

export interface VaultKeyBundle {
    wrappedVaultKey: string; // Base64 (Encrypted with KEK derived from password)
    wrappedWithRecovery: string; // Base64 (Encrypted with KEK derived from recovery key)
    recoveryKey: string; // Hex string given to user once for emergency offline recovery
    salt: string; // Base64
    v: number;
}

// ---------------------------------------------------------------------------
// Helpers: ArrayBuffer & Base64 conversions
// ---------------------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// ---------------------------------------------------------------------------
// 1. Key Derivation (KEK)
// ---------------------------------------------------------------------------

async function deriveKEK(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
    );
}

// ---------------------------------------------------------------------------
// 2. Vault Key Initialization & Envelope Encryption
// ---------------------------------------------------------------------------

/**
 * Initialize a new encrypted Vault:
 * 1. Generates an exportable random 256-bit AES-GCM Master Vault Key.
 * 2. Generates an offline Recovery Key.
 * 3. Wraps the Master Vault Key with both the user password and the recovery key.
 */
export async function initializeVault(password: string): Promise<{ bundle: VaultKeyBundle; masterKey: CryptoKey }> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const kek = await deriveKEK(password, salt);

    // Generate random Master Vault Key
    const masterKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: KEY_LENGTH },
        true, // exportable for wrapping
        ['encrypt', 'decrypt']
    );

    // Generate Recovery Key
    const recoveryBytes = crypto.getRandomValues(new Uint8Array(32));
    const recoveryKey = Array.from(recoveryBytes, b => b.toString(16).padStart(2, '0')).join('');
    const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const recoveryKEK = await deriveKEK(recoveryKey, recoverySalt);

    // Wrap Master Vault Key with password KEK
    const wrapIV = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const wrappedBuffer = await crypto.subtle.wrapKey(
        'raw',
        masterKey,
        kek,
        { name: 'AES-GCM', iv: wrapIV }
    );

    // Wrap Master Vault Key with recovery KEK
    const recWrapIV = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const recWrappedBuffer = await crypto.subtle.wrapKey(
        'raw',
        masterKey,
        recoveryKEK,
        { name: 'AES-GCM', iv: recWrapIV }
    );

    // Prepend IV to wrapped keys
    const combinedWrapped = new Uint8Array(IV_LENGTH + wrappedBuffer.byteLength);
    combinedWrapped.set(wrapIV, 0);
    combinedWrapped.set(new Uint8Array(wrappedBuffer), IV_LENGTH);

    const combinedRecWrapped = new Uint8Array(IV_LENGTH + recWrappedBuffer.byteLength);
    combinedRecWrapped.set(recWrapIV, 0);
    combinedRecWrapped.set(new Uint8Array(recWrappedBuffer), IV_LENGTH);

    const bundle: VaultKeyBundle = {
        wrappedVaultKey: bufferToBase64(combinedWrapped.buffer),
        wrappedWithRecovery: bufferToBase64(combinedRecWrapped.buffer),
        recoveryKey,
        salt: bufferToBase64(salt.buffer),
        v: CURRENT_KEY_VERSION,
    };

    return { bundle, masterKey };
}

/**
 * Unlock the Master Vault Key using user password.
 */
export async function unlockVaultWithPassword(password: string, bundle: VaultKeyBundle): Promise<CryptoKey> {
    const salt = new Uint8Array(base64ToBuffer(bundle.salt));
    const kek = await deriveKEK(password, salt);

    const combined = new Uint8Array(base64ToBuffer(bundle.wrappedVaultKey));
    const iv = combined.slice(0, IV_LENGTH);
    const wrappedKeyData = combined.slice(IV_LENGTH);

    return crypto.subtle.unwrapKey(
        'raw',
        wrappedKeyData,
        kek,
        { name: 'AES-GCM', iv },
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Unlock the Master Vault Key using offline Recovery Key.
 */
export async function unlockVaultWithRecoveryKey(recoveryKey: string, bundle: VaultKeyBundle): Promise<CryptoKey> {
    const salt = new Uint8Array(base64ToBuffer(bundle.salt));
    const recoveryKEK = await deriveKEK(recoveryKey, salt);

    const combined = new Uint8Array(base64ToBuffer(bundle.wrappedWithRecovery));
    const iv = combined.slice(0, IV_LENGTH);
    const wrappedKeyData = combined.slice(IV_LENGTH);

    return crypto.subtle.unwrapKey(
        'raw',
        wrappedKeyData,
        recoveryKEK,
        { name: 'AES-GCM', iv },
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Change Vault Password without re-encrypting media.
 * Re-wraps the active Master Vault Key with the new password.
 */
export async function changeVaultPassword(
    masterKey: CryptoKey,
    newPassword: string,
    existingBundle: VaultKeyBundle
): Promise<VaultKeyBundle> {
    const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const newKEK = await deriveKEK(newPassword, newSalt);

    const wrapIV = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const wrappedBuffer = await crypto.subtle.wrapKey(
        'raw',
        masterKey,
        newKEK,
        { name: 'AES-GCM', iv: wrapIV }
    );

    const combinedWrapped = new Uint8Array(IV_LENGTH + wrappedBuffer.byteLength);
    combinedWrapped.set(wrapIV, 0);
    combinedWrapped.set(new Uint8Array(wrappedBuffer), IV_LENGTH);

    return {
        ...existingBundle,
        wrappedVaultKey: bufferToBase64(combinedWrapped.buffer),
        salt: bufferToBase64(newSalt.buffer),
    };
}

// ---------------------------------------------------------------------------
// 3. Media Encryption & Decryption
// ---------------------------------------------------------------------------

/**
 * Encrypt media data with active Master Vault Key using unique 96-bit IV.
 */
export async function encryptMediaWithVaultKey(
    data: Blob | File,
    masterKey: CryptoKey
): Promise<{ encryptedBlob: Blob; metadata: EncryptionMetadata }> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const buffer = await data.arrayBuffer();

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        masterKey,
        buffer
    );

    const metadata: EncryptionMetadata = {
        v: CURRENT_KEY_VERSION,
        alg: 'AES-256-GCM',
        iv: bufferToBase64(iv.buffer),
    };

    return {
        encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
        metadata,
    };
}

/**
 * Decrypt media data with active Master Vault Key and metadata.
 */
export async function decryptMediaWithVaultKey(
    encryptedBlob: Blob,
    masterKey: CryptoKey,
    metadata: EncryptionMetadata,
    mimeType: string = 'image/jpeg'
): Promise<Blob> {
    const iv = new Uint8Array(base64ToBuffer(metadata.iv));
    const buffer = await encryptedBlob.arrayBuffer();

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        masterKey,
        buffer
    );

    return new Blob([decryptedBuffer], { type: mimeType });
}

// ---------------------------------------------------------------------------
// 4. Memory Hygiene & Object URL Lifecycle Tracker
// ---------------------------------------------------------------------------

const activeObjectUrls = new Set<string>();

/**
 * Create a tracked Object URL that can be cleaned up reliably.
 */
export function createTrackedBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    activeObjectUrls.add(url);
    return url;
}

/**
 * Revoke an Object URL immediately from memory.
 */
export function revokeTrackedBlobUrl(url: string): void {
    if (activeObjectUrls.has(url)) {
        URL.revokeObjectURL(url);
        activeObjectUrls.delete(url);
    }
}

/**
 * Flush and revoke all temporary media in memory on lock or logout.
 */
export function flushAllTrackedBlobUrls(): void {
    activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
    activeObjectUrls.clear();
}
