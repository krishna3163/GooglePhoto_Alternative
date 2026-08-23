import { describe, it, expect, beforeEach } from 'vitest';
import {
    initializeVault,
    unlockVaultWithPassword,
    unlockVaultWithRecoveryKey,
    changeVaultPassword,
    encryptMediaWithVaultKey,
    decryptMediaWithVaultKey,
    createTrackedBlobUrl,
    revokeTrackedBlobUrl,
    flushAllTrackedBlobUrls,
} from '../../src/services/cryptoService';

describe('CryptoService - Zero-Knowledge Envelope Encryption Suite', () => {
    const testPassword = 'SuperSecretMasterPassword!2026';
    const sampleText = 'TeleGphoto confidential ultra-secure photo data payload.';

    it('1. Initializes vault and unwraps Master Vault Key with user password', async () => {
        const { bundle, masterKey } = await initializeVault(testPassword);

        expect(bundle.v).toBe(1);
        expect(bundle.wrappedVaultKey).toBeDefined();
        expect(bundle.wrappedWithRecovery).toBeDefined();
        expect(bundle.recoveryKey).toHaveLength(64); // 32 bytes hex
        expect(bundle.salt).toBeDefined();

        // Unlock with password
        const unlockedKey = await unlockVaultWithPassword(testPassword, bundle);
        expect(unlockedKey).toBeDefined();
        expect(unlockedKey.algorithm.name).toBe('AES-GCM');
    });

    it('2. Fails to unwrap Master Vault Key with incorrect password', async () => {
        const { bundle } = await initializeVault(testPassword);
        await expect(unlockVaultWithPassword('WrongPassword123!', bundle)).rejects.toThrow();
    });

    it('3. Unlocks Master Vault Key using offline Emergency Recovery Key', async () => {
        const { bundle } = await initializeVault(testPassword);
        const recoveryKey = bundle.recoveryKey;

        const unlockedWithRecovery = await unlockVaultWithRecoveryKey(recoveryKey, bundle);
        expect(unlockedWithRecovery).toBeDefined();
        expect(unlockedWithRecovery.algorithm.name).toBe('AES-GCM');
    });

    it('4. Round-trip Encryption & Decryption preserves byte-for-byte exact equality', async () => {
        const { masterKey } = await initializeVault(testPassword);
        const originalBlob = new Blob([sampleText], { type: 'text/plain' });

        const { encryptedBlob, metadata } = await encryptMediaWithVaultKey(originalBlob, masterKey);

        expect(encryptedBlob.size).toBeGreaterThan(0);
        expect(metadata.v).toBe(1);
        expect(metadata.alg).toBe('AES-256-GCM');
        expect(metadata.iv).toBeDefined();

        const decryptedBlob = await decryptMediaWithVaultKey(encryptedBlob, masterKey, metadata, 'text/plain');
        const decryptedText = await decryptedBlob.text();

        expect(decryptedText).toBe(sampleText);
    });

    it('5. Unique IV Verification: Same media encrypted twice produces different ciphertexts', async () => {
        const { masterKey } = await initializeVault(testPassword);
        const originalBlob = new Blob([sampleText], { type: 'text/plain' });

        const enc1 = await encryptMediaWithVaultKey(originalBlob, masterKey);
        const enc2 = await encryptMediaWithVaultKey(originalBlob, masterKey);

        expect(enc1.metadata.iv).not.toBe(enc2.metadata.iv);

        const buf1 = await enc1.encryptedBlob.arrayBuffer();
        const buf2 = await enc2.encryptedBlob.arrayBuffer();
        const bytes1 = new Uint8Array(buf1);
        const bytes2 = new Uint8Array(buf2);

        // Ciphertexts must differ
        expect(bytes1).not.toEqual(bytes2);

        // Both must decrypt back to original text
        const dec1 = await (await decryptMediaWithVaultKey(enc1.encryptedBlob, masterKey, enc1.metadata, 'text/plain')).text();
        const dec2 = await (await decryptMediaWithVaultKey(enc2.encryptedBlob, masterKey, enc2.metadata, 'text/plain')).text();
        expect(dec1).toBe(sampleText);
        expect(dec2).toBe(sampleText);
    });

    it('6. Password Change: Re-wraps Master Vault Key without re-encrypting media', async () => {
        const { bundle, masterKey } = await initializeVault(testPassword);
        const originalBlob = new Blob([sampleText], { type: 'text/plain' });

        // Encrypt media before password change
        const { encryptedBlob, metadata } = await encryptMediaWithVaultKey(originalBlob, masterKey);

        const newPassword = 'BrandNewUpgradedPassword!2026';
        const updatedBundle = await changeVaultPassword(masterKey, newPassword, bundle);

        // Old password now fails
        await expect(unlockVaultWithPassword(testPassword, updatedBundle)).rejects.toThrow();

        // New password unwraps the same master key
        const newMasterKey = await unlockVaultWithPassword(newPassword, updatedBundle);

        // Media encrypted before password change still decrypts perfectly
        const decryptedBlob = await decryptMediaWithVaultKey(encryptedBlob, newMasterKey, metadata, 'text/plain');
        expect(await decryptedBlob.text()).toBe(sampleText);
    });

    it('7. Corrupted ciphertext fails safely during decryption', async () => {
        const { masterKey } = await initializeVault(testPassword);
        const originalBlob = new Blob([sampleText], { type: 'text/plain' });
        const { encryptedBlob, metadata } = await encryptMediaWithVaultKey(originalBlob, masterKey);

        const corruptedBuffer = await encryptedBlob.arrayBuffer();
        const corruptedBytes = new Uint8Array(corruptedBuffer);
        corruptedBytes[0] ^= 0xff; // Flip bits

        const corruptedBlob = new Blob([corruptedBytes], { type: 'application/octet-stream' });
        await expect(decryptMediaWithVaultKey(corruptedBlob, masterKey, metadata, 'text/plain')).rejects.toThrow();
    });

    it('8. Memory Hygiene: Tracks and revokes Object URLs cleanly', () => {
        const blob = new Blob(['sample data'], { type: 'text/plain' });
        const url = createTrackedBlobUrl(blob);
        expect(url).toContain('blob:');

        revokeTrackedBlobUrl(url);
        flushAllTrackedBlobUrls();
    });
});
