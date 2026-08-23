import { describe, it, expect } from 'vitest';
import type { PhotoAsset } from '../../src/types';

describe('Integration Flow: Trash, Restore & Safe Permanent Delete Lifecycle', () => {
    it('Full lifecycle: Gallery -> Soft Delete -> Trash Filter -> Restore -> Permanent Delete', () => {
        let gallery: PhotoAsset[] = [
            {
                id: 'asset-alpha',
                url: 'https://example.com/alpha.jpg',
                fileName: 'alpha.jpg',
                mediaType: 'image',
                timestamp: '2026-08-15T09:00:00Z',
                isFavourite: true,
                isTrash: false,
            },
            {
                id: 'asset-beta',
                url: 'https://example.com/beta.jpg',
                fileName: 'beta.jpg',
                mediaType: 'image',
                timestamp: '2026-08-16T10:00:00Z',
                isFavourite: false,
                isTrash: false,
            },
        ];

        // 1. Move asset-alpha to Trash (Soft Delete)
        const deleteTimestamp = new Date().toISOString();
        gallery = gallery.map(item => item.id === 'asset-alpha' ? { ...item, isTrash: true, deletedAt: deleteTimestamp } : item);

        // 2. Verify normal gallery excludes item
        const activeGallery = gallery.filter(p => !p.isTrash);
        expect(activeGallery).toHaveLength(1);
        expect(activeGallery[0].id).toBe('asset-beta');

        // 3. Verify Trash view displays item with intact metadata
        const trashItems = gallery.filter(p => p.isTrash);
        expect(trashItems).toHaveLength(1);
        expect(trashItems[0].id).toBe('asset-alpha');
        expect(trashItems[0].isFavourite).toBe(true); // preserved!
        expect(trashItems[0].deletedAt).toBe(deleteTimestamp);

        // 4. Restore item from Trash
        gallery = gallery.map(item => item.id === 'asset-alpha' ? { ...item, isTrash: false, deletedAt: undefined } : item);

        const restoredGallery = gallery.filter(p => !p.isTrash);
        expect(restoredGallery).toHaveLength(2);
        const restoredItem = restoredGallery.find(p => p.id === 'asset-alpha');
        expect(restoredItem?.isTrash).toBe(false);
        expect(restoredItem?.isFavourite).toBe(true);
        expect(restoredItem?.deletedAt).toBeUndefined();

        // 5. Permanent Delete
        gallery = gallery.filter(p => p.id !== 'asset-alpha');
        expect(gallery).toHaveLength(1);
        expect(gallery.find(p => p.id === 'asset-alpha')).toBeUndefined();
    });
});
