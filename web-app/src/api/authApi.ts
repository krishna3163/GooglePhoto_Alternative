import { apiClient, setAccessToken } from './apiClient';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  deviceName?: string;
  initialVault?: {
    name: string;
    encryptedVaultKey: string;
    wrappedWithRecovery?: string;
    salt: string;
    keyVersion?: number;
  };
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
  deviceName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    telegramConnectionId?: string;
  };
  vaults?: any[];
  defaultVault?: any;
  accessToken: string;
  expiresIn: number;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/register', payload);
    const data = res.data.data;
    setAccessToken(data.accessToken);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', payload);
    const data = res.data.data;
    setAccessToken(data.accessToken);
    return data;
  },

  async getMe(): Promise<{ id: string; username: string; email: string }> {
    const res = await apiClient.get('/auth/me');
    return res.data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    newEncryptedVaultKeys: { vaultId: string; encryptedVaultKey: string; salt: string }[];
  }): Promise<void> {
    await apiClient.post('/auth/change-password', payload);
  },
};
