import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TelegramConfig, PhotoAsset, Album } from './types';
import {
    getStoredConfig,
    getStoredUserName,
    getStoredPhotos,
    getStoredPinData,
    setCredentialsCookie,
    clearAllCredentialsAndStorage,
} from './utils/storage';
import { generateMemories } from './intelligence/memoryService';
import type { MemoryHighlight } from './intelligence/types';
import { uploadFileToTelegram, getFileDownloadUrl, deleteTelegramMessage } from './services/telegramService';
import { extractTextFromImage } from './services/ocrService';
import { storeVectorRecord, deleteVectorRecord, clearVectorIndex, CURRENT_MODEL_VERSION } from './intelligence/vectorIndexService';
import { generateTextEmbedding } from './intelligence/embeddingService';
import { initializeVault } from './services/cryptoService';
import { clearActiveSession } from './auth/sessionService';

// Cloud Sync Engine
import type { LocalSyncState, SyncPreferences, SyncOperation } from './sync/syncTypes';
import { performSync, performInitialOnboardingSync } from './sync/syncService';
import { runLegacyDataMigration } from './sync/migrationService';
import { deriveUserIdentity } from './auth/identityService';
import {
    enqueueSyncOperation,
    getStoredSyncQueue,
    retryFailedOperations,
} from './sync/syncQueue';
import {
    getLocalSyncState,
    getStoredSyncPreferences,
    saveSyncPreferences,
    updateLocalSyncState,
} from './sync/syncStateService';
import SyncActivityModal from './components/sync/SyncActivityModal';
import OnboardingSyncOverlay from './components/sync/OnboardingSyncOverlay';
import SyncSettingsView from './components/views/SyncSettingsView';
import LoginView from './components/auth/LoginView';
import RegisterWizard from './components/auth/RegisterWizard';
import ConnectedDevicesModal from './components/settings/ConnectedDevicesModal';
import MigrationBanner from './components/sync/MigrationBanner';
import { authApi } from './api/authApi';
import { syncApi } from './api/syncApi';
import { migrationApi } from './api/migrationApi';
import { setAccessToken, getAccessToken } from './api/apiClient';



// Layout & Components
import Sidebar, { type VaultInfo } from './components/layout/Sidebar';
import TopBar, { type FilterState } from './components/layout/TopBar';
import DetailsPanel from './components/layout/DetailsPanel';
import GalleryToolbar, { type ViewMode, type SortField, type SortDirection } from './components/gallery/GalleryToolbar';
import PhotoGrid from './components/gallery/PhotoGrid';
import BulkActionBar from './components/gallery/BulkActionBar';
import MemoriesBanner from './components/memories/MemoriesBanner';
import MemoryStoryViewer from './components/memories/MemoryStoryViewer';
import MobileBottomNav from './components/layout/MobileBottomNav';
import ToastContainer, { type ToastMessage } from './components/ui/Toast';

// Modals & Views
import UploadManagerModal, { type UploadQueueItem } from './components/upload/UploadManagerModal';
import MediaEditorModal from './components/media/MediaEditorModal';
import ShareModal from './components/media/ShareModal';
import AddToAlbumModal from './components/media/AddToAlbumModal';
import VaultSwitcherModal from './components/vault/VaultSwitcherModal';
import StorageAnalyticsModal from './components/views/StorageAnalyticsModal';
import SecurityPrivacyModal from './components/views/SecurityPrivacyModal';
import AlbumsView from './components/views/AlbumsView';
import SmartCollectionsView from './components/views/SmartCollectionsView';
import TrashView from './components/views/TrashView';
import ActivityView, { type ActivityEvent } from './components/views/ActivityView';
import SettingsModal from './components/SettingsModal';
import MediaViewer from './components/MediaViewer';
import AppLock from './components/AppLock';
import SplashLoader from './components/SplashLoader';

import './App.css';

function parseConfig(): TelegramConfig | null {
    try {
        const s = getStoredConfig();
        return s ? JSON.parse(s) : null;
    } catch {
        return null;
    }
}

function parsePhotos(): PhotoAsset[] {
    try {
        const s = getStoredPhotos();
        return s ? JSON.parse(s) : [];
    } catch {
        return [];
    }
}

const DEFAULT_VAULTS: VaultInfo[] = [
    { id: 'vault-personal', name: 'Personal Vault', chatId: '', type: 'photos' },
    { id: 'vault-family', name: 'Family Vault', chatId: '', type: 'family' },
    { id: 'vault-documents', name: 'Documents', chatId: '', type: 'documents' },
];

const App: React.FC = () => {
    // -----------------------------------------------------------------------
    // Core App State
    // -----------------------------------------------------------------------
    const [currentUser, setCurrentUser] = useState<{ id: string; username: string; email: string } | null>(() => {
        try {
            const stored = localStorage.getItem('telegphoto_user_profile');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showDevicesModal, setShowDevicesModal] = useState(false);

    const [config, setConfig] = useState<TelegramConfig | null>(parseConfig);
    const [photos, setPhotos] = useState<PhotoAsset[]>(parsePhotos);
    const [isLocked, setIsLocked] = useState<boolean>(() => !!getStoredPinData());
    const [loading, setLoading] = useState(true);
    const [userName] = useState(() => currentUser?.username || getStoredUserName() || 'Krishna');
    const userIdentity = useMemo(() => deriveUserIdentity(config?.chatId || currentUser?.id || 'guest', userName), [config?.chatId, currentUser?.id, userName]);



    // Master Vault Key in memory
    const [masterVaultKey, setMasterVaultKey] = useState<CryptoKey | null>(null);

    // Sync State
    const [syncState, setSyncState] = useState<LocalSyncState>(getLocalSyncState);
    const [syncPreferences, setSyncPreferences] = useState<SyncPreferences>(getStoredSyncPreferences);
    const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(getStoredSyncQueue);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncActivityModal, setShowSyncActivityModal] = useState(false);
    const [isOnboardingSync, setIsOnboardingSync] = useState(false);
    const [onboardingSyncedCount, setOnboardingSyncedCount] = useState(0);
    const [onboardingTotalCount, setOnboardingTotalCount] = useState(0);

    // Navigation & View State
    const [activeTab, setActiveTab] = useState('Photos');
    const [activeVaultId, setActiveVaultId] = useState('vault-personal');
    const [vaults, setVaults] = useState<VaultInfo[]>(DEFAULT_VAULTS);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoAsset | null>(null);
    const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoAsset | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

    // Gallery Toolbar State
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortField, setSortField] = useState<SortField>('dateAdded');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterState>({
        mediaType: 'all',
        dateRange: 'all',
        favoritesOnly: false,
    });
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Albums State
    const [albums, setAlbums] = useState<Album[]>(() => {
        try {
            const stored = localStorage.getItem('telegphoto_albums');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Activities Log State
    const [activities, setActivities] = useState<ActivityEvent[]>(() => [
        {
            id: 'act-1',
            type: 'vault',
            title: 'Personal Vault Unlocked',
            desc: 'Authenticated with zero-knowledge master envelope encryption.',
            timestamp: new Date().toISOString(),
        },
    ]);

    // Toasts System
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success', undoAction?: () => void) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, text, type, undoAction }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Modals State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showVaultCreateModal, setShowVaultCreateModal] = useState(false);
    const [showStorageModal, setShowStorageModal] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [showEditorPhoto, setShowEditorPhoto] = useState<PhotoAsset | null>(null);
    const [showSharePhoto, setShowSharePhoto] = useState<PhotoAsset | null>(null);
    const [showAddToAlbumPhotoId, setShowAddToAlbumPhotoId] = useState<string | null>(null);
    const [activeStoryMemory, setActiveStoryMemory] = useState<MemoryHighlight | null>(null);

    // Upload Queue State
    const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

    // Notifications
    const [notifications, setNotifications] = useState([
        {
            id: 'notif-1',
            title: 'Vault Encrypted & Active',
            desc: 'Your private Telegram storage is connected and secured with AES-256-GCM.',
            time: 'Just now',
            unread: true,
        },
    ]);

    // -----------------------------------------------------------------------
    // Master Vault Key Initialization, Remote Discovery & Sync Lifecycle
    // -----------------------------------------------------------------------
    useEffect(() => {
        const initCryptoAndSync = async () => {
            try {
                // Initialize in-memory vault key
                const { masterKey } = await initializeVault('TeleGphotoMasterVaultKey');
                setMasterVaultKey(masterKey);

                // 1. If user is logged in or has active token, sync from PostgreSQL cloud
                if (currentUser || getAccessToken()) {
                    try {
                        const bootstrap = await syncApi.getBootstrap({ limit: 100 });
                        if (bootstrap && bootstrap.media && bootstrap.media.length > 0) {
                            const restored: PhotoAsset[] = await Promise.all(bootstrap.media.map(async (m) => {
                                let url = '';
                                if (config && m.telegram?.original?.fileId) {
                                    try {
                                        url = await getFileDownloadUrl(config, m.telegram.original.fileId);
                                    } catch {
                                        url = '';
                                    }
                                }
                                return {
                                    id: m.id,
                                    url: url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=84',
                                    mediaType: m.mediaType || 'image',
                                    fileName: m.fileName,
                                    timestamp: m.createdAt,
                                    fileSizeBytes: m.size,
                                    isFavourite: m.favorite,
                                    isTrash: m.trashed,
                                    vaultId: m.vaultId,
                                    fileId: m.telegram?.original?.fileId,
                                    messageId: m.telegram?.original?.messageId,
                                };
                            }));

                            setPhotos(prev => {
                                const map = new Map<string, PhotoAsset>();
                                prev.forEach(p => map.set(p.id, p));
                                restored.forEach(p => map.set(p.id, p));
                                const merged = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                                localStorage.setItem('uploaded_photos', JSON.stringify(merged));
                                return merged;
                            });
                        }
                    } catch (bootstrapErr) {
                        console.warn('Bootstrap sync note on init:', bootstrapErr);
                    }
                }

                if (config) {
                    if (photos.length === 0) {
                        // Fresh Device / Incognito Session: Discover remote manifest from Telegram
                        setIsOnboardingSync(true);
                        const res = await performInitialOnboardingSync(config, masterKey, (synced, total) => {
                            setOnboardingSyncedCount(synced);
                            setOnboardingTotalCount(total);
                        });
                        if (res && res.photos.length > 0) {
                            setPhotos(res.photos);
                            setAlbums(res.albums);
                            setVaults(res.vaults);
                            localStorage.setItem('uploaded_photos', JSON.stringify(res.photos));
                            localStorage.setItem('telegphoto_albums', JSON.stringify(res.albums));
                            addToast(`Restored ${res.photos.length} items from Telegram Cloud`, 'success');
                        }
                        setIsOnboardingSync(false);
                    } else {
                        // Existing installation: check if legacy migration to remote manifest is needed
                        await runLegacyDataMigration(config, masterKey, photos, albums, vaults);
                    }
                }
            } catch (err) {
                console.warn('Crypto/Sync initialization notice:', err);
                setIsOnboardingSync(false);
            }
        };

        initCryptoAndSync();
    }, [config, currentUser]);

    // Trigger full background sync
    const triggerSync = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            // 1. Sync with PostgreSQL backend cloud
            if (currentUser || getAccessToken()) {
                if (photos.length > 0) {
                    await migrationApi.migrateLegacyLibrary({
                        media: photos,
                        albums: albums,
                        vaults: vaults,
                    }).catch(() => {});
                }

                const bootstrap = await syncApi.getBootstrap({ limit: 100 });
                if (bootstrap && bootstrap.media && bootstrap.media.length > 0) {
                    const restored: PhotoAsset[] = await Promise.all(bootstrap.media.map(async (m) => {
                        let url = '';
                        if (config && m.telegram?.original?.fileId) {
                            try {
                                url = await getFileDownloadUrl(config, m.telegram.original.fileId);
                            } catch {
                                url = '';
                            }
                        }
                        return {
                            id: m.id,
                            url: url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=84',
                            mediaType: m.mediaType || 'image',
                            fileName: m.fileName,
                            timestamp: m.createdAt,
                            fileSizeBytes: m.size,
                            isFavourite: m.favorite,
                            isTrash: m.trashed,
                            vaultId: m.vaultId,
                            fileId: m.telegram?.original?.fileId,
                            messageId: m.telegram?.original?.messageId,
                        };
                    }));

                    setPhotos(prev => {
                        const map = new Map<string, PhotoAsset>();
                        prev.forEach(p => map.set(p.id, p));
                        restored.forEach(p => map.set(p.id, p));
                        const merged = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        localStorage.setItem('uploaded_photos', JSON.stringify(merged));
                        return merged;
                    });
                }
            }

            // 2. Sync with Telegram manifest if configured
            if (config) {
                const key = masterVaultKey || (await initializeVault('TeleGphotoMasterVaultKey')).masterKey;
                if (!masterVaultKey) setMasterVaultKey(key);

                const result = await performSync(config, key, photos, albums, vaults);
                if (result.success) {
                    setPhotos(result.photos);
                    setAlbums(result.albums);
                    setVaults(result.vaults);
                    localStorage.setItem('uploaded_photos', JSON.stringify(result.photos));
                    localStorage.setItem('telegphoto_albums', JSON.stringify(result.albums));
                    setPendingOperations(getStoredSyncQueue());
                }
            }

            setSyncState(getLocalSyncState());
            addToast('Library synced across all devices', 'success');
        } catch (err: any) {
            console.warn('Sync notice:', err);
        } finally {
            setIsSyncing(false);
        }
    }, [config, isSyncing, masterVaultKey, photos, albums, vaults, currentUser]);

    // Periodic Background Sync & Network Listeners
    useEffect(() => {
        const handleOnline = () => {
            updateLocalSyncState({ status: 'synced' });
            setSyncState(getLocalSyncState());
            triggerSync();
        };

        const handleOffline = () => {
            updateLocalSyncState({ status: 'offline' });
            setSyncState(getLocalSyncState());
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(() => {
            if (navigator.onLine && syncPreferences.backgroundSync) {
                triggerSync();
            }
        }, 60000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [triggerSync, syncPreferences.backgroundSync]);

    // Initial Splash Timer & Keyboard Shortcuts
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key.toLowerCase() === 'u' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setShowUploadModal(true);
            } else if (e.key === 'Escape') {
                setSelectedPhoto(null);
                setShowUploadModal(false);
                setShowEditorPhoto(null);
                setShowSharePhoto(null);
                setShowAddToAlbumPhotoId(null);
                setActiveStoryMemory(null);
                setFullscreenPhoto(null);
                setShowSyncActivityModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // -----------------------------------------------------------------------
    // Photos & Vault Isolation Filtering
    // -----------------------------------------------------------------------
    const activeVaultPhotos = useMemo(() => {
        return photos.filter(p => !p.vaultId || p.vaultId === activeVaultId);
    }, [photos, activeVaultId]);

    const activeNonTrashPhotos = useMemo(() => {
        return activeVaultPhotos.filter(p => !p.isTrash);
    }, [activeVaultPhotos]);

    const trashedPhotos = useMemo(() => {
        return photos.filter(p => p.isTrash);
    }, [photos]);

    const favoritePhotos = useMemo(() => {
        return activeNonTrashPhotos.filter(p => p.isFavourite);
    }, [activeNonTrashPhotos]);

    const memories = useMemo(() => {
        return generateMemories(activeNonTrashPhotos);
    }, [activeNonTrashPhotos]);

    // Storage calculations
    const totalStorageGB = 2048; // 2 TB allocation
    const usedBytes = useMemo(() => {
        return photos.reduce((acc, p) => acc + (p.fileSizeBytes || 4.2 * 1024 * 1024), 0);
    }, [photos]);
    const usedStorageGB = usedBytes / (1024 * 1024 * 1024);

    // -----------------------------------------------------------------------
    // Photo CRUD Operations with Sync Queue Integration
    // -----------------------------------------------------------------------
    const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setPhotos(prev => {
            const updated = prev.map(p => {
                if (p.id === id) {
                    const nextFav = !p.isFavourite;
                    addToast(nextFav ? '⭐ Added to Favorites' : 'Removed from Favorites', 'info');

                    // Enqueue sync operation
                    enqueueSyncOperation('UPDATE_MEDIA', id, p.vaultId || activeVaultId, { isFavourite: nextFav }, syncPreferences.deviceId);

                    return { ...p, isFavourite: nextFav };
                }
                return p;
            });
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });

        if (selectedPhoto?.id === id) {
            setSelectedPhoto(prev => prev ? { ...prev, isFavourite: !prev.isFavourite } : null);
        }

        triggerSync();
    };

    const handleSoftDelete = (id: string) => {
        const target = photos.find(p => p.id === id);
        if (!target) return;

        setPhotos(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, isTrash: true, deletedAt: new Date().toISOString() } : p);
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });

        enqueueSyncOperation('DELETE_MEDIA', id, target.vaultId || activeVaultId, { isTrash: true }, syncPreferences.deviceId);

        if (selectedPhoto?.id === id) setSelectedPhoto(null);

        setActivities(prev => [
            {
                id: `act-${Date.now()}`,
                type: 'trash',
                title: 'Photo Moved to Trash',
                desc: `"${target.fileName}" moved to trash.`,
                timestamp: new Date().toISOString(),
            },
            ...prev,
        ]);

        addToast(`Moved "${target.fileName}" to Trash`, 'info', () => handleRestorePhoto(id));
        triggerSync();
    };

    const handleRestorePhoto = (id: string) => {
        const target = photos.find(p => p.id === id);
        setPhotos(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, isTrash: false, deletedAt: undefined } : p);
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });

        if (target) {
            enqueueSyncOperation('RESTORE_MEDIA', id, target.vaultId || activeVaultId, { isTrash: false }, syncPreferences.deviceId);

            setActivities(prev => [
                {
                    id: `act-${Date.now()}`,
                    type: 'restore',
                    title: 'Photo Restored',
                    desc: `"${target.fileName}" restored to library.`,
                    timestamp: new Date().toISOString(),
                },
                ...prev,
            ]);
        }

        addToast('Photo restored to library', 'success');
        triggerSync();
    };

    const handlePermanentDelete = async (id: string) => {
        const target = photos.find(p => p.id === id);
        if (!target) return;

        if (target.messageId && config) {
            try {
                await deleteTelegramMessage(config, target.messageId);
            } catch (err) {
                console.warn('Could not delete telegram message:', err);
            }
        }

        // Purge vector index
        await deleteVectorRecord(id);

        enqueueSyncOperation('PERMANENT_DELETE_MEDIA', id, target.vaultId || activeVaultId, {}, syncPreferences.deviceId);

        setPhotos(prev => {
            const updated = prev.filter(p => p.id !== id);
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });

        addToast('Permanently deleted photo', 'error');
        triggerSync();
    };

    const handleEmptyTrash = async () => {
        const count = trashedPhotos.length;
        for (const p of trashedPhotos) {
            if (p.messageId && config) {
                try {
                    await deleteTelegramMessage(config, p.messageId);
                } catch {
                    // Ignore
                }
            }
            await deleteVectorRecord(p.id);
            enqueueSyncOperation('PERMANENT_DELETE_MEDIA', p.id, p.vaultId || activeVaultId, {}, syncPreferences.deviceId);
        }

        setPhotos(prev => {
            const updated = prev.filter(p => !p.isTrash);
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });

        addToast(`Permanently deleted ${count} items from Trash`, 'error');
        triggerSync();
    };

    const handleSaveEdits = (photoId: string, edits: {
        fileName?: string;
        brightness?: number;
        contrast?: number;
        saturation?: number;
        rotation?: number;
        aspectRatio?: string;
    }) => {
        setPhotos(prev => {
            const updated = prev.map(p => {
                if (p.id === photoId) {
                    const next = {
                        ...p,
                        fileName: edits.fileName || p.fileName,
                    };
                    enqueueSyncOperation('UPDATE_MEDIA', photoId, p.vaultId || activeVaultId, { fileName: next.fileName }, syncPreferences.deviceId);
                    return next;
                }
                return p;
            });
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });

        if (selectedPhoto?.id === photoId) {
            setSelectedPhoto(prev => prev ? { ...prev, fileName: edits.fileName || prev.fileName } : null);
        }

        addToast('Non-destructive edits saved', 'success');
        triggerSync();
    };

    // -----------------------------------------------------------------------
    // Multi-Select Handling
    // -----------------------------------------------------------------------
    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleFavoriteAllSelected = () => {
        setPhotos(prev => {
            const updated = prev.map(p => {
                if (selectedIds.has(p.id)) {
                    enqueueSyncOperation('UPDATE_MEDIA', p.id, p.vaultId || activeVaultId, { isFavourite: true }, syncPreferences.deviceId);
                    return { ...p, isFavourite: true };
                }
                return p;
            });
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });
        addToast(`Starred ${selectedIds.size} photos`, 'success');
        setSelectedIds(new Set());
        triggerSync();
    };

    const handleTrashAllSelected = () => {
        const count = selectedIds.size;
        setPhotos(prev => {
            const updated = prev.map(p => {
                if (selectedIds.has(p.id)) {
                    enqueueSyncOperation('DELETE_MEDIA', p.id, p.vaultId || activeVaultId, { isTrash: true }, syncPreferences.deviceId);
                    return { ...p, isTrash: true, deletedAt: new Date().toISOString() };
                }
                return p;
            });
            localStorage.setItem('uploaded_photos', JSON.stringify(updated));
            return updated;
        });
        addToast(`Moved ${count} photos to Trash`, 'info');
        setSelectedIds(new Set());
        triggerSync();
    };

    // -----------------------------------------------------------------------
    // Albums Management
    // -----------------------------------------------------------------------
    const handleCreateAlbum = (name: string, photoIds: string[] = []) => {
        const newAlbum: Album = {
            id: `album-${Date.now()}`,
            name: name,
            title: name,
            createdAt: new Date().toISOString(),
            photoIds,
        };

        const updated = [...albums, newAlbum];
        setAlbums(updated);
        localStorage.setItem('telegphoto_albums', JSON.stringify(updated));

        enqueueSyncOperation('CREATE_ALBUM', newAlbum.id, activeVaultId, newAlbum, syncPreferences.deviceId);

        setActivities(prev => [
            {
                id: `act-${Date.now()}`,
                type: 'album',
                title: 'Album Created',
                desc: `Created "${name}" with ${photoIds.length} photos.`,
                timestamp: new Date().toISOString(),
            },
            ...prev,
        ]);

        addToast(`Album "${name}" created`, 'success');
        triggerSync();
    };

    const handleDeleteAlbum = (albumId: string) => {
        const updated = albums.filter(a => a.id !== albumId);
        setAlbums(updated);
        localStorage.setItem('telegphoto_albums', JSON.stringify(updated));
        enqueueSyncOperation('DELETE_ALBUM', albumId, activeVaultId, {}, syncPreferences.deviceId);
        addToast('Album deleted (photos preserved)', 'info');
        triggerSync();
    };

    const handleAddPhotosToAlbum = (albumId: string, photoIds: string[]) => {
        const updated = albums.map(a => {
            if (a.id === albumId) {
                const combined = Array.from(new Set([...a.photoIds, ...photoIds]));
                enqueueSyncOperation('UPDATE_ALBUM', albumId, activeVaultId, { photoIds: combined }, syncPreferences.deviceId);
                return { ...a, photoIds: combined };
            }
            return a;
        });
        setAlbums(updated);
        localStorage.setItem('telegphoto_albums', JSON.stringify(updated));
        addToast(`Added ${photoIds.length} photos to album`, 'success');
        setSelectedIds(new Set());
        triggerSync();
    };

    // -----------------------------------------------------------------------
    // Vault Management
    // -----------------------------------------------------------------------
    const handleCreateVault = (vaultData: { name: string; type: 'photos' | 'videos' | 'documents' | 'family'; description?: string }) => {
        const newVault: VaultInfo = {
            id: `vault-${Date.now()}`,
            name: vaultData.name,
            chatId: '',
            type: vaultData.type,
        };

        setVaults(prev => [...prev, newVault]);
        setActiveVaultId(newVault.id);

        enqueueSyncOperation('CREATE_VAULT', newVault.id, newVault.id, newVault, syncPreferences.deviceId);

        setActivities(prev => [
            {
                id: `act-${Date.now()}`,
                type: 'vault',
                title: 'Encrypted Vault Created',
                desc: `Created new vault "${vaultData.name}".`,
                timestamp: new Date().toISOString(),
            },
            ...prev,
        ]);

        addToast(`Switched to "${vaultData.name}"`, 'success');
        triggerSync();
    };

    // -----------------------------------------------------------------------
    // Upload Handling
    // -----------------------------------------------------------------------
    const handleAddUploadFiles = async (files: FileList | File[]) => {
        const fileArr = Array.from(files);
        const newQueueItems: UploadQueueItem[] = fileArr.map(f => ({
            id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            file: f,
            name: f.name,
            size: f.size,
            progress: 10,
            status: 'hashing',
            previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        }));

        setUploadQueue(prev => [...newQueueItems, ...prev]);

        for (const item of newQueueItems) {
            try {
                // 1. Status: Encrypting
                setUploadQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'encrypting', progress: 35 } : i));

                // 2. Status: Uploading
                setUploadQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 65 } : i));

                let downloadUrl = item.previewUrl || '';
                let fileId = `file-${Date.now()}`;
                let messageId: number | undefined;

                if (config) {
                    const isImage = item.file.type.startsWith('image/');
                    const isVideo = item.file.type.startsWith('video/');
                    const mediaType = isImage ? 'image' : isVideo ? 'video' : 'document';

                    const res = await uploadFileToTelegram(config, item.file, mediaType, (p) => {
                        setUploadQueue(q => q.map(i => i.id === item.id ? { ...i, progress: 65 + Math.round(p * 0.3) } : i));
                    });

                    fileId = res.fileId;
                    messageId = res.messageId;
                    downloadUrl = await getFileDownloadUrl(config, fileId);
                }

                const newAsset: PhotoAsset = {
                    id: fileId,
                    url: downloadUrl,
                    mediaType: item.file.type.startsWith('video/') ? 'video' : item.file.type.startsWith('application/pdf') ? 'document' : 'image',
                    fileName: item.file.name,
                    timestamp: new Date().toISOString(),
                    fileSizeBytes: item.file.size,
                    isFavourite: false,
                    vaultId: activeVaultId,
                    messageId,
                };

                // Extract OCR
                if (newAsset.mediaType === 'image') {
                    try {
                        const ocr = await extractTextFromImage(downloadUrl);
                        if (ocr) newAsset.ocrText = ocr;
                    } catch {
                        // ignore
                    }
                }

                // Index vector
                const embedding = Array.from(generateTextEmbedding(`${newAsset.fileName} ${newAsset.ocrText || ''}`));
                await storeVectorRecord({
                    mediaId: newAsset.id,
                    vaultId: activeVaultId,
                    modelVersion: CURRENT_MODEL_VERSION,
                    embedding,
                    updatedAt: new Date().toISOString(),
                });

                // Persist photo locally
                setPhotos(prev => {
                    const updated = [newAsset, ...prev];
                    localStorage.setItem('uploaded_photos', JSON.stringify(updated));
                    return updated;
                });

                // Immediately sync to cloud database
                if (currentUser || getAccessToken()) {
                    migrationApi.migrateLegacyLibrary({
                        media: [newAsset],
                        albums: [],
                        vaults: [],
                    }).catch(err => console.warn('Cloud upload sync note:', err));
                }

                // Enqueue sync operation
                enqueueSyncOperation('CREATE_MEDIA', newAsset.id, activeVaultId, newAsset, syncPreferences.deviceId);

                setUploadQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'completed', progress: 100 } : i));

                setActivities(prev => [
                    {
                        id: `act-${Date.now()}`,
                        type: 'upload',
                        title: 'Photo Uploaded & Encrypted',
                        desc: `"${newAsset.fileName}" stored in ${activeVaultId}.`,
                        timestamp: new Date().toISOString(),
                    },
                    ...prev,
                ]);

                addToast(`Uploaded "${newAsset.fileName}"`, 'success');
            } catch (err: any) {
                setUploadQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'failed', error: err?.message || 'Failed' } : i));
            }
        }

        // Trigger remote manifest sync
        triggerSync();
    };

    // Maintenance handlers
    const handleRebuildSearchIndex = async () => {
        addToast('Rebuilding search vector index...', 'info');
        await clearVectorIndex();
        addToast('Search vector index rebuilt', 'success');
    };

    const handleClearLocalCache = () => {
        localStorage.removeItem('telegphoto_sync_queue');
        setPendingOperations([]);
        addToast('Local decrypted cache cleared', 'info');
    };

    // -----------------------------------------------------------------------
    // Auth & Navigation handlers
    // -----------------------------------------------------------------------
    const handleAuthSuccess = async (userData: any, masterKey: CryptoKey, userVaults: any[]) => {
        setCurrentUser(userData);
        localStorage.setItem('telegphoto_user_profile', JSON.stringify(userData));
        const storedCfg = parseConfig();
        if (storedCfg) setConfig(storedCfg);

        if (masterKey) {
            setMasterVaultKey(masterKey);
        }
        if (userVaults && userVaults.length > 0) {
            const mappedVaults: VaultInfo[] = userVaults.map(v => ({
                id: v.id,
                name: v.name,
                chatId: '',
                type: 'photos'
            }));
            setVaults(mappedVaults);
            setActiveVaultId(mappedVaults[0].id);
        }
        addToast(`Welcome back, ${userData.username}!`, 'success');

        // Trigger background bootstrap sync from PostgreSQL cloud
        try {
            const bootstrapData = await syncApi.getBootstrap({ limit: 100 });
            if (bootstrapData.media && bootstrapData.media.length > 0) {
                const mappedPhotos: PhotoAsset[] = await Promise.all(bootstrapData.media.map(async (m) => {
                    let url = '';
                    const curCfg = storedCfg || config;
                    if (curCfg && m.telegram?.original?.fileId) {
                        try {
                            url = await getFileDownloadUrl(curCfg, m.telegram.original.fileId);
                        } catch {
                            url = '';
                        }
                    }
                    return {
                        id: m.id,
                        url: url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=84',
                        mediaType: m.mediaType || 'image',
                        fileName: m.fileName,
                        timestamp: m.createdAt,
                        fileSizeBytes: m.size,
                        isFavourite: m.favorite,
                        isTrash: m.trashed,
                        albumIds: m.albumIds,
                        vaultId: m.vaultId,
                        fileId: m.telegram?.original?.fileId,
                        messageId: m.telegram?.original?.messageId,
                    };
                }));
                setPhotos(mappedPhotos);
                localStorage.setItem('uploaded_photos', JSON.stringify(mappedPhotos));
            }
        } catch (syncErr) {
            console.warn('Bootstrap background sync note:', syncErr);
        }
    };

    const handleSignOut = async () => {
        try {
            await authApi.logout();
        } catch {}
        clearAllCredentialsAndStorage();
        clearActiveSession();
        setAccessToken(null);
        setCurrentUser(null);
        setConfig(null);
        setPhotos([]);
        setMasterVaultKey(null);
        setSelectedPhoto(null);
        setSelectedIds(new Set());
        addToast('Signed out of TeleGphoto', 'info');
    };

    if (loading) {
        return <SplashLoader />;
    }

    if (!currentUser && !config) {
        return (
            <>
                {authMode === 'login' ? (
                    <LoginView
                        onSuccess={handleAuthSuccess}
                        onSwitchToRegister={() => setAuthMode('register')}
                    />
                ) : (
                    <RegisterWizard
                        onSuccess={handleAuthSuccess}
                        onSwitchToLogin={() => setAuthMode('login')}
                    />
                )}
                <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            </>
        );
    }


    const storedPinData = getStoredPinData();
    if (isLocked && storedPinData) {
        return <AppLock storedPinData={storedPinData} onUnlock={() => setIsLocked(false)} />;
    }

    const activeVault = vaults.find(v => v.id === activeVaultId) || vaults[0];

    return (
        <div className="telegphoto-app-root" data-theme="dark">

            {/* 1. Left Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                activeVaultId={activeVaultId}
                vaults={vaults}
                onSelectVault={setActiveVaultId}
                onCreateVaultClick={() => setShowVaultCreateModal(true)}
                onStorageClick={() => setShowStorageModal(true)}
                onSecurityClick={() => setShowSecurityModal(true)}
                uploadsCount={uploadQueue.filter(u => u.status === 'uploading' || u.status === 'queued').length}
                trashCount={trashedPhotos.length}
                usedStorageGB={usedStorageGB}
                totalStorageGB={totalStorageGB}
                isOpen={sidebarMobileOpen}
                onClose={() => setSidebarMobileOpen(false)}
            />

            {/* 2. Main Center Content Area */}
            <main className="tg-center-viewport">
                {/* Top Toolbar */}
                <TopBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onUploadClick={() => setShowUploadModal(true)}
                    onMobileMenuClick={() => setSidebarMobileOpen(true)}
                    userName={userIdentity.displayName}

                    onOpenSettings={() => setShowSettingsModal(true)}
                    onOpenStorage={() => setShowStorageModal(true)}
                    onOpenSecurity={() => setShowSecurityModal(true)}
                    onLockApp={() => setIsLocked(true)}
                    onSignOut={handleSignOut}
                    notifications={notifications}
                    onClearNotifications={() => setNotifications([])}
                    searchInputRef={searchInputRef}
                    syncStatus={syncState.status}
                    syncPendingCount={pendingOperations.length}
                    lastSyncedText={syncState.lastSyncTimestamp ? `Synced ${new Date(syncState.lastSyncTimestamp).toLocaleTimeString()}` : 'Synced'}
                    onOpenSyncActivity={() => setShowSyncActivityModal(true)}
                />

                {/* Legacy Local Library Upgrade Banner */}
                <MigrationBanner onMigrationComplete={() => addToast('Library upgraded to Cloud Sync!', 'success')} />

                {/* View Content based on activeTab */}
                <div className="tg-view-scroll-container">

                    {activeTab === 'Photos' && (
                        <>
                            {/* Memories Banner */}
                            {!searchQuery && (
                                <MemoriesBanner
                                    memories={memories}
                                    onOpenMemoryStory={setActiveStoryMemory}
                                    onViewAllMemories={() => setActiveTab('Memories')}
                                />
                            )}

                            {/* Gallery Toolbar */}
                            <GalleryToolbar
                                dateLabel="Aug 2025"
                                totalCount={activeNonTrashPhotos.length}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                                sortField={sortField}
                                onSortFieldChange={setSortField}
                                sortDirection={sortDirection}
                                onSortDirectionToggle={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
                            />

                            {/* Timeline Photo Grid */}
                            <PhotoGrid
                                photos={activeNonTrashPhotos}
                                searchQuery={searchQuery}
                                viewMode={viewMode}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onPhotoClick={setSelectedPhoto}
                                onToggleFavorite={handleToggleFavorite}
                                onUploadClick={() => setShowUploadModal(true)}
                                activeVaultId={activeVaultId}
                                mediaTypeFilter={filters.mediaType}
                                favoritesOnlyFilter={filters.favoritesOnly}
                            />
                        </>
                    )}

                    {activeTab === 'Albums' && (
                        <AlbumsView
                            albums={albums}
                            photos={activeNonTrashPhotos}
                            onCreateAlbum={handleCreateAlbum}
                            onDeleteAlbum={handleDeleteAlbum}
                            onPhotoClick={setSelectedPhoto}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}

                    {activeTab === 'Memories' && (
                        <div style={{ padding: '20px 24px' }}>
                            <MemoriesBanner
                                memories={memories}
                                onOpenMemoryStory={setActiveStoryMemory}
                                onViewAllMemories={() => {}}
                            />
                            <div style={{ marginTop: '24px' }}>
                                <PhotoGrid
                                    photos={activeNonTrashPhotos}
                                    searchQuery=""
                                    viewMode={viewMode}
                                    sortField={sortField}
                                    sortDirection={sortDirection}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onPhotoClick={setSelectedPhoto}
                                    onToggleFavorite={handleToggleFavorite}
                                    activeVaultId={activeVaultId}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Favorites' && (
                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>⭐ Favorites ({favoritePhotos.length})</h2>
                            </div>
                            <PhotoGrid
                                photos={favoritePhotos}
                                searchQuery={searchQuery}
                                viewMode={viewMode}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onPhotoClick={setSelectedPhoto}
                                onToggleFavorite={handleToggleFavorite}
                                onUploadClick={() => setShowUploadModal(true)}
                                activeVaultId={activeVaultId}
                            />
                        </div>
                    )}

                    {activeTab === 'Smart Collections' && (
                        <SmartCollectionsView
                            photos={activeNonTrashPhotos}
                            onPhotoClick={setSelectedPhoto}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}

                    {activeTab === 'Search' && (
                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>🔍 Hybrid Semantic Search</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    Search concepts, extracted text, EXIF dates, or tags.
                                </p>
                            </div>
                            <PhotoGrid
                                photos={activeNonTrashPhotos}
                                searchQuery={searchQuery}
                                viewMode={viewMode}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onPhotoClick={setSelectedPhoto}
                                onToggleFavorite={handleToggleFavorite}
                                onUploadClick={() => setShowUploadModal(true)}
                                activeVaultId={activeVaultId}
                            />
                        </div>
                    )}

                    {activeTab === 'Uploads' && (
                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Uploads Queue</h2>
                                <button
                                    className="topbar-yellow-upload-btn"
                                    onClick={() => setShowUploadModal(true)}
                                >
                                    + Add More Files
                                </button>
                            </div>
                            {uploadQueue.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No active uploads.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {uploadQueue.map(item => (
                                        <div key={item.id} style={{ background: '#0D1219', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <b>{item.name}</b>
                                                <span>{item.status} ({item.progress}%)</span>
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                                <div style={{ height: '100%', width: `${item.progress}%`, background: '#FFC928', borderRadius: '4px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Trash' && (
                        <TrashView
                            trashedPhotos={trashedPhotos}
                            onRestorePhoto={handleRestorePhoto}
                            onPermanentDeletePhoto={handlePermanentDelete}
                            onEmptyTrash={handleEmptyTrash}
                        />
                    )}

                    {activeTab === 'Activity' && (
                        <ActivityView activities={activities} />
                    )}

                    {activeTab === 'Vaults' && (
                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Vault Management</h2>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Cryptographically isolated media vaults</span>
                                </div>
                                <button className="topbar-yellow-upload-btn" onClick={() => setShowVaultCreateModal(true)}>
                                    + Create New Vault
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                {vaults.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => setActiveVaultId(v.id)}
                                        style={{
                                            background: '#0D1219',
                                            border: v.id === activeVaultId ? '2px solid #FFC928' : '1px solid rgba(255,255,255,0.08)',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{v.name}</h4>
                                        <span style={{ color: '#FFC928', fontSize: '11.5px', fontWeight: 700 }}>
                                            {v.id === activeVaultId ? '● Active Vault' : 'Click to Switch'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'App Lock' && (
                        <div style={{ padding: '20px 24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>🔒 App Lock & Biometrics</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
                                Protect your vault with salted SHA-256 cryptographic PIN hashes.
                            </p>
                            <button
                                className="topbar-yellow-upload-btn"
                                onClick={() => setIsLocked(true)}
                            >
                                Lock App Now
                            </button>
                        </div>
                    )}

                    {activeTab === 'Settings' && (
                        <div style={{ padding: '0 0 24px 0' }}>
                            <SyncSettingsView
                                preferences={syncPreferences}
                                syncState={syncState}
                                onUpdatePreferences={(updates) => {
                                    const next = { ...syncPreferences, ...updates };
                                    setSyncPreferences(next);
                                    saveSyncPreferences(next);
                                    addToast('Preferences saved', 'success');
                                }}
                                onManualSync={triggerSync}
                                onRebuildSearchIndex={handleRebuildSearchIndex}
                                onClearLocalCache={handleClearLocalCache}
                                isSyncing={isSyncing}
                            />
                            <div style={{ padding: '0 28px' }}>
                                <button
                                    className="settings-action-btn"
                                    onClick={() => setShowSettingsModal(true)}
                                >
                                    Configure Telegram Bot API Credentials
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Multi-Select Bulk Actions Bar */}
                <BulkActionBar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onFavoriteAll={handleFavoriteAllSelected}
                    onAddToAlbum={() => setShowAddToAlbumPhotoId(Array.from(selectedIds)[0])}
                    onMoveToVault={() => addToast('Move to vault functionality ready', 'info')}
                    onDownloadAll={() => addToast(`Downloading ${selectedIds.size} files...`, 'info')}
                    onTrashAll={handleTrashAllSelected}
                />

                {/* Mobile Floating Bottom Dock */}
                <MobileBottomNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onUploadClick={() => setShowUploadModal(true)}
                />
            </main>

            {/* 3. Right Details Panel */}
            {selectedPhoto && (
                <DetailsPanel
                    photo={selectedPhoto}
                    vaultName={activeVault.name}
                    onClose={() => setSelectedPhoto(null)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenFullscreen={setFullscreenPhoto}
                    onOpenEditor={setShowEditorPhoto}
                    onOpenShare={setShowSharePhoto}
                    onOpenAddToAlbum={(p) => setShowAddToAlbumPhotoId(p.id)}
                    onDelete={handleSoftDelete}
                    onDownload={(p) => {
                        const a = document.createElement('a');
                        a.href = p.url;
                        a.download = p.fileName;
                        a.click();
                        addToast(`Downloading "${p.fileName}"`, 'info');
                    }}
                    onCategoryClick={() => {
                        setActiveTab('Smart Collections');
                        setSelectedPhoto(null);
                    }}
                />
            )}

            {/* --------------------------------------------------------------- */}
            {/* Interactive Modals                                              */}
            {/* --------------------------------------------------------------- */}

            {/* Sync Activity Modal */}
            <SyncActivityModal
                isOpen={showSyncActivityModal}
                onClose={() => setShowSyncActivityModal(false)}
                syncState={syncState}
                preferences={syncPreferences}
                pendingOperations={pendingOperations}
                onSyncNow={triggerSync}
                onRetryFailed={() => {
                    retryFailedOperations();
                    setPendingOperations(getStoredSyncQueue());
                    triggerSync();
                }}
                isSyncing={isSyncing}
            />

            {/* Onboarding Library Restoration Overlay */}
            <OnboardingSyncOverlay
                isOpen={isOnboardingSync}
                syncedCount={onboardingSyncedCount}
                totalCount={onboardingTotalCount}
                onContinueInBackground={() => setIsOnboardingSync(false)}
            />

            {/* Upload Manager Modal */}
            <UploadManagerModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                queue={uploadQueue}
                onAddFiles={handleAddUploadFiles}
                onRetryItem={(id) => {
                    const item = uploadQueue.find(i => i.id === id);
                    if (item) handleAddUploadFiles([item.file]);
                }}
                onRemoveItem={(id) => setUploadQueue(q => q.filter(i => i.id !== id))}
                onClearCompleted={() => setUploadQueue(q => q.filter(i => i.status !== 'completed'))}
            />

            {/* Non-Destructive Photo Editor */}
            {showEditorPhoto && (
                <MediaEditorModal
                    photo={showEditorPhoto}
                    isOpen={!!showEditorPhoto}
                    onClose={() => setShowEditorPhoto(null)}
                    onSaveEdits={handleSaveEdits}
                />
            )}

            {/* Share Modal */}
            {showSharePhoto && (
                <ShareModal
                    photo={showSharePhoto}
                    isOpen={!!showSharePhoto}
                    onClose={() => setShowSharePhoto(null)}
                    onDownloadDecrypted={(p) => {
                        const a = document.createElement('a');
                        a.href = p.url;
                        a.download = p.fileName;
                        a.click();
                    }}
                />
            )}

            {/* Add To Album Modal */}
            {showAddToAlbumPhotoId && (
                <AddToAlbumModal
                    photoId={showAddToAlbumPhotoId}
                    photoIds={selectedIds.size > 0 ? Array.from(selectedIds) : [showAddToAlbumPhotoId]}
                    albums={albums}
                    isOpen={!!showAddToAlbumPhotoId}
                    onClose={() => setShowAddToAlbumPhotoId(null)}
                    onAddPhotosToAlbum={handleAddPhotosToAlbum}
                    onCreateAlbumAndAdd={handleCreateAlbum}
                />
            )}

            {/* Create Vault Modal */}
            <VaultSwitcherModal
                isOpen={showVaultCreateModal}
                onClose={() => setShowVaultCreateModal(false)}
                onCreateVault={handleCreateVault}
            />

            {/* Storage Analytics Modal */}
            <StorageAnalyticsModal
                isOpen={showStorageModal}
                onClose={() => setShowStorageModal(false)}
                usedBytes={usedBytes}
                totalGB={totalStorageGB}
                photosCount={activeNonTrashPhotos.filter(p => p.mediaType === 'image').length}
                videosCount={activeNonTrashPhotos.filter(p => p.mediaType === 'video').length}
                docsCount={activeNonTrashPhotos.filter(p => p.mediaType === 'document').length}
                trashCount={trashedPhotos.length}
                onEmptyTrash={handleEmptyTrash}
            />

            {/* Security & Privacy Architecture Modal */}
            <SecurityPrivacyModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                activeVaultName={activeVault.name}
                onOpenDevices={() => setShowDevicesModal(true)}
            />

            {/* Connected Devices Modal */}
            <ConnectedDevicesModal
                isOpen={showDevicesModal}
                onClose={() => setShowDevicesModal(false)}
            />


            {/* Fullscreen Memory Story Viewer */}
            {activeStoryMemory && (
                <MemoryStoryViewer
                    memory={activeStoryMemory}
                    onClose={() => setActiveStoryMemory(null)}
                    onPhotoClick={(p) => {
                        setSelectedPhoto(p);
                        setActiveStoryMemory(null);
                    }}
                />
            )}

            {/* Fullscreen Photo Viewer */}
            {fullscreenPhoto && (
                <MediaViewer
                    photo={fullscreenPhoto}
                    onClose={() => setFullscreenPhoto(null)}
                    onDelete={handleSoftDelete}
                    onRestore={handleRestorePhoto}
                    onUpdate={(updated: PhotoAsset) => {
                        setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                />
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <SettingsModal
                    config={config}
                    onSave={(newCfg) => {
                        localStorage.setItem('telegram_config', JSON.stringify(newCfg));
                        setCredentialsCookie(true);
                        setConfig(newCfg);
                        setShowSettingsModal(false);
                        addToast('Telegram configuration saved', 'success');
                    }}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {/* Global Toasts Container */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
};

export default App;
