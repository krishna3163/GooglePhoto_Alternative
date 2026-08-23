import React, { useState, useEffect } from 'react';
import { X, Smartphone, Laptop, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { deviceApi, type DeviceInfo } from '../../api/deviceApi';

import './ConnectedDevicesModal.css';

interface ConnectedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectedDevicesModal: React.FC<ConnectedDevicesModalProps> = ({ isOpen, onClose }) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await deviceApi.listDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to load connected devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  const handleRevoke = async (deviceId: string) => {
    if (!window.confirm('Revoke access for this device session?')) return;
    setRevokingId(deviceId);
    try {
      await deviceApi.revokeDevice(deviceId);
      await fetchDevices();
    } catch (err) {
      console.error('Failed to revoke device session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="devices-modal-overlay">
      <div className="devices-modal-card">
        <div className="devices-modal-header">
          <div className="devices-title-group">
            <h3>Connected Devices</h3>
            <span>Manage sessions authenticated to your TeleGphoto account</span>
          </div>
          <button className="devices-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="devices-body">
          {loading ? (
            <div className="devices-loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <span>Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="devices-empty-state">
              <ShieldCheck size={36} color="#3DDC97" />
              <span>No other active device sessions.</span>
            </div>
          ) : (
            <div className="devices-list">
              {devices.map((device) => {
                const isMobile = device.platform.toLowerCase().includes('mobile') || device.deviceName.toLowerCase().includes('phone');
                return (
                  <div key={device.deviceId} className={`device-row-card ${device.isCurrent ? 'current' : ''}`}>
                    <div className="device-icon-box">
                      {isMobile ? <Smartphone size={20} color="#FFC928" /> : <Laptop size={20} color="#38BDF8" />}
                    </div>

                    <div className="device-meta-info">
                      <div className="device-name-row">
                        <span className="device-name">{device.deviceName}</span>
                        {device.isCurrent && <span className="device-current-badge">This Device</span>}
                      </div>
                      <span className="device-last-active">
                        Last active: {new Date(device.lastActiveAt).toLocaleString()}
                      </span>
                    </div>

                    {!device.isCurrent && (
                      <button
                        className="device-revoke-btn"
                        onClick={() => handleRevoke(device.deviceId)}
                        disabled={revokingId === device.deviceId}
                        title="Revoke session"
                      >
                        <Trash2 size={16} />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectedDevicesModal;
