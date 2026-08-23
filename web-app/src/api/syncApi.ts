import { apiClient } from './apiClient';

export interface BootstrapResponse {
  vaults: any[];
  albums: any[];
  media: any[];
  nextCursor: string | null;
  hasMore: boolean;
  totalMediaCount: number;
  currentRevision: number;
}

export const syncApi = {
  async getSyncState(): Promise<{ revision: number; updatedAt: string }> {
    const res = await apiClient.get('/sync/state');
    return res.data.data;
  },

  async getBootstrap(options?: { limit?: number; cursor?: string }): Promise<BootstrapResponse> {
    const res = await apiClient.get('/sync/bootstrap', { params: options });
    return res.data.data;
  },

  async sendMutations(mutations: any[]): Promise<{ applied: number; currentRevision: number }> {
    const res = await apiClient.post('/sync/mutations', { mutations });
    return res.data.data;
  },
};
