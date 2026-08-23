import React, { useState } from 'react';
import type { Album } from '../../types';
import { X, Plus, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import './AddToAlbumModal.css';

interface AddToAlbumModalProps {
    photoId: string;
    photoIds?: string[];
    albums: Album[];
    isOpen: boolean;
    onClose: () => void;
    onAddPhotosToAlbum: (albumId: string, photoIds: string[]) => void;
    onCreateAlbumAndAdd: (name: string, photoIds: string[]) => void;
}

export const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({
    photoId,
    photoIds,
    albums,
    isOpen,
    onClose,
    onAddPhotosToAlbum,
    onCreateAlbumAndAdd,
}) => {
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState('');

    if (!isOpen) return null;

    const targetPhotoIds = photoIds && photoIds.length > 0 ? photoIds : [photoId];

    const filteredAlbums = albums.filter(a =>
        (a.title || a.name).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectAlbum = (albumId: string) => {
        onAddPhotosToAlbum(albumId, targetPhotoIds);
        onClose();
    };

    const handleCreateNew = () => {
        if (!newAlbumTitle.trim()) return;
        onCreateAlbumAndAdd(newAlbumTitle.trim(), targetPhotoIds);
        setIsCreating(false);
        setNewAlbumTitle('');
        onClose();
    };

    return (
        <div className="album-modal-overlay">
            <motion.div
                className="album-modal-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="album-modal-header">
                    <div className="album-title-group">
                        <h3>Add to Album</h3>
                        <span>Add {targetPhotoIds.length} item{targetPhotoIds.length > 1 ? 's' : ''} to an album</span>
                    </div>
                    <button className="album-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="album-modal-body">
                    {!isCreating ? (
                        <>
                            <div className="album-search-bar">
                                <input
                                    type="text"
                                    placeholder="Search albums..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="album-search-input"
                                />
                            </div>

                            <button className="create-new-album-trigger-btn" onClick={() => setIsCreating(true)}>
                                <Plus size={18} color="#FFC928" />
                                <span>Create New Album</span>
                            </button>

                            <div className="album-picker-list">
                                {filteredAlbums.length === 0 ? (
                                    <div className="album-empty-notice">
                                        <span>No albums found</span>
                                    </div>
                                ) : (
                                    filteredAlbums.map((album) => (
                                        <button
                                            key={album.id}
                                            className="album-picker-row"
                                            onClick={() => handleSelectAlbum(album.id)}
                                        >
                                            <div className="album-icon-wrap">
                                                <Folder size={20} color="#FFC928" />
                                            </div>
                                            <div className="album-row-meta">
                                                <span className="album-row-title">{album.title || album.name}</span>
                                                <span className="album-row-count">{album.photoIds.length} items</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="create-album-form-pane">
                            <label>New Album Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Goa Trip 2025"
                                value={newAlbumTitle}
                                onChange={(e) => setNewAlbumTitle(e.target.value)}
                                className="new-album-title-input"
                                autoFocus
                            />
                            <div className="create-album-btn-row">
                                <button className="create-cancel-btn" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="create-confirm-btn"
                                    onClick={handleCreateNew}
                                    disabled={!newAlbumTitle.trim()}
                                >
                                    Create & Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AddToAlbumModal;
