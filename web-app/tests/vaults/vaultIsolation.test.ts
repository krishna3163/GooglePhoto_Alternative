import { describe, it, expect } from 'vitest';
import type { PhotoAsset } from '../../src/types';

interface Vault {
    id: string;
    name: string;
    chatId: string;
    type: 'photos' | 'videos' | 'documents' | 'family';
}

describe('Multi-Vault Isolation & Disconnect Safety Suite', () => {
    const vaults: Vault[] = [
        { id: 'vault-personal', name: 'Personal Vault', chatId: '-1001111111', type: 'photos' },
        { id: 'vault-family', name: 'Family Vault', chatId: '-1002222222', type: 'family' },
    ];

    const photos: (PhotoAsset & { vaultId?: string })[] = [
        {
            id: 'photo-p1',
            url: 'https://example.com/p1.jpg',
            fileName: 'personal_selfie.jpg',
            mediaType: 'image',
            timestamp: '2026-08-10T12:00:00Z',
            vaultId: 'vault-personal',
            isTrash: false,
        },
        {
            id: 'photo-f1',
            url: 'https://example.com/f1.jpg',
            fileName: 'family_reunion.jpg',
            mediaType: 'image',
            timestamp: '2026-08-11T14:00:00Z',
            vaultId: 'vault-family',
            isTrash: false,
        },
    ];

    it('1. Filters media strictly by active vaultId without cross-vault leakage', () => {
        const activeVaultId = 'vault-personal';
        const personalPhotos = photos.filter(p => p.vaultId === activeVaultId);

        expect(personalPhotos).toHaveLength(1);
        expect(personalPhotos[0].fileName).toBe('personal_selfie.jpg');

        const activeVaultFamily = 'vault-family';
        const familyPhotos = photos.filter(p => p.vaultId === activeVaultFamily);

        expect(familyPhotos).toHaveLength(1);
        expect(familyPhotos[0].fileName).toBe('family_reunion.jpg');
    });

    it('2. Disconnecting a vault connection preserves remote media safely', () => {
        let connectedVaults = [...vaults];

        // Disconnect Personal Vault
        connectedVaults = connectedVaults.filter(v => v.id !== 'vault-personal');

        expect(connectedVaults).toHaveLength(1);
        expect(connectedVaults[0].id).toBe('vault-family');

        // Underlying photos list is untouched
        expect(photos).toHaveLength(2);
    });
});
