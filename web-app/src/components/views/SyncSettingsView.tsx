import React, { useState } from 'react';
import type { SyncPreferences, LocalSyncState } from '../../sync/syncTypes';
import {
    Cloud,
    Wifi,
    RefreshCw,
    DownloadCloud,
    Trash2,
    Laptop,
    Sparkles,
} from 'lucide-react';
import './SyncSettingsView.css';

interface SyncSettingsViewProps {
    preferences: SyncPreferences;
    syncState: LocalSyncState;
    onUpdatePreferences: (updates: Partial<SyncPreferences>) => void;
    onManualSync: () => void;
    onRebuildSearchIndex: () => void;
    onClearLocalCache: () => void;
    isSyncing: boolean;
}

export const SyncSettingsView: React.FC<SyncSettingsViewProps> = ({
    preferences,
    syncState,
    onUpdatePreferences,
    onManualSync,
    onRebuildSearchIndex,
    onClearLocalCache,
    isSyncing,
}) => {
    const [clearing, setClearing] = useState(false);

    return (
        <div className="sync-settings-page">
            <div className="sync-settings-header">
                <h2>Storage & Cloud Synchronization</h2>
                <span>Cross-device encrypted synchronization settings and offline caching preferences</span>
            </div>

            {/* Cloud Sync Primary Toggle Card */}
            <div className="settings-card-block">
                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <Cloud size={20} color="#FFC928" />
                    </div>
                    <div className="settings-row-info">
                        <b>Cloud Synchronization</b>
                        <span>Synchronize library metadata, albums, and tags across all your devices</span>
                    </div>
                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={preferences.cloudSyncEnabled}
                            onChange={(e) => onUpdatePreferences({ cloudSyncEnabled: e.target.checked })}
                        />
                        <span className="settings-slider round"></span>
                    </label>
                </div>

                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <RefreshCw size={18} color="#38BDF8" />
                    </div>
                    <div className="settings-row-info">
                        <b>Sync Status</b>
                        <span>
                            {syncState.lastSyncTimestamp
                                ? `Last synchronized at ${new Date(syncState.lastSyncTimestamp).toLocaleTimeString()}`
                                : 'Revision ' + syncState.lastSyncedRevision}
                        </span>
                    </div>
                    <button
                        className="settings-action-btn primary-btn"
                        onClick={onManualSync}
                        disabled={isSyncing}
                    >
                        <RefreshCw size={13} className={isSyncing ? 'sync-spin-icon' : ''} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                </div>
            </div>

            {/* Network & Transfer Rules */}
            <div className="settings-section-title">Network & Media Caching</div>
            <div className="settings-card-block">
                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <Wifi size={18} color="#3DDC97" />
                    </div>
                    <div className="settings-row-info">
                        <b>Sync on Wi-Fi Only</b>
                        <span>Prevent synchronization over cellular/metered connections</span>
                    </div>
                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={preferences.syncOnWifiOnly}
                            onChange={(e) => onUpdatePreferences({ syncOnWifiOnly: e.target.checked })}
                        />
                        <span className="settings-slider round"></span>
                    </label>
                </div>

                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <DownloadCloud size={18} color="#FFC928" />
                    </div>
                    <div className="settings-row-info">
                        <b>Download Originals</b>
                        <span>Choose when to fetch full-resolution original media files</span>
                    </div>
                    <select
                        className="settings-select-input"
                        value={preferences.downloadOriginals}
                        onChange={(e) => onUpdatePreferences({ downloadOriginals: e.target.value as any })}
                    >
                        <option value="on_demand">On Demand (View/Export)</option>
                        <option value="wifi_only">Automatically on Wi-Fi</option>
                        <option value="always">Always Pre-fetch</option>
                    </select>
                </div>
            </div>

            {/* Connected Devices */}
            <div className="settings-section-title">Connected Devices</div>
            <div className="settings-card-block">
                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <Laptop size={18} color="#FFC928" />
                    </div>
                    <div className="settings-row-info">
                        <b>{preferences.deviceName} (Current Device)</b>
                        <span>Device ID: {preferences.deviceId}</span>
                    </div>
                    <span className="settings-active-pill">This Device</span>
                </div>
            </div>

            {/* Advanced Maintenance */}
            <div className="settings-section-title">Maintenance & Indexing</div>
            <div className="settings-card-block">
                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <Sparkles size={18} color="#FFC928" />
                    </div>
                    <div className="settings-row-info">
                        <b>Rebuild Search Index</b>
                        <span>Recompute semantic vectors from local metadata and OCR keywords</span>
                    </div>
                    <button className="settings-action-btn" onClick={onRebuildSearchIndex}>
                        Rebuild
                    </button>
                </div>

                <div className="settings-row-item">
                    <div className="settings-row-icon">
                        <Trash2 size={18} color="#FF5C6C" />
                    </div>
                    <div className="settings-row-info">
                        <b>Clear Local Cache</b>
                        <span>Purges temporary decrypted previews and local caches without deleting Telegram media</span>
                    </div>
                    <button
                        className="settings-action-btn danger-btn"
                        onClick={() => {
                            if (window.confirm('Clear local decrypted cache? All encrypted photos remain safe in Telegram and will be re-synced.')) {
                                setClearing(true);
                                onClearLocalCache();
                                setTimeout(() => setClearing(false), 800);
                            }
                        }}
                    >
                        {clearing ? 'Clearing...' : 'Clear Cache'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncSettingsView;
