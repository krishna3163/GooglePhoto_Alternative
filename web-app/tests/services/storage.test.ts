import { describe, it, expect, beforeEach } from 'vitest';
import {
    hashPin,
    verifyPin,
    getStoredPinData,
    setStoredPinData,
    getStoredVaults,
    setStoredVaults,
    getStoredLayout,
    setStoredLayout,
} from '../../src/utils/storage';

describe('Storage & Security - Salted PIN & Persistence Suite', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('1. Salted PIN hashing produces secure hash and random salt', async () => {
        const pin = '4829';
        const pinData1 = await hashPin(pin);
        const pinData2 = await hashPin(pin);

        expect(pinData1.hash).toHaveLength(64);
        expect(pinData1.salt).toBeDefined();

        // Unique random salt produces different hash strings for same PIN
        expect(pinData1.salt).not.toBe(pinData2.salt);
        expect(pinData1.hash).not.toBe(pinData2.hash);
    });

    it('2. Verifies correct PIN successfully against stored salted hash', async () => {
        const pin = '3163';
        const pinData = await hashPin(pin);

        const isValid = await verifyPin(pin, pinData);
        expect(isValid).toBe(true);
    });

    it('3. Rejects incorrect PIN against stored salted hash', async () => {
        const pin = '3163';
        const pinData = await hashPin(pin);

        const isWrongValid = await verifyPin('9999', pinData);
        expect(isWrongValid).toBe(false);
    });

    it('4. Persists and clears Salted PIN data safely in localStorage', async () => {
        expect(getStoredPinData()).toBeNull();

        const pinData = await hashPin('1234');
        setStoredPinData(pinData);

        const retrieved = getStoredPinData();
        expect(retrieved).not.toBeNull();
        expect(retrieved?.hash).toBe(pinData.hash);
        expect(retrieved?.salt).toBe(pinData.salt);

        setStoredPinData(null);
        expect(getStoredPinData()).toBeNull();
    });

    it('5. Persists and retrieves Multi-Vault configurations', () => {
        const mockVaults = [
            { id: 'vault-1', name: 'Personal Vault', chatId: '-1001111111', type: 'photos' },
            { id: 'vault-2', name: 'Family Vault', chatId: '-1002222222', type: 'family' },
        ];

        setStoredVaults(mockVaults);
        const saved = getStoredVaults();

        expect(saved).toHaveLength(2);
        expect(saved[0].name).toBe('Personal Vault');
        expect(saved[1].name).toBe('Family Vault');
    });

    it('6. Handles corrupted JSON storage gracefully', () => {
        localStorage.setItem('telegphoto_vaults', '{bad-corrupted-json...');
        const result = getStoredVaults();
        expect(result).toEqual([]);
    });

    it('7. Persists UI layout mode correctly', () => {
        expect(getStoredLayout()).toBe('grid');
        setStoredLayout('list');
        expect(getStoredLayout()).toBe('list');
    });
});
