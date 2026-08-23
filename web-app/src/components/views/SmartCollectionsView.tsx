import React, { useState } from 'react';
import type { PhotoAsset } from '../../types';
import { getSmartCollections, categorizePhoto } from '../../intelligence/smartCollectionsService';
import type { SmartCategory } from '../../intelligence/types';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { PhotoCard } from '../gallery/PhotoCard';
import { motion } from 'framer-motion';
import './SmartCollectionsView.css';

interface SmartCollectionsViewProps {
    photos: PhotoAsset[];
    onPhotoClick: (photo: PhotoAsset) => void;
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const SmartCollectionsView: React.FC<SmartCollectionsViewProps> = ({
    photos,
    onPhotoClick,
    onToggleFavorite,
}) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<SmartCategory | null>(null);

    const collections = getSmartCollections(photos);
    const activeCollection = collections.find(c => c.id === selectedCategoryId);

    const filteredPhotos = selectedCategoryId
        ? photos.filter(p => categorizePhoto(p).includes(selectedCategoryId))
        : [];

    if (selectedCategoryId && activeCollection) {
        return (
            <div className="smart-collection-detail-view">
                <div className="collection-detail-header">
                    <button className="collection-back-btn" onClick={() => setSelectedCategoryId(null)}>
                        <ArrowLeft size={18} />
                        <span>All Collections</span>
                    </button>
                    <div className="collection-detail-title-group">
                        <h2>{activeCollection.name}</h2>
                        <span>{filteredPhotos.length} items automatically categorized</span>
                    </div>
                </div>

                <div className="date-group-grid view-grid" style={{ padding: '20px 24px' }}>
                    {filteredPhotos.map((photo) => (
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
            </div>
        );
    }

    return (
        <div className="smart-collections-page">
            <div className="collections-page-header">
                <div className="collections-title-block">
                    <h2>Smart Collections</h2>
                    <span>On-device deterministic intelligence categorized from EXIF, OCR, & MIME</span>
                </div>
            </div>

            <div className="collections-grid">
                {collections.map((col) => (
                    <motion.div
                        key={col.id}
                        className="collection-card"
                        whileHover={{ scale: 1.025, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategoryId(col.id)}
                    >
                        <div className="collection-cover-wrap">
                            {col.coverUrl ? (
                                <img src={col.coverUrl} alt={col.name} />
                            ) : (
                                <div className="collection-cover-placeholder">
                                    <LayoutGrid size={42} color="#FFC928" />
                                </div>
                            )}
                            <div className="collection-item-count-badge">
                                {col.count}
                            </div>
                        </div>
                        <div className="collection-card-meta">
                            <h4>{col.name}</h4>
                            <p>{col.count} items</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default SmartCollectionsView;
