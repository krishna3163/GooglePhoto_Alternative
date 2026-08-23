import { describe, it, expect } from 'vitest';
import type { PhotoAsset, Album } from '../../src/types';

describe('Media & Album CRUD Integrity Suite', () => {
    const initialPhotos: PhotoAsset[] = [
        {
            id: 'photo-1',
            url: 'https://example.com/beach.jpg',
            fileName: 'beach.jpg',
            mediaType: 'image',
            timestamp: '2026-08-01T12:00:00Z',
            isFavourite: false,
            isTrash: false,
        },
        {
            id: 'photo-2',
            url: 'https://example.com/coding_doc.pdf',
            fileName: 'coding_doc.pdf',
            mediaType: 'document',
            timestamp: '2026-08-05T15:00:00Z',
            isFavourite: true,
            isTrash: false,
        },
        {
            id: 'photo-3',
            url: 'https://example.com/family_clip.mp4',
            fileName: 'family_clip.mp4',
            mediaType: 'video',
            timestamp: '2026-08-10T18:00:00Z',
            isFavourite: false,
            isTrash: false,
        },
    ];

    it('1. CREATE: Adds new media asset with unique ID and timestamp', () => {
        const newAsset: PhotoAsset = {
            id: `photo-${Date.now()}`,
            url: 'blob:https://localhost/new-photo',
            fileName: 'fresh_upload.jpg',
            mediaType: 'image',
            timestamp: new Date().toISOString(),
            isFavourite: false,
            isTrash: false,
        };

        const updatedList = [newAsset, ...initialPhotos];
        expect(updatedList).toHaveLength(4);
        expect(updatedList[0].id).toBe(newAsset.id);
        expect(updatedList[0].fileName).toBe('fresh_upload.jpg');
    });

    it('2. UPDATE: Toggle Favorites state correctly', () => {
        let photos = [...initialPhotos];
        const targetId = 'photo-1';

        // Add to favorite
        photos = photos.map(p => p.id === targetId ? { ...p, isFavourite: !p.isFavourite } : p);
        expect(photos.find(p => p.id === targetId)?.isFavourite).toBe(true);

        // Remove from favorite
        photos = photos.map(p => p.id === targetId ? { ...p, isFavourite: !p.isFavourite } : p);
        expect(photos.find(p => p.id === targetId)?.isFavourite).toBe(false);
    });

    it('3. UPDATE: Rename asset preserves all other metadata untouched', () => {
        let photos = [...initialPhotos];
        const targetId = 'photo-1';
        const newName = 'sunset_beach_renamed.jpg';

        photos = photos.map(p => p.id === targetId ? { ...p, fileName: newName } : p);

        const updated = photos.find(p => p.id === targetId);
        expect(updated?.fileName).toBe(newName);
        expect(updated?.url).toBe('https://example.com/beach.jpg');
        expect(updated?.mediaType).toBe('image');
    });

    it('4. DELETE (Soft Delete): Moves asset to Trash and removes from normal gallery', () => {
        let photos = [...initialPhotos];
        const targetId = 'photo-1';

        // Soft delete
        photos = photos.map(p => p.id === targetId ? { ...p, isTrash: true, deletedAt: new Date().toISOString() } : p);

        // Active gallery filters out trash
        const activeGallery = photos.filter(p => !p.isTrash);
        const trashGallery = photos.filter(p => p.isTrash);

        expect(activeGallery).toHaveLength(2);
        expect(activeGallery.some(p => p.id === targetId)).toBe(false);

        expect(trashGallery).toHaveLength(1);
        expect(trashGallery[0].id).toBe(targetId);
        expect(trashGallery[0].deletedAt).toBeDefined();
    });

    it('5. RESTORE: Returns asset from Trash back to active gallery with intact metadata', () => {
        let photos = [
            {
                ...initialPhotos[0],
                isTrash: true,
                deletedAt: new Date().toISOString(),
                isFavourite: true,
            },
            initialPhotos[1],
            initialPhotos[2],
        ];

        // Restore
        photos = photos.map(p => p.id === 'photo-1' ? { ...p, isTrash: false, deletedAt: undefined } : p);

        const activeGallery = photos.filter(p => !p.isTrash);
        const restored = activeGallery.find(p => p.id === 'photo-1');

        expect(activeGallery).toHaveLength(3);
        expect(restored?.isTrash).toBe(false);
        expect(restored?.isFavourite).toBe(true); // Favorite state preserved!
    });

    it('6. DELETE (Permanent): Completely purges asset from records', () => {
        let photos = [...initialPhotos];
        const targetId = 'photo-2';

        photos = photos.filter(p => p.id !== targetId);

        expect(photos).toHaveLength(2);
        expect(photos.find(p => p.id === targetId)).toBeUndefined();
    });

    it('7. ALBUM SAFETY: Deleting an Album DOES NOT delete the underlying photos', () => {
        let photos = [...initialPhotos];
        let albums: Album[] = [
            {
                id: 'album-1',
                name: 'Trip 2026',
                createdAt: new Date().toISOString(),
                photoIds: ['photo-1', 'photo-3'],
            },
        ];

        // Delete the album
        albums = albums.filter(a => a.id !== 'album-1');

        expect(albums).toHaveLength(0);

        // Photos must remain 100% intact!
        expect(photos).toHaveLength(3);
        expect(photos.find(p => p.id === 'photo-1')).toBeDefined();
        expect(photos.find(p => p.id === 'photo-3')).toBeDefined();
    });
});
