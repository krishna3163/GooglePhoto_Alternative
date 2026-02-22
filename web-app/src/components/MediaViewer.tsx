import React, { useState } from 'react';
import { X, Trash2, Download, Edit2, Check, FileText, Star, ExternalLink } from 'lucide-react';
import type { PhotoAsset } from '../types';
import './MediaViewer.css';

interface MediaViewerProps {
    photo: PhotoAsset;
    onClose: () => void;
    onDelete: (id: string) => void;
    onUpdate: (photo: PhotoAsset) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ photo, onClose, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(photo.fileName);

    const handleSaveName = () => {
        onUpdate({ ...photo, fileName: editedName });
        setIsEditing(false);
    };

    const toggleFavourite = () => {
        onUpdate({ ...photo, isFavourite: !photo.isFavourite });
    };

    const isPdf = photo.fileName.toLowerCase().endsWith('.pdf');

    const renderContent = () => {
        switch (photo.mediaType) {
            case 'video':
                return (
                    <video src={photo.url} controls autoPlay className="viewer-media" />
                );
            case 'document':
                if (isPdf) {
                    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(photo.url)}&embedded=true`;
                    return (
                        <div className="viewer-pdf-container">
                            <iframe
                                src={googleDocsUrl}
                                title={photo.fileName}
                                width="100%"
                                height="100%"
                                className="pdf-iframe"
                                frameBorder="0"
                            />
                            <div className="pdf-fallback-overlay">
                                <div className="fallback-icon-circle">
                                    <FileText size={40} color="#8ab4f8" />
                                </div>
                                <h3>PDF Preview</h3>
                                <p>If the document doesn't appear above, you can open it directly in a new tab.</p>
                                <div className="pdf-action-buttons">
                                    <a href={photo.url} target="_blank" rel="noreferrer" className="view-pdf-btn">
                                        <ExternalLink size={18} />
                                        Open Original PDF
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="viewer-document">
                        <div className="document-preview-card">
                            <FileText size={100} color="#8ab4f8" />
                            <span className="viewer-doc-name">{photo.fileName}</span>
                            <p className="doc-type-badge">{photo.fileName.split('.').pop()?.toUpperCase()} Document</p>
                            <a href={photo.url} target="_blank" rel="noreferrer" className="view-pdf-btn">
                                <Download size={18} />
                                Download File
                            </a>
                        </div>
                    </div>
                );
            default:
                return <img src={photo.url} alt={photo.fileName} className="viewer-media" />;
        }
    };

    return (
        <div className="viewer-overlay">
            <div className="viewer-header">
                <div className="viewer-left">
                    <button className="viewer-icon-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                    <div className="viewer-title-area">
                        {isEditing ? (
                            <div className="edit-name-row">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    autoFocus
                                />
                                <button className="save-edit-btn" onClick={handleSaveName}>
                                    <Check size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="display-name-row">
                                <span className="viewer-filename">{photo.fileName}</span>
                                <button className="edit-icon-btn" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                        <span className="viewer-date">
                            {new Date(photo.timestamp).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="viewer-right">
                    <button
                        className={`viewer-icon-btn ${photo.isFavourite ? 'active-fav' : ''}`}
                        title="Mark as Favourite"
                        onClick={toggleFavourite}
                    >
                        <Star size={22} fill={photo.isFavourite ? "#8ab4f8" : "none"} stroke={photo.isFavourite ? "#8ab4f8" : "currentColor"} />
                    </button>
                    <button
                        className="viewer-icon-btn"
                        title="Download"
                        onClick={() => window.open(photo.url, '_blank')}
                    >
                        <Download size={22} />
                    </button>
                    <button
                        className="viewer-icon-btn delete-btn"
                        title="Delete"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this item? It will be removed from your cloud gallery.')) {
                                onDelete(photo.id);
                            }
                        }}
                    >
                        <Trash2 size={22} />
                    </button>
                </div>
            </div>

            <div className="viewer-content">
                {renderContent()}
            </div>

            {(photo.ocrText || photo.location) && !isPdf && (
                <div className="viewer-ocr-panel" style={{ bottom: '20px' }}>
                    {photo.ocrText && (
                        <>
                            <h3>Recognized Text</h3>
                            <p>{photo.ocrText}</p>
                        </>
                    )}
                    {photo.location && (
                        <div className="location-info">
                            <h3>Location</h3>
                            <p>📍 {photo.location.name}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaViewer;
