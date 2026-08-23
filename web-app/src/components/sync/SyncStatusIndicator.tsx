import React from 'react';
import type { SyncStatus } from '../../sync/syncTypes';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import './SyncStatusIndicator.css';

interface SyncStatusIndicatorProps {
    status: SyncStatus;
    pendingCount: number;
    lastSyncedText?: string;
    onClick: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
    status,
    pendingCount,
    lastSyncedText,
    onClick,
}) => {
    const renderContent = () => {
        switch (status) {
            case 'syncing':
                return (
                    <>
                        <RefreshCw size={14} className="sync-spin-icon" color="#FFC928" />
                        <span className="sync-label">Syncing...</span>
                    </>
                );
            case 'failed':
                return (
                    <>
                        <AlertCircle size={14} color="#FF5C6C" />
                        <span className="sync-label status-failed">Sync Error</span>
                    </>
                );
            case 'offline':
                return (
                    <>
                        <CloudOff size={14} color="var(--text-muted)" />
                        <span className="sync-label">Offline {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
                    </>
                );
            case 'synced':
            default:
                return (
                    <>
                        <Cloud size={14} color="#3DDC97" />
                        <span className="sync-label">{pendingCount > 0 ? `${pendingCount} pending` : (lastSyncedText || 'Synced')}</span>
                    </>
                );
        }
    };

    return (
        <button
            className={`sync-status-indicator-btn status-${status}`}
            onClick={onClick}
            title="Cloud Sync Status & Activity"
        >
            {renderContent()}
        </button>
    );
};

export default SyncStatusIndicator;
