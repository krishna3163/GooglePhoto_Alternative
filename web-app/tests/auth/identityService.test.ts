import { describe, it, expect, beforeEach } from 'vitest';
import { deriveUserIdentity, TelegramIdentityProvider } from '../../src/auth/identityService';
import { setActiveSession, getActiveSession, clearActiveSession } from '../../src/auth/sessionService';

describe('Stable User Identity & Authentication Abstraction', () => {
    beforeEach(() => {
        localStorage.clear();
        clearActiveSession();
    });

    it('1. Derives deterministic, stable UserIdentity across PC, Phone, and Incognito for the same Account', () => {
        const pcIdentity = deriveUserIdentity('1253687962', 'Krishna PC');
        const phoneIdentity = deriveUserIdentity('1253687962', 'Krishna Mobile');
        const incognitoIdentity = deriveUserIdentity('1253687962');

        expect(pcIdentity.userId).toBe('usr_tg_1253687962');
        expect(phoneIdentity.userId).toBe('usr_tg_1253687962');
        expect(incognitoIdentity.userId).toBe('usr_tg_1253687962');
        expect(pcIdentity.userId).toBe(phoneIdentity.userId);
    });

    it('2. IdentityProvider signs in and establishes active in-memory session', async () => {
        const provider = new TelegramIdentityProvider();
        const identity = await provider.signIn({
            token: 'mock_token',
            chatId: '987654321',
            displayName: 'Test User',
        });

        expect(identity.userId).toBe('usr_tg_987654321');
        expect(identity.accountId).toBe('987654321');

        setActiveSession(identity, { token: 'mock_token', chatId: '987654321' });
        const session = getActiveSession();
        expect(session).not.toBeNull();
        expect(session?.identity.userId).toBe('usr_tg_987654321');

        await provider.signOut();
        clearActiveSession();
        expect(getActiveSession()).toBeNull();
    });
});
