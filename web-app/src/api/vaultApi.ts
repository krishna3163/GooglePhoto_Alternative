import { apiClient } from './apiClient';

export interface VaultPayload {
  name: string;
  description?: string;
  encryptedVaultKey: string;
  wrappedWithRecovery?: string;
  salt: string;
  keyVersion?: number;
}

export const vaultApi = {
  async listVaults(): Promise<any[]> {
    const res = await apiClient.get('/vaults');
    return res.data.data;
  },

  async createVault(payload: VaultPayload): Promise<any> {
    const res = await apiClient.post('/vaults', payload);
    return res.data.data;
  },
};
