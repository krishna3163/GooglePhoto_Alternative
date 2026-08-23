import { apiClient } from './apiClient';

export const migrationApi = {
  async migrateLegacyLibrary(payload: {
    media: any[];
    albums: any[];
    vaults?: any[];
  }): Promise<{
    migratedMedia: number;
    skippedMedia: number;
    migratedAlbums: number;
  }> {
    const res = await apiClient.post('/migration/bootstrap', payload);
    return res.data.data;
  },
};
