import React, { useRef } from 'react';
import type { TelegramConfig, PhotoAsset } from '../types';
import { FileText, Play, Star } from 'lucide-react';
import './PhotoGrid.css';

interface PhotoGridProps {
    config: TelegramConfig | null;
    photos: PhotoAsset[];
    searchQuery: string;
    title: string;
    onPhotoClick: (photo: PhotoAsset) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ config, photos, searchQuery, title, onPhotoClick }) => {
    if (!config) {
        return (
            <div className="empty-state">
                <div className="empty-illustration">📸</div>
                <h2>Welcome to TeleGphoto</h2>
                <p>Your personal unlimited storage via Telegram.</p>
                <p className="sub-text">Please configure your Bot Token in Settings to get started.</p>
            </div>
        );
    }

    const filteredPhotos = photos.filter(photo =>
        photo.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (photo.ocrText && photo.ocrText.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group photos by date
    const groupedPhotos = filteredPhotos.reduce((groups: { [key: string]: PhotoAsset[] }, photo) => {
        const date = new Date(photo.timestamp).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(photo);
        return groups;
    }, {});

    if (photos.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-illustration">✨</div>
                <h2>No items in {title}</h2>
                <p>Upload files or sync your device to see them here.</p>
            </div>
        );
    }

    if (filteredPhotos.length === 0 && searchQuery) {
        return (
            <div className="empty-state">
                <div className="empty-illustration">🔍</div>
                <h2>No results found for "{searchQuery}"</h2>
                <p>Try searching for something else.</p>
            </div>
        );
    }

    const VideoPreview: React.FC<{ url: string }> = ({ url }) => {
        const videoRef = useRef<HTMLVideoElement>(null);

        return (
            <div
                className="media-preview video-preview"
                onMouseEnter={() => videoRef.current?.play()}
                onMouseLeave={() => {
                    if (videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0;
                    }
                }}
            >
                <video ref={videoRef} src={url} muted loop playsInline />
                <div className="media-badge">
                    <Play size={14} fill="white" stroke="white" />
                </div>
            </div>
        );
    };

    const renderMedia = (photo: PhotoAsset) => {
        switch (photo.mediaType) {
            case 'video':
                return <VideoPreview url={photo.url} />;
            case 'document':
                return (
                    <div className="media-preview document-preview">
                        <FileText size={48} color="#8ab4f8" />
                        <div className="document-name">{photo.fileName}</div>
                    </div>
                );
            default:
                return <img src={photo.url} alt={photo.fileName} loading="lazy" />;
        }
    };

    return (
        <div className="photo-grid-container">
            <div className="grid-header">
                <h2 className="grid-title">{title}</h2>
            </div>
            {Object.keys(groupedPhotos).map((date) => (
                <div key={date} className="date-group">
                    <h3 className="group-date">{date}</h3>
                    <div className="photo-grid">
                        {groupedPhotos[date].map((photo) => (
                            <div
                                key={photo.id}
                                className={`photo-item ${photo.mediaType}-item`}
                                onClick={() => onPhotoClick(photo)}
                            >
                                {renderMedia(photo)}
                                <div className="item-overlay">
                                    <span className="file-info">{photo.fileName}</span>
                                    {photo.isFavourite && (
                                        <div className="fav-indicator">
                                            <Star size={14} fill="#8ab4f8" color="#8ab4f8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PhotoGrid;
