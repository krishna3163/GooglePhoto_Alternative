import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertCircle, ChevronUp, RefreshCw } from 'lucide-react';
import type { TelegramSession } from '../types';
import { fetchSavedMessages, getModel3FileUrl } from '../services/model3Service';
import './Model3Gallery.css';

interface MediaMessage {
    messageId: number;
    fileId: string;
    type: 'image' | 'video' | 'document';
    fileName?: string;
    thumbnailUrl?: string;
    timestamp: number;
    size?: number;
}

interface Model3GalleryProps {
    session: TelegramSession | null;
    onClose?: () => void;
}

const Model3Gallery: React.FC<Model3GalleryProps> = ({ session, onClose }) => {
    const [media, setMedia] = useState<MediaMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState<MediaMessage | null>(null);
    const [fileUrl, setFileUrl] = useState('');

    // Fetch media from Saved Messages
    const fetchMedia = useCallback(async (newOffset: number = 0) => {
        if (!session) return;

        setLoading(true);
        setError('');

        try {
            const result = await fetchSavedMessages(session, 50, newOffset);
            
            if (newOffset === 0) {
                setMedia(result.messages);
            } else {
                setMedia(prev => [...prev, ...result.messages]);
            }
            
            setHasMore(result.hasMore);
            setOffset(newOffset);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch media');
        } finally {
            setLoading(false);
        }
    }, [session]);

    // Initial fetch
    useEffect(() => {
        if (session?.isActive) {
            fetchMedia(0);
        }
    }, [session, fetchMedia]);

    // Load more media
    const handleLoadMore = () => {
        if (hasMore && !loading) {
            fetchMedia(offset + 50);
        }
    };

    // Handle media click
    const handleMediaClick = async (item: MediaMessage) => {
        setSelectedMedia(item);
        
        if (item.type !== 'document') {
            try {
                const url = await getModel3FileUrl(session!, item.fileId);
                setFileUrl(url);
            } catch (err) {
                setError('Failed to load media');
            }
        }
    };

    // Download media
    const handleDownload = async (item: MediaMessage) => {
        try {
            const url = await getModel3FileUrl(session!, item.fileId);
            const link = document.createElement('a');
            link.href = url;
            link.download = item.fileName || `media_${item.messageId}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError('Failed to download media');
        }
    };

    if (!session) {
        return (
            <div className="model3-gallery-empty">
                <AlertCircle size={48} />
                <h3>Not Connected</h3>
                <p>Login with your Telegram account to use Model 3 Gallery</p>
            </div>
        );
    }

    return (
        <div className="model3-gallery-container">
            {/* Header */}
            <div className="model3-gallery-header">
                <div className="header-content">
                    <h2>📱 Saved Messages Gallery</h2>
                    <p className="subtitle">View & manage files from your Telegram Saved Messages</p>
                </div>
                <button className="refresh-btn" onClick={() => fetchMedia(0)} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                    Refresh
                </button>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="model3-error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            {/* Gallery Grid */}
            {media.length > 0 ? (
                <>
                    <div className="model3-gallery-grid">
                        {media.map((item) => (
                            <div
                                key={item.messageId}
                                className="gallery-item"
                                onClick={() => handleMediaClick(item)}
                            >
                                {item.type === 'image' && item.thumbnailUrl && (
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={`Image ${item.messageId}`}
                                        loading="lazy"
                                    />
                                )}
                                {item.type === 'video' && (
                                    <div className="video-placeholder">
                                        <div className="play-icon">▶</div>
                                    </div>
                                )}
                                {item.type === 'document' && (
                                    <div className="document-placeholder">
                                        <div className="document-icon">📄</div>
                                        <div className="doc-name">{item.fileName?.slice(0, 20)}...</div>
                                    </div>
                                )}
                                <div className="item-actions">
                                    <button
                                        className="download-action"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(item);
                                        }}
                                        title="Download"
                                    >
                                        ⬇
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="load-more-container">
                            <button
                                className="load-more-btn"
                                onClick={handleLoadMore}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader size={16} className="spinning" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <ChevronUp size={16} className="rotate-180" />
                                        Load More Media
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="gallery-stats">
                        <p>Showing {media.length} media files from Saved Messages</p>
                    </div>
                </>
            ) : loading ? (
                <div className="model3-loading">
                    <Loader size={48} className="spinning" />
                    <p>Loading your Saved Messages...</p>
                </div>
            ) : (
                <div className="model3-gallery-empty">
                    <div className="empty-icon">📭</div>
                    <h3>No Media Found</h3>
                    <p>Upload files using TeleGphoto to see them here</p>
                </div>
            )}

            {/* Media Viewer Modal */}
            {selectedMedia && (
                <div className="media-viewer-overlay" onClick={() => setSelectedMedia(null)}>
                    <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-viewer" onClick={() => setSelectedMedia(null)}>
                            ×
                        </button>

                        {selectedMedia.type === 'image' && fileUrl && (
                            <img src={fileUrl} alt="Full view" className="viewer-image" />
                        )}

                        {selectedMedia.type === 'video' && fileUrl && (
                            <video controls className="viewer-video">
                                <source src={fileUrl} />
                                Your browser does not support video playback
                            </video>
                        )}

                        <div className="viewer-info">
                            <h3>{selectedMedia.fileName || `File ${selectedMedia.messageId}`}</h3>
                            <p className="viewer-date">
                                {new Date(selectedMedia.timestamp * 1000).toLocaleDateString()}
                            </p>
                            <div className="viewer-actions">
                                <button
                                    className="viewer-download"
                                    onClick={() => handleDownload(selectedMedia)}
                                >
                                    Download
                                </button>
                                <button
                                    className="viewer-copy-link"
                                    onClick={() => {
                                        navigator.clipboard.writeText(fileUrl);
                                        alert('Link copied to clipboard!');
                                    }}
                                    title="Copy download link"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Model3Gallery;
