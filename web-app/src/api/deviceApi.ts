import { apiClient } from './apiClient';

export interface DeviceInfo {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  browser: string;
  lastActiveAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

export const deviceApi = {
  async listDevices(): Promise<DeviceInfo[]> {
    const res = await apiClient.get('/devices');
    return res.data.data;
  },

  async revokeDevice(deviceId: string): Promise<void> {
    await apiClient.post(`/devices/${deviceId}/revoke`);
  },
};
