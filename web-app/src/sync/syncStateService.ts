import type { SyncPreferences, LocalSyncState } from './syncTypes';

const SYNC_STATE_KEY = 'telegphoto_sync_state';
const SYNC_PREFS_KEY = 'telegphoto_sync_preferences';
const DEVICE_ID_KEY = 'telegphoto_device_id';

/**
 * Get or initialize persistent Device ID.
 */
export function getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        const platform = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
        deviceId = `dev_${platform}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

/**
 * Default synchronization preferences.
 */
export function getStoredSyncPreferences(): SyncPreferences {
    try {
        const data = localStorage.getItem(SYNC_PREFS_KEY);
        if (data) return JSON.parse(data);
    } catch {
        // Fallback
    }

    const defaultPrefs: SyncPreferences = {
        cloudSyncEnabled: true,
        syncOnWifiOnly: false,
        backgroundSync: true,
        downloadOriginals: 'on_demand',
        deviceName: navigator.userAgent.includes('Windows') ? 'Windows PC' : navigator.userAgent.includes('Mac') ? 'Mac' : 'Mobile Device',
        deviceId: getOrCreateDeviceId(),
    };

    return defaultPrefs;
}

export function saveSyncPreferences(prefs: SyncPreferences): void {
    try {
        localStorage.setItem(SYNC_PREFS_KEY, JSON.stringify(prefs));
    } catch (err) {
        console.error('Failed to save sync preferences:', err);
    }
}

/**
 * Local sync state tracking.
 */
export function getLocalSyncState(): LocalSyncState {
    try {
        const data = localStorage.getItem(SYNC_STATE_KEY);
        if (data) return JSON.parse(data);
    } catch {
        // Fallback
    }

    return {
        lastSyncedRevision: 0,
        status: navigator.onLine ? 'synced' : 'offline',
        pendingCount: 0,
    };
}

export function updateLocalSyncState(updates: Partial<LocalSyncState>): LocalSyncState {
    const current = getLocalSyncState();
    const next = { ...current, ...updates };
    try {
        localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(next));
    } catch (err) {
        console.error('Failed to update sync state:', err);
    }
    return next;
}
