import { apiClient } from './apiClient';

export const telegramApi = {
  async connect(payload: { botToken: string; chatId: string }): Promise<{
    botUsername: string;
    chatId: string;
    isVerified: boolean;
  }> {
    const res = await apiClient.post('/telegram/connect', payload);
    return res.data.data;
  },

  async getStatus(): Promise<{
    isConnected: boolean;
    botUsername?: string;
    chatId?: string;
  }> {
    const res = await apiClient.get('/telegram/status');
    return res.data.data;
  },
};
