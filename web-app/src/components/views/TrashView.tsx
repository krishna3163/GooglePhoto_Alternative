import React, { useState } from 'react';
import type { PhotoAsset } from '../../types';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import './TrashView.css';

interface TrashViewProps {
    trashedPhotos: PhotoAsset[];
    onRestorePhoto: (id: string) => void;
    onPermanentDeletePhoto: (id: string) => void;
    onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
    trashedPhotos,
    onRestorePhoto,
    onPermanentDeletePhoto,
    onEmptyTrash,
}) => {
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

    return (
        <div className="trash-main-page">
            <div className="trash-page-header">
                <div className="trash-title-block">
                    <h2>Trash</h2>
                    <span>Items in Trash can be restored or permanently removed</span>
                </div>

                {trashedPhotos.length > 0 && (
                    <button className="empty-trash-top-btn" onClick={() => setShowEmptyConfirm(true)}>
                        <Trash2 size={16} />
                        <span>Empty Trash</span>
                    </button>
                )}
            </div>

            {trashedPhotos.length === 0 ? (
                <div className="trash-empty-state">
                    <Trash2 size={54} color="#FFC928" />
                    <h3>Trash is empty</h3>
                    <p>Deleted photos and videos will appear here before permanent deletion.</p>
                </div>
            ) : (
                <div className="trash-grid">
                    {trashedPhotos.map((photo) => (
                        <div key={photo.id} className="trash-card-item">
                            <div className="trash-thumbnail-wrap">
                                <img src={photo.url} alt={photo.fileName} />
                            </div>
                            <div className="trash-card-body">
                                <span className="trash-item-filename" title={photo.fileName}>
                                    {photo.fileName}
                                </span>
                                <div className="trash-card-actions">
                                    <button
                                        className="trash-action-btn restore"
                                        onClick={() => onRestorePhoto(photo.id)}
                                        title="Restore photo"
                                    >
                                        <RefreshCw size={14} />
                                        <span>Restore</span>
                                    </button>
                                    <button
                                        className="trash-action-btn delete-perm"
                                        onClick={() => {
                                            if (window.confirm(`Permanently delete "${photo.fileName}"? This cannot be undone.`)) {
                                                onPermanentDeletePhoto(photo.id);
                                            }
                                        }}
                                        title="Delete permanently"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty Trash Confirmation Modal */}
            {showEmptyConfirm && (
                <div className="trash-modal-overlay">
                    <div className="trash-confirm-card">
                        <div className="trash-confirm-icon">
                            <AlertTriangle size={32} color="#FF5C6C" />
                        </div>
                        <h3>Permanently delete all {trashedPhotos.length} item{trashedPhotos.length !== 1 ? 's' : ''}?</h3>
                        <p>This action cannot be undone. All encrypted media records will be permanently removed.</p>
                        <div className="trash-confirm-btn-row">
                            <button className="confirm-cancel-btn" onClick={() => setShowEmptyConfirm(false)}>
                                Cancel
                            </button>
                            <button
                                className="confirm-delete-btn"
                                onClick={() => {
                                    onEmptyTrash();
                                    setShowEmptyConfirm(false);
                                }}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrashView;
