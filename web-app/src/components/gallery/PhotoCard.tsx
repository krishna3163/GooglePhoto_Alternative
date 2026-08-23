import React from 'react';
import type { PhotoAsset } from '../../types';
import type { ViewMode } from './GalleryToolbar';
import { Star, Play, FileText, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhotoCardProps {
    photo: PhotoAsset;
    isSelected: boolean;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onClick: (photo: PhotoAsset) => void;
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
    viewMode: ViewMode;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
    photo,
    isSelected,
    onToggleSelect,
    onClick,
    onToggleFavorite,
    viewMode,
}) => {
    const isRaw = photo.fileName.toLowerCase().endsWith('.raw') || photo.fileName.toLowerCase().endsWith('.dng') || photo.fileName.toLowerCase().endsWith('.cr2');
    const isDoc = photo.mediaType === 'document' || photo.fileName.toLowerCase().endsWith('.pdf');
    const isVideo = photo.mediaType === 'video';

    return (
        <motion.div
            className={`photo-card-item ${viewMode} ${isSelected ? 'selected' : ''}`}
            whileHover={{ scale: viewMode === 'list' ? 1.005 : 1.015 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onClick(photo)}
        >
            {/* Thumbnail / Media Container */}
            <div className="card-media-wrapper">
                {isVideo ? (
                    <video src={photo.url} className="card-media-element" muted preload="metadata" />
                ) : isDoc ? (
                    <div className="card-doc-placeholder">
                        <FileText size={38} color="#FFC928" />
                        <span className="card-doc-label">{photo.fileName}</span>
                    </div>
                ) : (
                    <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="card-media-element"
                        loading="lazy"
                    />
                )}

                {/* Top Badges */}
                <div className="card-top-badges">
                    {/* Select Checkbox */}
                    <button
                        className={`card-select-checkbox ${isSelected ? 'checked' : ''}`}
                        onClick={(e) => onToggleSelect(photo.id, e)}
                        title="Select item"
                    >
                        {isSelected && <Check size={13} color="#080B10" strokeWidth={3} />}
                    </button>

                    {/* Right Badges */}
                    <div className="card-right-badges">
                        {isRaw && <span className="card-badge raw-badge">RAW</span>}
                        {isDoc && <span className="card-badge pdf-badge">PDF</span>}
                        {photo.isFavourite && (
                            <div
                                className="card-star-badge"
                                onClick={(e) => onToggleFavorite(photo.id, e)}
                                title="Favorite"
                            >
                                <Star size={16} fill="#FFC928" color="#FFC928" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Play & Duration Badge */}
                {isVideo && (
                    <div className="card-video-duration-badge">
                        <Play size={11} fill="#FFFFFF" />
                        <span>0:20</span>
                    </div>
                )}
            </div>

            {/* List Mode Row Details */}
            {viewMode === 'list' && (
                <div className="card-list-info-row">
                    <span className="card-list-name">{photo.fileName}</span>
                    <span className="card-list-date">
                        {new Date(photo.timestamp).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <span className="card-list-size">
                        {photo.fileSizeBytes
                            ? `${(photo.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                            : '4.2 MB'}
                    </span>
                </div>
            )}
        </motion.div>
    );
};
