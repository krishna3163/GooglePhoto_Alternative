export interface UserIdentity {
    userId: string;
    accountId: string; // Deterministic Telegram Account / Chat ID
    displayName: string;
    createdAt: string;
    identityVersion: number;
}

export interface AuthSession {
    identity: UserIdentity;
    token: string;
    chatId: string;
    authenticatedAt: string;
}

export interface IdentityProvider {
    getCurrentUser(): Promise<UserIdentity | null>;
    signIn(credentials: { token: string; chatId: string; displayName?: string }): Promise<UserIdentity>;
    signOut(): Promise<void>;
}
