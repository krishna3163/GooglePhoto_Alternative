import type { UserIdentity, IdentityProvider } from './authTypes';
import type { TelegramConfig } from '../types';
import { getStoredConfig, getStoredUserName } from '../utils/storage';
import { getBotInfo } from '../services/telegramService';

/**
 * Deterministically derives a stable UserIdentity from account credentials.
 */
export function deriveUserIdentity(chatId: string, displayName?: string): UserIdentity {
    const cleanId = String(chatId).trim();
    return {
        userId: `usr_tg_${cleanId}`,
        accountId: cleanId,
        displayName: displayName || `TeleGphoto User (${cleanId})`,
        createdAt: '2026-01-01T00:00:00.000Z',
        identityVersion: 1,
    };
}

/**
 * Pluggable Telegram Identity Provider.
 */
export class TelegramIdentityProvider implements IdentityProvider {
    async getCurrentUser(): Promise<UserIdentity | null> {
        try {
            const stored = getStoredConfig();
            if (!stored) return null;
            const config: TelegramConfig = JSON.parse(stored);
            if (!config.token || !config.chatId) return null;

            const name = getStoredUserName() || 'User';
            return deriveUserIdentity(config.chatId, name);
        } catch {
            return null;
        }
    }

    async signIn(credentials: { token: string; chatId: string; displayName?: string }): Promise<UserIdentity> {
        if (!credentials.token || !credentials.chatId) {
            throw new Error('Telegram bot token and chat ID are required');
        }

        // Validate bot token with Telegram
        let botName = credentials.displayName;
        try {
            const botInfo = await getBotInfo(credentials.token);
            if (!botName) {
                botName = botInfo.first_name || botInfo.username;
            }
        } catch (err: any) {
            console.warn('Bot info validation notice:', err?.message || err);
        }

        const identity = deriveUserIdentity(credentials.chatId, botName);
        return identity;
    }

    async signOut(): Promise<void> {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('telegram_config');
            localStorage.removeItem('user_name');
            localStorage.removeItem('telegphoto_remote_manifest_ref');
        }
    }
}

export const defaultIdentityProvider = new TelegramIdentityProvider();
