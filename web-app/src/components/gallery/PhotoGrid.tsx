import React, { useMemo } from 'react';
import type { PhotoAsset } from '../../types';
import type { ViewMode, SortField, SortDirection } from './GalleryToolbar';
import { PhotoCard } from './PhotoCard';
import { searchPhotosSemantically } from '../../intelligence/semanticSearchService';
import { Image as ImageIcon, Upload } from 'lucide-react';
import './PhotoGrid.css';

interface PhotoGridProps {
    photos: PhotoAsset[];
    searchQuery: string;
    viewMode: ViewMode;
    sortField: SortField;
    sortDirection: SortDirection;
    selectedIds: Set<string>;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onPhotoClick: (photo: PhotoAsset) => void;
    onToggleFavorite: (id: string, e: React.MouseEvent) => void;
    onUploadClick?: () => void;
    activeVaultId?: string;
    mediaTypeFilter?: string;
    favoritesOnlyFilter?: boolean;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos,
    searchQuery,
    viewMode,
    sortField,
    sortDirection,
    selectedIds,
    onToggleSelect,
    onPhotoClick,
    onToggleFavorite,
    onUploadClick,
    activeVaultId,
    mediaTypeFilter = 'all',
    favoritesOnlyFilter = false,
}) => {
    // 1. Filter by Search Query & Filters
    const filteredPhotos = useMemo(() => {
        let list = photos;

        // Apply media type filter
        if (mediaTypeFilter !== 'all') {
            list = list.filter(p => p.mediaType === mediaTypeFilter);
        }

        // Apply favorites filter
        if (favoritesOnlyFilter) {
            list = list.filter(p => p.isFavourite);
        }

        // Apply hybrid semantic search
        if (searchQuery.trim()) {
            const results = searchPhotosSemantically(list, searchQuery, activeVaultId);
            return results.map(r => r.photo);
        }

        return list;
    }, [photos, searchQuery, activeVaultId, mediaTypeFilter, favoritesOnlyFilter]);

    // 2. Sort photos
    const sortedPhotos = useMemo(() => {
        const copy = [...filteredPhotos];
        copy.sort((a, b) => {
            let res = 0;
            if (sortField === 'dateAdded' || sortField === 'dateTaken') {
                res = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            } else if (sortField === 'fileName') {
                res = a.fileName.localeCompare(b.fileName);
            } else if (sortField === 'fileSize') {
                res = (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
            }
            return sortDirection === 'desc' ? res : -res;
        });
        return copy;
    }, [filteredPhotos, sortField, sortDirection]);

    // 3. Group by Date for timeline sections
    const groupedPhotos = useMemo(() => {
        const groups: { [key: string]: PhotoAsset[] } = {};
        for (const photo of sortedPhotos) {
            const date = new Date(photo.timestamp).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(photo);
        }
        return groups;
    }, [sortedPhotos]);

    if (sortedPhotos.length === 0) {
        return (
            <div className="photo-grid-empty-state">
                <div className="empty-state-icon-box">
                    <ImageIcon size={48} color="#FFC928" />
                </div>
                <h3>{searchQuery ? 'No matching photos found' : 'No photos yet'}</h3>
                <p>
                    {searchQuery
                        ? 'Try searching with different concepts, tags, or locations.'
                        : 'Upload your first memories to your private encrypted Telegram vault.'}
                </p>
                {onUploadClick && (
                    <button className="empty-state-upload-btn" onClick={onUploadClick}>
                        <Upload size={16} />
                        <span>Upload Photos</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`tg-photo-grid-wrapper view-${viewMode}`}>
            {Object.entries(groupedPhotos).map(([dateLabel, groupList]) => (
                <section key={dateLabel} className="photo-date-group-section">
                    <div className="date-group-header">
                        <h3 className="date-group-title">{dateLabel}</h3>
                    </div>

                    <div className={`date-group-grid view-${viewMode}`}>
                        {groupList.map((photo) => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                isSelected={selectedIds.has(photo.id)}
                                onToggleSelect={onToggleSelect}
                                onClick={onPhotoClick}
                                onToggleFavorite={onToggleFavorite}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default PhotoGrid;
