import React from 'react';
import type { SyncOperation, LocalSyncState, SyncPreferences } from '../../sync/syncTypes';
import { X, Cloud, RefreshCw, CheckCircle2, AlertCircle, Laptop, Smartphone, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import './SyncActivityModal.css';

interface SyncActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    syncState: LocalSyncState;
    preferences: SyncPreferences;
    pendingOperations: SyncOperation[];
    onSyncNow: () => void;
    onRetryFailed: () => void;
    isSyncing: boolean;
}

export const SyncActivityModal: React.FC<SyncActivityModalProps> = ({
    isOpen,
    onClose,
    syncState,
    preferences,
    pendingOperations,
    onSyncNow,
    onRetryFailed,
    isSyncing,
}) => {
    if (!isOpen) return null;

    const failedCount = pendingOperations.filter(op => op.status === 'FAILED').length;

    return (
        <div className="sync-modal-overlay">
            <motion.div
                className="sync-modal-card"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
                {/* Header */}
                <div className="sync-modal-header">
                    <div className="sync-header-title-group">
                        <Cloud size={22} color="#FFC928" />
                        <div>
                            <h3>Cloud Sync Activity</h3>
                            <p>Encrypted metadata synchronization across all your logged-in devices</p>
                        </div>
                    </div>
                    <button className="sync-modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Status Hero Card */}
                <div className="sync-status-hero-card">
                    <div className="sync-hero-left">
                        {syncState.status === 'synced' ? (
                            <CheckCircle2 size={28} color="#3DDC97" />
                        ) : syncState.status === 'failed' ? (
                            <AlertCircle size={28} color="#FF5C6C" />
                        ) : (
                            <RefreshCw size={28} className="sync-spin-icon" color="#FFC928" />
                        )}
                        <div>
                            <h4>
                                {syncState.status === 'synced'
                                    ? 'Gallery Synchronized'
                                    : syncState.status === 'failed'
                                    ? 'Sync Error Occurred'
                                    : 'Synchronizing Library...'}
                            </h4>
                            <span>
                                {syncState.lastSyncTimestamp
                                    ? `Last synced: ${new Date(syncState.lastSyncTimestamp).toLocaleTimeString()}`
                                    : 'Revision ' + syncState.lastSyncedRevision}
                            </span>
                        </div>
                    </div>

                    <button
                        className="sync-now-cta-btn"
                        onClick={onSyncNow}
                        disabled={isSyncing}
                    >
                        <RefreshCw size={14} className={isSyncing ? 'sync-spin-icon' : ''} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                </div>

                {/* Pending & Queued Operations */}
                <div className="sync-section-block">
                    <div className="sync-section-header">
                        <h4>Pending Changes ({pendingOperations.length})</h4>
                        {failedCount > 0 && (
                            <button className="sync-retry-btn" onClick={onRetryFailed}>
                                <RotateCcw size={12} />
                                <span>Retry {failedCount} Failed</span>
                            </button>
                        )}
                    </div>

                    {pendingOperations.length === 0 ? (
                        <div className="sync-empty-queue">
                            <CheckCircle2 size={18} color="#3DDC97" />
                            <span>All local changes are committed to your private Telegram storage.</span>
                        </div>
                    ) : (
                        <div className="sync-queue-list">
                            {pendingOperations.map(op => (
                                <div key={op.id} className={`sync-op-item status-${op.status.toLowerCase()}`}>
                                    <div className="sync-op-meta">
                                        <b>{op.type.replace('_', ' ')}</b>
                                        <span>Entity: {op.entityId} ({new Date(op.createdAt).toLocaleTimeString()})</span>
                                    </div>
                                    <span className={`sync-op-badge badge-${op.status.toLowerCase()}`}>
                                        {op.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Connected Devices */}
                <div className="sync-section-block">
                    <div className="sync-section-header">
                        <h4>Connected Devices</h4>
                    </div>

                    <div className="connected-devices-list">
                        <div className="device-card-row current-device">
                            <div className="device-icon-wrap">
                                <Laptop size={18} color="#FFC928" />
                            </div>
                            <div className="device-meta">
                                <b>{preferences.deviceName} (This Device)</b>
                                <span>ID: {preferences.deviceId}</span>
                            </div>
                            <span className="current-device-tag">Active</span>
                        </div>

                        <div className="device-card-row">
                            <div className="device-icon-wrap">
                                <Smartphone size={18} color="#38BDF8" />
                            </div>
                            <div className="device-meta">
                                <b>Mobile Client</b>
                                <span>Sync on Wi-Fi Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SyncActivityModal;
