import type { AuthSession, UserIdentity } from './authTypes';
import type { TelegramConfig } from '../types';

let currentSession: AuthSession | null = null;
const sessionListeners = new Set<(session: AuthSession | null) => void>();

export function getActiveSession(): AuthSession | null {
    return currentSession;
}

export function setActiveSession(identity: UserIdentity, config: TelegramConfig): AuthSession {
    currentSession = {
        identity,
        token: config.token,
        chatId: config.chatId,
        authenticatedAt: new Date().toISOString(),
    };

    sessionListeners.forEach(listener => listener(currentSession));
    return currentSession;
}

export function clearActiveSession(): void {
    currentSession = null;
    sessionListeners.forEach(listener => listener(null));
}

export function subscribeToSession(listener: (session: AuthSession | null) => void): () => void {
    sessionListeners.add(listener);
    return () => sessionListeners.delete(listener);
}
