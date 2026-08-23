/**
 * Client-Side Zero-Knowledge Encryption Service using Web Crypto API.
 * Uses AES-256-GCM with PBKDF2 key derivation (SHA-256, 100,000 iterations).
 * All encryption and decryption happen strictly in the browser before network transmission.
 */

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const SALT_LENGTH = 16;

/**
 * Derive a CryptoKey from a user passphrase and salt.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
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
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a File or Blob with a passphrase using AES-256-GCM.
 * Returns the encrypted blob along with base64 IV and salt.
 */
export async function encryptMedia(
    data: Blob | File,
    passphrase: string
): Promise<{ encryptedBlob: Blob; iv: string; salt: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(passphrase, salt);

    const buffer = await data.arrayBuffer();
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        key,
        buffer
    );

    const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    return {
        encryptedBlob,
        iv: ivBase64,
        salt: saltBase64,
    };
}

/**
 * Decrypt an encrypted Blob using the passphrase and stored IV + salt.
 */
export async function decryptMedia(
    encryptedBlob: Blob,
    passphrase: string,
    ivBase64: string,
    saltBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<Blob> {
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const key = await deriveKey(passphrase, salt);

    const buffer = await encryptedBlob.arrayBuffer();
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        key,
        buffer
    );

    return new Blob([decryptedBuffer], { type: mimeType });
}

/**
 * Generate a cryptographically secure random master key / recovery phrase.
 */
export function generateRandomSecretKey(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
