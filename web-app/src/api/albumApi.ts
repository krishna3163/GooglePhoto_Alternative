import { apiClient } from './apiClient';

export const albumApi = {
  async listAlbums(): Promise<any[]> {
    const res = await apiClient.get('/albums');
    return res.data.data;
  },

  async createAlbum(payload: {
    id?: string;
    vaultId?: string;
    name: string;
    description?: string;
    mediaIds?: string[];
    coverMediaId?: string;
  }): Promise<any> {
    const res = await apiClient.post('/albums', payload);
    return res.data.data;
  },

  async deleteAlbum(id: string): Promise<void> {
    await apiClient.delete(`/albums/${id}`);
  },
};
