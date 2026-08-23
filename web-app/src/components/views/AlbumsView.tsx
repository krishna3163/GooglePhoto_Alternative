import React, { useState } from 'react';
import type { Album, PhotoAsset } from '../../types';
import { Folder, Plus, ArrowLeft, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { PhotoCard } from '../gallery/PhotoCard';
import './AlbumsView.css';

interface AlbumsViewProps {
    albums: Album[];
    photos: PhotoAsset[];
    onCreateAlbum: (name: string) => void;
    onDeleteAlbum: (albumId: string) => void;
    onPhotoClick: (photo: PhotoAsset) => void;
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const AlbumsView: React.FC<AlbumsViewProps> = ({
    albums,
    photos,
    onCreateAlbum,
    onDeleteAlbum,
    onPhotoClick,
    onToggleFavorite,
}) => {
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const activeAlbum = albums.find(a => a.id === selectedAlbumId);

    // Photos inside selected album
    const albumPhotos = activeAlbum
        ? photos.filter(p => activeAlbum.photoIds.includes(p.id))
        : [];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        onCreateAlbum(newTitle.trim());
        setNewTitle('');
        setShowCreateModal(false);
    };

    if (selectedAlbumId && activeAlbum) {
        const albumName = activeAlbum.title || activeAlbum.name;
        return (
            <div className="album-detail-view">
                <div className="album-detail-header">
                    <button className="album-back-btn" onClick={() => setSelectedAlbumId(null)}>
                        <ArrowLeft size={18} />
                        <span>All Albums</span>
                    </button>

                    <div className="album-detail-title-group">
                        <h2>{albumName}</h2>
                        <span>{albumPhotos.length} item{albumPhotos.length !== 1 ? 's' : ''}</span>
                    </div>

                    <button
                        className="album-delete-btn"
                        onClick={() => {
                            if (window.confirm(`Delete album "${albumName}"? Photos inside will remain safe in your library.`)) {
                                onDeleteAlbum(activeAlbum.id);
                                setSelectedAlbumId(null);
                            }
                        }}
                    >
                        <Trash2 size={16} />
                        <span>Delete Album</span>
                    </button>
                </div>

                {albumPhotos.length === 0 ? (
                    <div className="album-empty-photos">
                        <ImageIcon size={48} color="#FFC928" />
                        <h3>This album is empty</h3>
                        <p>Select photos from your library and choose "Add to Album".</p>
                    </div>
                ) : (
                    <div className="date-group-grid view-grid" style={{ padding: '20px 24px' }}>
                        {albumPhotos.map((photo) => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                isSelected={false}
                                onToggleSelect={() => {}}
                                onClick={onPhotoClick}
                                onToggleFavorite={onToggleFavorite}
                                viewMode="grid"
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="albums-main-page">
            <div className="albums-page-header">
                <div className="albums-title-block">
                    <h2>Albums</h2>
                    <span>{albums.length} album{albums.length !== 1 ? 's' : ''}</span>
                </div>

                <button className="create-album-btn" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    <span>Create Album</span>
                </button>
            </div>

            {albums.length === 0 ? (
                <div className="albums-empty-state">
                    <Folder size={54} color="#FFC928" />
                    <h3>No albums yet</h3>
                    <p>Organize your photos into custom albums for trips, events, and projects.</p>
                    <button className="create-album-btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} />
                        <span>Create your first album</span>
                    </button>
                </div>
            ) : (
                <div className="albums-grid">
                    {albums.map((album) => {
                        const coverPhoto = photos.find(p => album.photoIds.includes(p.id));
                        return (
                            <motion.div
                                key={album.id}
                                className="album-card"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedAlbumId(album.id)}
                            >
                                <div className="album-cover-wrap">
                                    {coverPhoto ? (
                                        <img src={coverPhoto.url} alt={album.title || album.name} />
                                    ) : (
                                        <div className="album-cover-placeholder">
                                            <Folder size={42} color="#FFC928" />
                                        </div>
                                    )}
                                </div>
                                <div className="album-card-info">
                                    <h4>{album.title || album.name}</h4>
                                    <span>{album.photoIds.length} items</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Album Modal */}
            {showCreateModal && (
                <div className="album-modal-overlay">
                    <div className="album-modal-card">
                        <div className="album-modal-header">
                            <h3>New Album</h3>
                            <button className="album-close-btn" onClick={() => setShowCreateModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <input
                                type="text"
                                placeholder="Album name..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="new-album-title-input"
                                autoFocus
                                required
                            />
                            <div className="create-album-btn-row">
                                <button type="button" className="create-cancel-btn" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="create-confirm-btn" disabled={!newTitle.trim()}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlbumsView;
