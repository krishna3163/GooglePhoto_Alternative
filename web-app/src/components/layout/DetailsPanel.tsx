import React, { useState } from 'react';
import type { PhotoAsset } from '../../types';
import {
    X,
    Star,
    Info,
    Edit3,
    Share2,
    FolderPlus,
    MoreHorizontal,
    MapPin,
    FileText,
    Shield,
    Download,
    EyeOff,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './DetailsPanel.css';

interface DetailsPanelProps {
    photo: PhotoAsset;
    vaultName: string;
    onClose: () => void;
    onToggleFavorite: (id: string) => void;
    onOpenFullscreen: (photo: PhotoAsset) => void;
    onOpenEditor: (photo: PhotoAsset) => void;
    onOpenShare: (photo: PhotoAsset) => void;
    onOpenAddToAlbum: (photo: PhotoAsset) => void;
    onDelete: (id: string) => void;
    onDownload: (photo: PhotoAsset) => void;
    onHideFromMemories?: (id: string) => void;
    onCategoryClick?: (category: string) => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({
    photo,
    vaultName,
    onClose,
    onToggleFavorite,
    onOpenFullscreen,
    onOpenEditor,
    onOpenShare,
    onOpenAddToAlbum,
    onDelete,
    onDownload,
    onHideFromMemories,
    onCategoryClick,
}) => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [ocrExpanded, setOcrExpanded] = useState(false);

    const formattedDate = new Date(photo.timestamp).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const formattedTime = new Date(photo.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    const fileExt = photo.fileName.split('.').pop()?.toUpperCase() || 'JPG';
    const fileSizeStr = photo.fileSizeBytes
        ? `${(photo.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : '4.2 MB';
    const dimensionsStr = photo.exif?.dimensions
        ? `${photo.exif.dimensions.width} × ${photo.exif.dimensions.height}`
        : '4032 × 3024';

    const cameraModel = photo.exif?.cameraModel || 'Samsung SM-S23';
    const cameraSettings = photo.exif?.fNumber
        ? `f/${photo.exif.fNumber} · ${photo.exif.exposureTime || '1/120s'} · ISO ${photo.exif.iso || 50}`
        : 'f/1.8 · 1/120s · ISO 50';

    const locationName = photo.location?.name || 'Goa, India';
    const latLngStr = photo.location?.lat && photo.location?.lng
        ? `${photo.location.lat.toFixed(4)}° N, ${photo.location.lng.toFixed(4)}° E`
        : '15.2993° N, 74.1240° E';

    const smartCategory = photo.mediaType === 'document' ? 'Documents' : photo.location ? 'Travel' : 'Photos';

    return (
        <aside className="tg-details-panel">
            {/* Header */}
            <div className="details-panel-header">
                <span className="details-filename" title={photo.fileName}>
                    {photo.fileName}
                </span>
                <div className="details-header-actions">
                    <button
                        className={`details-star-btn ${photo.isFavourite ? 'starred' : ''}`}
                        onClick={() => onToggleFavorite(photo.id)}
                        title={photo.isFavourite ? 'Remove favorite' : 'Add to favorites'}
                    >
                        <Star size={19} fill={photo.isFavourite ? '#FFC928' : 'none'} color={photo.isFavourite ? '#FFC928' : '#A7AFBC'} />
                    </button>
                    <button className="details-close-btn" onClick={onClose} title="Close details">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Media Preview Card */}
            <div className="details-preview-container" onClick={() => onOpenFullscreen(photo)}>
                {photo.mediaType === 'video' ? (
                    <video src={photo.url} className="details-preview-media" muted />
                ) : photo.mediaType === 'document' ? (
                    <div className="details-doc-preview-card">
                        <FileText size={48} color="#FFC928" />
                        <span>{photo.fileName}</span>
                    </div>
                ) : (
                    <img src={photo.url} alt={photo.fileName} className="details-preview-media" />
                )}
                <div className="details-preview-expand-hint">
                    <ExternalLink size={14} /> Click to expand
                </div>
            </div>

            {/* 5 Horizontal Action Buttons */}
            <div className="details-action-bar">
                <button className="details-action-btn active" title="Details info">
                    <Info size={18} />
                    <span>Info</span>
                </button>

                <button className="details-action-btn" onClick={() => onOpenEditor(photo)} title="Edit photo">
                    <Edit3 size={18} />
                    <span>Edit</span>
                </button>

                <button className="details-action-btn" onClick={() => onOpenShare(photo)} title="Share photo">
                    <Share2 size={18} />
                    <span>Share</span>
                </button>

                <button className="details-action-btn" onClick={() => onOpenAddToAlbum(photo)} title="Add to album">
                    <FolderPlus size={18} />
                    <span>Add to</span>
                </button>

                <div className="more-menu-wrapper">
                    <button
                        className="details-action-btn"
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        title="More options"
                    >
                        <MoreHorizontal size={18} />
                        <span>More</span>
                    </button>

                    <AnimatePresence>
                        {showMoreMenu && (
                            <motion.div
                                className="details-more-dropdown"
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <button
                                    className="more-dropdown-item"
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        onDownload(photo);
                                    }}
                                >
                                    <Download size={16} />
                                    <span>Download Original</span>
                                </button>
                                {onHideFromMemories && (
                                    <button
                                        className="more-dropdown-item"
                                        onClick={() => {
                                            setShowMoreMenu(false);
                                            onHideFromMemories(photo.id);
                                        }}
                                    >
                                        <EyeOff size={16} />
                                        <span>Hide from Memories</span>
                                    </button>
                                )}
                                <div className="dropdown-divider" />
                                <button
                                    className="more-dropdown-item danger"
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        onDelete(photo.id);
                                    }}
                                >
                                    <Trash2 size={16} />
                                    <span>Move to Trash</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scrollable Details Section */}
            <div className="details-scroll-content">
                <div className="details-section-heading">Details</div>

                {/* Date & Time */}
                <div className="details-info-block">
                    <span className="info-label">Date & Time</span>
                    <span className="info-value">{formattedDate} · {formattedTime}</span>
                </div>

                {/* File Info */}
                <div className="details-info-block">
                    <span className="info-label">File Info</span>
                    <span className="info-value">{fileSizeStr} · {dimensionsStr} · {fileExt}</span>
                </div>

                {/* Camera */}
                <div className="details-info-block">
                    <span className="info-label">Camera</span>
                    <span className="info-value">{cameraModel}</span>
                    <span className="info-subvalue">{cameraSettings}</span>
                </div>

                {/* Location with Visual Mini Map */}
                <div className="details-info-block location-block">
                    <span className="info-label">Location</span>
                    <span className="info-value">{locationName}</span>
                    <span className="info-subvalue">{latLngStr}</span>

                    {/* Stylized Mini Map Card */}
                    <div className="mini-map-card">
                        <div className="mini-map-terrain" />
                        <div className="mini-map-pin">
                            <MapPin size={22} color="#FFC928" fill="#FFC928" />
                        </div>
                    </div>
                </div>

                {/* OCR (Extracted Text) */}
                <div className="details-info-block">
                    <span className="info-label">OCR (Extracted Text)</span>
                    <p className={`ocr-text-paragraph ${ocrExpanded ? 'expanded' : ''}`}>
                        {photo.ocrText || 'Sunset view from the beach. Beautiful golden hour clouds and reflections over ocean waves.'}
                    </p>
                    <button className="ocr-show-more-link" onClick={() => setOcrExpanded(!ocrExpanded)}>
                        {ocrExpanded ? 'Show less' : 'Show more'}
                    </button>
                </div>

                {/* Smart Category */}
                <div className="details-info-block">
                    <span className="info-label">Smart Category</span>
                    <button
                        className="smart-category-pill"
                        onClick={() => onCategoryClick?.(smartCategory)}
                    >
                        {smartCategory}
                    </button>
                </div>

                {/* Vault */}
                <div className="details-info-block">
                    <span className="info-label">Vault</span>
                    <span className="info-value vault-badge-value">
                        <Shield size={14} color="#FFC928" />
                        {vaultName}
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default DetailsPanel;
