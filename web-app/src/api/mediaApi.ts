import { apiClient } from './apiClient';

export interface UploadMediaPayload {
  id: string;
  vaultId: string;
  fileName: string;
  mimeType: string;
  mediaType: 'image' | 'video' | 'document';
  size: number;
  width?: number;
  height?: number;
  favorite?: boolean;
  albumIds?: string[];
  tags?: string[];
  exifSummary?: Record<string, any>;
  encryption: {
    version: number;
    algorithm: 'AES-256-GCM';
    iv: string;
    salt?: string;
  };
  fileBlob: Blob;
  thumbnailBlob?: Blob;
}

export const mediaApi = {
  async uploadMedia(payload: UploadMediaPayload): Promise<any> {
    const formData = new FormData();
    formData.append('file', payload.fileBlob, payload.fileName);
    if (payload.thumbnailBlob) {
      formData.append('thumbnail', payload.thumbnailBlob, `thumb_${payload.fileName}`);
    }

    const { fileBlob, thumbnailBlob, ...meta } = payload;
    formData.append('metadata', JSON.stringify(meta));

    const res = await apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async getGallery(options?: {
    vaultId?: string;
    trashed?: boolean;
    favorite?: boolean;
    mediaType?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: any[]; nextCursor: string | null; hasMore: boolean }> {
    const res = await apiClient.get('/media', { params: options });
    return res.data.data;
  },

  async getMediaDetails(id: string): Promise<any> {
    const res = await apiClient.get(`/media/${id}`);
    return res.data.data;
  },

  async downloadEncryptedMediaBlob(id: string): Promise<Blob> {
    const res = await apiClient.get(`/media/${id}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },

  async downloadEncryptedThumbnailBlob(id: string): Promise<Blob> {
    const res = await apiClient.get(`/media/${id}/thumbnail`, {
      responseType: 'blob',
    });
    return res.data;
  },

  async toggleFavorite(id: string, favorite?: boolean): Promise<boolean> {
    const res = await apiClient.post(`/media/${id}/favorite`, { favorite });
    return res.data.data.favorite;
  },

  async moveToTrash(id: string): Promise<void> {
    await apiClient.post(`/media/${id}/trash`);
  },

  async restoreFromTrash(id: string): Promise<void> {
    await apiClient.post(`/media/${id}/restore`);
  },

  async permanentDelete(id: string): Promise<void> {
    await apiClient.delete(`/media/${id}/permanent`);
  },
};
