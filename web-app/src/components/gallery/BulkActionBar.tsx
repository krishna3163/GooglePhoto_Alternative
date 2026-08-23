import React from 'react';
import {
    Star,
    FolderPlus,
    Shield,
    Download,
    Trash2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './BulkActionBar.css';

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onFavoriteAll: () => void;
    onAddToAlbum: () => void;
    onMoveToVault: () => void;
    onDownloadAll: () => void;
    onTrashAll: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
    selectedCount,
    onClearSelection,
    onFavoriteAll,
    onAddToAlbum,
    onMoveToVault,
    onDownloadAll,
    onTrashAll,
}) => {
    if (selectedCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="bulk-action-bar-dock"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="bulk-selected-badge">
                    <button className="bulk-clear-btn" onClick={onClearSelection} title="Clear selection">
                        <X size={15} />
                    </button>
                    <span><b>{selectedCount}</b> selected</span>
                </div>

                <div className="bulk-divider" />

                <div className="bulk-actions-group">
                    <button className="bulk-action-btn" onClick={onFavoriteAll} title="Star selected">
                        <Star size={17} color="#FFC928" />
                        <span>Favorite</span>
                    </button>

                    <button className="bulk-action-btn" onClick={onAddToAlbum} title="Add to album">
                        <FolderPlus size={17} />
                        <span>Add to Album</span>
                    </button>

                    <button className="bulk-action-btn" onClick={onMoveToVault} title="Move to vault">
                        <Shield size={17} />
                        <span>Move to Vault</span>
                    </button>

                    <button className="bulk-action-btn" onClick={onDownloadAll} title="Download selected">
                        <Download size={17} />
                        <span>Download</span>
                    </button>

                    <button className="bulk-action-btn danger" onClick={onTrashAll} title="Move to trash">
                        <Trash2 size={17} color="#FF5C6C" />
                        <span>Trash</span>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BulkActionBar;
