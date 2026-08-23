import { describe, it, expect } from 'vitest';
import { initializeVault, encryptMediaWithVaultKey, decryptMediaWithVaultKey } from '../../src/services/cryptoService';
import { computeSHA256 } from '../../src/services/duplicateService';
import type { PhotoAsset } from '../../src/types';

describe('Integration Flow: End-to-End Secure Upload Pipeline', () => {
    it('Executes complete File Upload Pipeline: Hash -> Encrypt -> Persist -> Decrypt', async () => {
        const password = 'ProductionUserPassword#2026';
        const { masterKey } = await initializeVault(password);

        const rawFile = new File(['RAW_BINARY_IMAGE_DATA_CAMERA_STREAM'], 'family_vacation.jpg', { type: 'image/jpeg' });

        // Step 1: Duplicate pre-check via SHA-256 (before encryption)
        const fileHash = await computeSHA256(rawFile);
        expect(fileHash).toHaveLength(64);

        // Step 2: Client-side AES-256-GCM encryption
        const { encryptedBlob, metadata } = await encryptMediaWithVaultKey(rawFile, masterKey);
        expect(encryptedBlob.size).toBeGreaterThan(0);
        expect(metadata.alg).toBe('AES-256-GCM');

        // Step 3: Create PhotoAsset metadata with encryption parameters
        const photoAsset: PhotoAsset = {
            id: 'asset-' + Date.now(),
            url: 'https://api.telegram.org/file/bot-mock/encrypted-doc.bin',
            fileName: rawFile.name,
            mediaType: 'image',
            timestamp: new Date().toISOString(),
            fileSizeBytes: rawFile.size,
            isEncrypted: true,
            encryptionMetadata: metadata,
        };

        expect(photoAsset.isEncrypted).toBe(true);
        expect(photoAsset.encryptionMetadata?.iv).toBe(metadata.iv);

        // Step 4: Retrieve and decrypt back in browser
        const decryptedBlob = await decryptMediaWithVaultKey(
            encryptedBlob,
            masterKey,
            photoAsset.encryptionMetadata!,
            'image/jpeg'
        );

        const decryptedContent = await decryptedBlob.text();
        expect(decryptedContent).toBe('RAW_BINARY_IMAGE_DATA_CAMERA_STREAM');
    });
});
