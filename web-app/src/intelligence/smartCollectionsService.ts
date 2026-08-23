import type { PhotoAsset } from '../types';
import type { SmartCategory, SmartCollection } from './types';

/**
 * Deterministic Smart Categorization Engine.
 * Automatically sorts media into intuitive collections using MIME types,
 * EXIF metadata, aspect ratios, filenames, and local OCR keywords.
 */

export function categorizePhoto(photo: PhotoAsset): SmartCategory[] {
    const categories: SmartCategory[] = [];
    const lowerName = photo.fileName.toLowerCase();

    // 1. Documents
    if (
        photo.mediaType === 'document' ||
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.doc') ||
        lowerName.endsWith('.docx') ||
        lowerName.endsWith('.txt')
    ) {
        categories.push('documents');
    }

    // 2. Videos
    if (photo.mediaType === 'video') {
        categories.push('videos');
    }

    // 3. Screenshots
    if (
        lowerName.includes('screenshot') ||
        lowerName.includes('screen_recording') ||
        lowerName.includes('scr_') ||
        lowerName.startsWith('img_') && lowerName.includes('wa')
    ) {
        categories.push('screenshots');
    }

    // 4. Travel / Outdoors (GPS or Location metadata)
    if (photo.location || photo.exif?.gps) {
        categories.push('travel');
    }

    // 5. Technology / Code (from OCR keywords)
    if (photo.ocrText) {
        const ocr = photo.ocrText.toLowerCase();
        const techKeywords = ['github', 'import', 'function', 'const', 'error', 'terminal', 'console', 'python', 'react'];
        if (techKeywords.some(kw => ocr.includes(kw))) {
            categories.push('tech');
        }

        const foodKeywords = ['restaurant', 'cafe', 'menu', 'coffee', 'dinner', 'lunch', 'pizza', 'burger'];
        if (foodKeywords.some(kw => ocr.includes(kw))) {
            categories.push('food');
        }
    }

    // 6. Camera / Portraits / Panoramas from dimensions
    if (photo.exif?.dimensions) {
        const { width, height } = photo.exif.dimensions;
        if (width > 0 && height > 0) {
            const ratio = width / height;
            if (ratio > 2.2) {
                categories.push('panoramas');
            } else if (ratio < 0.75) {
                categories.push('portraits');
            }
        }
    }

    if (categories.length === 0 && photo.mediaType === 'image') {
        categories.push('camera');
    }

    return categories;
}

/**
 * Generate Smart Collection overview cards.
 */
export function getSmartCollections(photos: PhotoAsset[]): SmartCollection[] {
    const active = photos.filter(p => !p.isTrash);
    const categoryCounts: Record<SmartCategory, { count: number; coverUrl?: string }> = {
        all: { count: active.length },
        screenshots: { count: 0 },
        documents: { count: 0 },
        camera: { count: 0 },
        portraits: { count: 0 },
        panoramas: { count: 0 },
        videos: { count: 0 },
        travel: { count: 0 },
        food: { count: 0 },
        tech: { count: 0 },
    };

    for (const photo of active) {
        const cats = categorizePhoto(photo);
        for (const cat of cats) {
            categoryCounts[cat].count++;
            if (!categoryCounts[cat].coverUrl && photo.url) {
                categoryCounts[cat].coverUrl = photo.url;
            }
        }
    }

    const collectionMeta: { id: SmartCategory; name: string; iconName: string }[] = [
        { id: 'screenshots', name: 'Screenshots', iconName: 'MonitorPlay' },
        { id: 'documents', name: 'Documents', iconName: 'FileText' },
        { id: 'camera', name: 'Camera Photos', iconName: 'Camera' },
        { id: 'videos', name: 'Videos', iconName: 'Video' },
        { id: 'travel', name: 'Places & Travel', iconName: 'MapPin' },
        { id: 'tech', name: 'Tech & Code', iconName: 'Code' },
        { id: 'food', name: 'Food & Dining', iconName: 'Utensils' },
    ];

    return collectionMeta
        .filter(meta => categoryCounts[meta.id].count > 0)
        .map(meta => ({
            id: meta.id,
            name: meta.name,
            iconName: meta.iconName,
            count: categoryCounts[meta.id].count,
            coverUrl: categoryCounts[meta.id].coverUrl,
        }));
}
