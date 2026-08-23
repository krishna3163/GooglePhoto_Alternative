import React, { useState } from 'react';
import { CloudUpload, X, Sparkles } from 'lucide-react';
import { migrationApi } from '../../api/migrationApi';

import { getStoredPhotos, getStoredVaults } from '../../utils/storage';
import './MigrationBanner.css';

interface MigrationBannerProps {
  onMigrationComplete: () => void;
}

export const MigrationBanner: React.FC<MigrationBannerProps> = ({ onMigrationComplete }) => {
  const [dismissed, setDismissed] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const localPhotosRaw = getStoredPhotos();
  const localPhotos = localPhotosRaw ? JSON.parse(localPhotosRaw) : [];

  if (dismissed || localPhotos.length === 0) return null;

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const localVaults = getStoredVaults();
      const res = await migrationApi.migrateLegacyLibrary({
        media: localPhotos,
        albums: [],
        vaults: localVaults,
      });

      setResult(`Successfully synced ${res.migratedMedia} items to your cloud account!`);
      setTimeout(() => {
        setDismissed(true);
        onMigrationComplete();
      }, 2500);
    } catch (err: any) {
      console.error('Migration notice:', err);
      setResult('Migration encountered an issue. Local items remain safe.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="migration-banner-bar">
      <div className="migration-banner-content">
        <div className="migration-icon-box">
          <CloudUpload size={20} color="#FFC928" />
        </div>
        <div className="migration-text-group">
          <h4>Upgrade Local Library to Cross-Device Cloud</h4>
          <p>
            We found {localPhotos.length} locally cached photos. Upgrade your library to sync seamlessly across all your devices without re-uploading media.
          </p>
          {result && <span className="migration-result-msg">{result}</span>}
        </div>
      </div>

      <div className="migration-banner-actions">
        <button
          className="migration-upgrade-btn"
          onClick={handleMigrate}
          disabled={migrating}
        >
          <Sparkles size={16} />
          <span>{migrating ? 'Upgrading...' : 'Sync to Cloud'}</span>
        </button>
        <button
          className="migration-dismiss-btn"
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default MigrationBanner;
