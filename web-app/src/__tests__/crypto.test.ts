import { describe, it, expect } from 'vitest';
import {
  initializeVault,
  unlockVaultWithPassword,
  encryptMediaWithVaultKey,
  decryptMediaWithVaultKey,
} from '../services/cryptoService';

describe('Phase 9: Client-Side Zero-Knowledge Encryption Tests', () => {
  it('TEST CRYPTO-001: Generates envelope encryption bundle with master key and recovery key', async () => {
    const password = 'TestSecureMasterPassword2026!';
    const { bundle, masterKey } = await initializeVault(password);

    expect(bundle.v).toBe(1);
    expect(bundle.salt).toBeDefined();
    expect(bundle.wrappedVaultKey).toBeDefined();
    expect(bundle.recoveryKey).toBeDefined();
    expect(masterKey).toBeDefined();
  });

  it('TEST CRYPTO-002: Unwraps vault key using correct password', async () => {
    const password = 'TestSecureMasterPassword2026!';
    const { bundle } = await initializeVault(password);

    const unlockedKey = await unlockVaultWithPassword(password, {
      wrappedVaultKey: bundle.wrappedVaultKey,
      wrappedWithRecovery: bundle.wrappedWithRecovery,
      recoveryKey: bundle.recoveryKey,
      salt: bundle.salt,
      v: bundle.v,
    });

    expect(unlockedKey).toBeDefined();
  });

  it('TEST CRYPTO-003: Rejects unlocking vault with wrong password', async () => {
    const password = 'TestSecureMasterPassword2026!';
    const { bundle } = await initializeVault(password);

    await expect(
      unlockVaultWithPassword('WrongPassword123!', {
        wrappedVaultKey: bundle.wrappedVaultKey,
        wrappedWithRecovery: bundle.wrappedWithRecovery,
        recoveryKey: bundle.recoveryKey,
        salt: bundle.salt,
        v: bundle.v,
      })
    ).rejects.toThrow();
  });

  it('TEST CRYPTO-004: AES-256-GCM encrypts payload with unique IV and preserves integrity', async () => {
    const password = 'TestSecureMasterPassword2026!';
    const { masterKey } = await initializeVault(password);

    const payload = new Blob(['Confidential Photo Metadata Payload - TeleGphoto'], { type: 'text/plain' });
    const { encryptedBlob: c1, metadata: meta1 } = await encryptMediaWithVaultKey(payload, masterKey);
    const { encryptedBlob: c2, metadata: meta2 } = await encryptMediaWithVaultKey(payload, masterKey);

    // IV must always be unique per encryption run
    expect(meta1.iv).not.toBe(meta2.iv);

    // Ciphertext buffers must exist
    const c1Buf = await c1.arrayBuffer();
    const c2Buf = await c2.arrayBuffer();
    expect(c1Buf.byteLength).toBe(c2Buf.byteLength);

    // Decrypt and verify original payload matches exactly
    const decryptedBlob = await decryptMediaWithVaultKey(c1, masterKey, meta1, 'text/plain');
    const decryptedText = await decryptedBlob.text();
    expect(decryptedText).toBe('Confidential Photo Metadata Payload - TeleGphoto');
  });
});
