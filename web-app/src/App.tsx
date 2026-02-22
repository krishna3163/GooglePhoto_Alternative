import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PhotoGrid from './components/PhotoGrid';
import SettingsModal from './components/SettingsModal';
import MediaViewer from './components/MediaViewer';
import SplashLoader from './components/SplashLoader';
import SetupGuide from './components/SetupGuide';
import MessageBoard from './components/MessageBoard';
import DeveloperProfile from './components/DeveloperProfile';
import UploadQueue from './components/UploadQueue';
import TelegramManager from './components/TelegramManager';
import { uploadFileToTelegram, getFileDownloadUrl, deleteTelegramMessage } from './services/telegramService';
import { extractTextFromImage } from './services/ocrService';
import type { TelegramConfig, PhotoAsset, UploadItem } from './types';
import { getStoredConfig, getStoredUserName, getStoredPhotos, getStoredLayout, setStoredLayout, setCredentialsCookie } from './utils/storage';
import type { LayoutMode } from './utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
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

const App: React.FC = () => {
  const [config, setConfig] = useState<TelegramConfig | null>(parseConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDevProfile, setShowDevProfile] = useState(false);
  const [photos, setPhotos] = useState<PhotoAsset[]>(parsePhotos);
  const [activeTab, setActiveTab] = useState('Photos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(() => getStoredUserName() || 'Krishna');
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getStoredLayout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!config) {
      setShowSettings(true);
      setShowGuide(true);
    }
    const timer = setTimeout(() => setLoading(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    setStoredLayout(mode);
  };

  // Worker Pool logic
  useEffect(() => {
    if (!config || uploadQueue.length === 0) return;

    const MAX_PARALLEL = 4;
    const uploadingCount = uploadQueue.filter(i => i.status === 'uploading').length;

    if (uploadingCount < MAX_PARALLEL) {
      const nextItem = uploadQueue.find(i => i.status === 'pending');
      if (nextItem) {
        startUpload(nextItem);
      }
    }
  }, [uploadQueue, config]);

  const updateQueueItem = (id: string, updates: Partial<UploadItem>) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const startUpload = async (item: UploadItem) => {
    if (!config) return;

    updateQueueItem(item.id, { status: 'uploading', progress: 0 });

    try {
      const isImage = item.file.type.startsWith('image/');
      const isVideo = item.file.type.startsWith('video/');
      const mediaType = isImage ? 'image' : isVideo ? 'video' : 'document';

      const { fileId, messageId } = await uploadFileToTelegram(config, item.file, mediaType, (p) => {
        updateQueueItem(item.id, { progress: p });
      });

      const downloadUrl = await getFileDownloadUrl(config, fileId);

      const newAsset: PhotoAsset = {
        id: fileId,
        url: downloadUrl,
        mediaType: mediaType,
        fileName: item.file.name,
        timestamp: new Date().toISOString(),
        isFavourite: false,
        messageId,
        fileId
      };

      if (isImage) {
        try {
          const text = await extractTextFromImage(downloadUrl);
          if (text) newAsset.ocrText = text;
        } catch (err) {
          console.warn('OCR failed');
        }
      }

      handleNewPhoto(newAsset);
      updateQueueItem(item.id, { status: 'success', progress: 100, fileId, messageId });
    } catch (error) {
      if (item.retries < 3) {
        const delay = Math.pow(2, item.retries + 1) * 1000;
        setTimeout(() => {
          updateQueueItem(item.id, { status: 'pending', retries: item.retries + 1 });
        }, delay);
      } else {
        updateQueueItem(item.id, { status: 'failed', error: String(error) });
      }
    }
  };

  const handleFilesSelected = (files: FileList) => {
    const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB Telegram limit
    const filteredFiles = Array.from(files).filter(file => {
      if (file.name.startsWith('.')) return false;
      if (file.size > MAX_SIZE) {
        alert(`File ${file.name} is too large (>2GB)`);
        return false;
      }
      const isDuplicate = photos.some(p => p.fileName === file.name);
      if (isDuplicate) {
        console.log("Skipping duplicate:", file.name);
        return false;
      }
      return true;
    });

    const newItems: UploadItem[] = filteredFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      progress: 0,
      retries: 0
    }));

    if (newItems.length > 0) {
      setUploadQueue(prev => [...prev, ...newItems]);
      setShowQueue(true);
    }
  };

  const handleSaveConfig = (newConfig: TelegramConfig) => {
    localStorage.setItem('telegram_config', JSON.stringify(newConfig));
    setCredentialsCookie(true);
    setConfig(newConfig);
    setShowSettings(false);
  };

  const handleNewPhoto = (photo: PhotoAsset) => {
    setPhotos(prev => {
      const updated = [photo, ...prev];
      localStorage.setItem('uploaded_photos', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeletePhoto = async (photoId: string) => {
    const photoToDelete = photos.find(p => p.id === photoId);
    if (photoToDelete?.messageId && config) {
      await deleteTelegramMessage(config, photoToDelete.messageId);
    }

    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      localStorage.setItem('uploaded_photos', JSON.stringify(updated));
      return updated;
    });
    setSelectedPhoto(null);
  };

  const handleUpdatePhoto = (updatedPhoto: PhotoAsset) => {
    setPhotos(prev => {
      const updated = prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p);
      localStorage.setItem('uploaded_photos', JSON.stringify(updated));
      return updated;
    });
    if (selectedPhoto && selectedPhoto.id === updatedPhoto.id) {
      setSelectedPhoto(updatedPhoto);
    }
  };

  const handleUpdateName = (newName: string) => {
    setUserName(newName);
    localStorage.setItem('user_name', newName);
  };

  const getFilteredPhotos = () => {
    let basePhotos = photos;
    if (activeTab === 'Videos') {
      basePhotos = photos.filter(p => p.mediaType === 'video');
    } else if (activeTab === 'Documents') {
      basePhotos = photos.filter(p => p.mediaType === 'document');
    } else if (activeTab === 'Favourites') {
      basePhotos = photos.filter(p => p.isFavourite);
    } else if (activeTab === 'Screenshots and recordings') {
      basePhotos = photos.filter(p =>
        p.fileName.toLowerCase().includes('screenshot') ||
        p.fileName.toLowerCase().includes('screen_recording') ||
        p.fileName.toLowerCase().includes('scr_')
      );
    } else if (activeTab === 'Recently added') {
      return photos;
    } else if (activeTab === 'Places') {
      basePhotos = photos.filter(p => p.location);
    } else if (activeTab === 'People') {
      basePhotos = photos.filter(p => p.faces && p.faces.length > 0);
    }
    return basePhotos;
  };

  const handleDeveloperModeToggle = (enabled: boolean) => {
    if (config) {
      const updatedConfig = { ...config, isDeveloperMode: enabled };
      setConfig(updatedConfig);
      localStorage.setItem('telegram_config', JSON.stringify(updatedConfig));
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <SplashLoader key="splash" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="app-container"
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isDeveloperMode={config?.isDeveloperMode}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="main-wrapper">
            <Header
              config={config}
              userName={userName}
              onSettingsClick={() => setShowSettings(true)}
              onSearchChange={setSearchQuery}
              onUpdateName={handleUpdateName}
              onHelpClick={() => setShowGuide(true)}
              onDevClick={() => setShowDevProfile(true)}
              onFilesSelected={handleFilesSelected}
              onDeveloperModeToggle={handleDeveloperModeToggle}
              layoutMode={layoutMode}
              onLayoutChange={handleLayoutChange}
              showLayoutToggle={activeTab !== 'Messages' && activeTab !== 'Telegram'}
              onMenuClick={() => setSidebarOpen(true)}
            />
            <motion.main
              className="content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {activeTab === 'Messages' ? (
                <MessageBoard />
              ) : activeTab === 'Telegram' ? (
                <TelegramManager config={config} />
              ) : (
                <PhotoGrid
                  config={config}
                  photos={getFilteredPhotos()}
                  searchQuery={searchQuery}
                  title={activeTab}
                  onPhotoClick={setSelectedPhoto}
                  layoutMode={layoutMode}
                />
              )}
            </motion.main>
          </div>
          {showSettings && (
            <SettingsModal
              config={config}
              onSave={handleSaveConfig}
              onClose={() => setShowSettings(false)}
              onHelpClick={() => setShowGuide(true)}
            />
          )}
          {selectedPhoto && (
            <MediaViewer
              photo={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
              onDelete={handleDeletePhoto}
              onUpdate={handleUpdatePhoto}
            />
          )}
          <AnimatePresence>
            {showGuide && (
              <SetupGuide onClose={() => setShowGuide(false)} />
            )}
            {showDevProfile && (
              <DeveloperProfile onClose={() => setShowDevProfile(false)} />
            )}
            {showQueue && (
              <UploadQueue
                items={uploadQueue}
                onRetry={(id) => updateQueueItem(id, { status: 'pending', retries: 0 })}
                onRemove={(id) => setUploadQueue(prev => prev.filter(i => i.id !== id))}
                onClose={() => setShowQueue(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
