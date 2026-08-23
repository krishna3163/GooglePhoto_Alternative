import type { PhotoAsset } from '../types';
import type { MemoryHighlight } from './types';

/**
 * Deterministic On-Device Memories Engine.
 * Analyzes photo timestamps locally to generate nostalgic retrospectives
 * without sending metadata or images to third-party clouds.
 */

export function generateMemories(
    photos: PhotoAsset[],
    referenceDate: Date = new Date(),
    hiddenMemoryIds: string[] = []
): MemoryHighlight[] {
    const activePhotos = photos.filter(p => !p.isTrash);
    if (activePhotos.length === 0) return [];

    const hiddenSet = new Set(hiddenMemoryIds);
    const memories: MemoryHighlight[] = [];

    const refMonth = referenceDate.getMonth(); // 0-11
    const refDay = referenceDate.getDate();     // 1-31
    const refYear = referenceDate.getFullYear();

    // 1. Group past-year photos by exact calendar Day & Month ("On This Day")
    const onThisDayByYear = new Map<number, PhotoAsset[]>();

    for (const photo of activePhotos) {
        const photoDate = new Date(photo.timestamp);
        if (isNaN(photoDate.getTime())) continue;

        const photoYear = photoDate.getFullYear();
        const photoMonth = photoDate.getMonth();
        const photoDay = photoDate.getDate();

        // Check if same calendar day in past years
        if (photoMonth === refMonth && photoDay === refDay && photoYear < refYear) {
            if (!onThisDayByYear.has(photoYear)) {
                onThisDayByYear.set(photoYear, []);
            }
            onThisDayByYear.get(photoYear)!.push(photo);
        }
    }

    // Convert "On This Day" groups into Memory Highlights
    for (const [year, items] of onThisDayByYear.entries()) {
        const yearDiff = refYear - year;
        const memoryId = `on_this_day_${year}`;

        if (!hiddenSet.has(memoryId) && items.length > 0) {
            const title = yearDiff === 1 ? '1 Year Ago Today' : `${yearDiff} Years Ago Today`;
            const dateStr = new Date(year, refMonth, refDay).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

            memories.push({
                id: memoryId,
                title,
                subtitle: `${items.length} photo${items.length > 1 ? 's' : ''}`,
                dateDescription: dateStr,
                coverPhoto: items[0],
                photos: items,
                type: 'on_this_day',
                yearDiff,
            });
        }
    }

    // 2. "Same Month Past Years" Highlights (if no exact day match or complementary)
    const monthPhotosPastYears = new Map<number, PhotoAsset[]>();
    for (const photo of activePhotos) {
        const photoDate = new Date(photo.timestamp);
        if (isNaN(photoDate.getTime())) continue;

        const photoYear = photoDate.getFullYear();
        const photoMonth = photoDate.getMonth();

        if (photoMonth === refMonth && photoYear < refYear) {
            if (!monthPhotosPastYears.has(photoYear)) {
                monthPhotosPastYears.set(photoYear, []);
            }
            monthPhotosPastYears.get(photoYear)!.push(photo);
        }
    }

    for (const [year, items] of monthPhotosPastYears.entries()) {
        const memoryId = `month_rewind_${year}_${refMonth}`;
        // Only include if at least 2 photos and not already added as on-this-day
        if (!hiddenSet.has(memoryId) && items.length >= 2 && !onThisDayByYear.has(year)) {
            const monthName = referenceDate.toLocaleDateString('en-US', { month: 'long' });
            memories.push({
                id: memoryId,
                title: `${monthName} Highlights`,
                subtitle: `${year} • ${items.length} photos`,
                dateDescription: `${monthName} ${year}`,
                coverPhoto: items[0],
                photos: items,
                type: 'same_month',
                yearDiff: refYear - year,
            });
        }
    }

    // 3. "Favorites Spotlight" (if user has marked favorites)
    const favorites = activePhotos.filter(p => p.isFavourite);
    if (favorites.length >= 3) {
        const favMemoryId = 'favorites_spotlight';
        if (!hiddenSet.has(favMemoryId)) {
            memories.push({
                id: favMemoryId,
                title: 'Best of Favorites',
                subtitle: 'Your starred moments',
                dateDescription: 'All-time Favorites',
                coverPhoto: favorites[0],
                photos: favorites.slice(0, 15),
                type: 'highlight_reel',
            });
        }
    }

    // Sort: "On This Day" first, then by year difference
    return memories.sort((a, b) => {
        if (a.type === 'on_this_day' && b.type !== 'on_this_day') return -1;
        if (b.type === 'on_this_day' && a.type !== 'on_this_day') return 1;
        return (a.yearDiff || 0) - (b.yearDiff || 0);
    });
}
