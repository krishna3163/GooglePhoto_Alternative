import { describe, it, expect } from 'vitest';
import { generateMemories } from '../../src/intelligence/memoryService';
import type { PhotoAsset } from '../../src/types';

describe('Phase 3.1 - Memories Engine Suite', () => {
    const referenceDate = new Date('2026-08-23T12:00:00Z');

    const mockPhotos: PhotoAsset[] = [
        {
            id: 'photo-1-year-ago',
            url: 'https://example.com/mem1.jpg',
            fileName: 'last_year_today.jpg',
            mediaType: 'image',
            timestamp: '2025-08-23T10:00:00Z', // exactly 1 year ago today
            isTrash: false,
            isFavourite: true,
        },
        {
            id: 'photo-2-years-ago',
            url: 'https://example.com/mem2.jpg',
            fileName: 'two_years_ago.jpg',
            mediaType: 'image',
            timestamp: '2024-08-23T15:30:00Z', // exactly 2 years ago today
            isTrash: false,
        },
        {
            id: 'photo-deleted-memory',
            url: 'https://example.com/deleted.jpg',
            fileName: 'deleted_memory.jpg',
            mediaType: 'image',
            timestamp: '2025-08-23T11:00:00Z', // 1 year ago but IN TRASH
            isTrash: true,
        },
        {
            id: 'photo-random-month',
            url: 'https://example.com/august_trip.jpg',
            fileName: 'august_trip.jpg',
            mediaType: 'image',
            timestamp: '2025-08-10T12:00:00Z', // same month, different day
            isTrash: false,
        },
    ];

    it('1. Generates "On This Day" retrospective for exact calendar day in past years', () => {
        const memories = generateMemories(mockPhotos, referenceDate);

        expect(memories.length).toBeGreaterThan(0);
        const oneYearAgo = memories.find(m => m.yearDiff === 1 && m.type === 'on_this_day');
        expect(oneYearAgo).toBeDefined();
        expect(oneYearAgo?.title).toBe('1 Year Ago Today');
        expect(oneYearAgo?.photos[0].id).toBe('photo-1-year-ago');
    });

    it('2. Correctly calculates multi-year differences (2 Years Ago Today)', () => {
        const memories = generateMemories(mockPhotos, referenceDate);
        const twoYearsAgo = memories.find(m => m.yearDiff === 2 && m.type === 'on_this_day');

        expect(twoYearsAgo).toBeDefined();
        expect(twoYearsAgo?.title).toBe('2 Years Ago Today');
        expect(twoYearsAgo?.photos[0].id).toBe('photo-2-years-ago');
    });

    it('3. Excludes soft-deleted photos (Trash) from Memories', () => {
        const memories = generateMemories(mockPhotos, referenceDate);
        for (const memory of memories) {
            for (const p of memory.photos) {
                expect(p.isTrash).toBe(false);
                expect(p.id).not.toBe('photo-deleted-memory');
            }
        }
    });

    it('4. Respects user-hidden memory IDs', () => {
        const hiddenIds = ['on_this_day_2025'];
        const memories = generateMemories(mockPhotos, referenceDate, hiddenIds);

        const oneYearAgo = memories.find(m => m.id === 'on_this_day_2025');
        expect(oneYearAgo).toBeUndefined();
    });
});
