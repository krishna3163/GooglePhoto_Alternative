import { describe, it, expect } from 'vitest';
import { categorizePhoto, getSmartCollections } from '../../src/intelligence/smartCollectionsService';
import type { PhotoAsset } from '../../src/types';

describe('Phase 3.1 - Smart Collections Engine Suite', () => {
    it('1. Categorizes Screenshots based on filename patterns', () => {
        const item: PhotoAsset = {
            id: 'scr-1',
            url: 'https://example.com/s.jpg',
            fileName: 'Screenshot_2026-08-23.png',
            mediaType: 'image',
            timestamp: new Date().toISOString(),
        };

        const cats = categorizePhoto(item);
        expect(cats).toContain('screenshots');
    });

    it('2. Categorizes Documents based on extension and mediaType', () => {
        const doc: PhotoAsset = {
            id: 'doc-1',
            url: 'https://example.com/d.pdf',
            fileName: 'Annual_Report_2026.pdf',
            mediaType: 'document',
            timestamp: new Date().toISOString(),
        };

        const cats = categorizePhoto(doc);
        expect(cats).toContain('documents');
    });

    it('3. Categorizes Travel photos based on GPS/location', () => {
        const travelPhoto: PhotoAsset = {
            id: 'trv-1',
            url: 'https://example.com/t.jpg',
            fileName: 'Goa_Beach.jpg',
            mediaType: 'image',
            timestamp: new Date().toISOString(),
            location: { name: 'Goa, India', lat: 15.2993, lng: 74.124 },
        };

        const cats = categorizePhoto(travelPhoto);
        expect(cats).toContain('travel');
    });

    it('4. Categorizes Technology/Code photos from OCR text content', () => {
        const codePhoto: PhotoAsset = {
            id: 'code-1',
            url: 'https://example.com/c.jpg',
            fileName: 'terminal_error.png',
            mediaType: 'image',
            timestamp: new Date().toISOString(),
            ocrText: 'import React from "react"; const App = () => { return <div>Test</div> }',
        };

        const cats = categorizePhoto(codePhoto);
        expect(cats).toContain('tech');
    });

    it('5. Generates summary count of Smart Collections accurately', () => {
        const mockList: PhotoAsset[] = [
            { id: '1', url: '1.jpg', fileName: 'Screenshot_1.png', mediaType: 'image', timestamp: '2026-08-20' },
            { id: '2', url: '2.pdf', fileName: 'Resume.pdf', mediaType: 'document', timestamp: '2026-08-21' },
            { id: '3', url: '3.mp4', fileName: 'Birthday.mp4', mediaType: 'video', timestamp: '2026-08-22' },
        ];

        const collections = getSmartCollections(mockList);
        expect(collections.length).toBeGreaterThanOrEqual(3);

        const screenshots = collections.find(c => c.id === 'screenshots');
        expect(screenshots?.count).toBe(1);

        const docs = collections.find(c => c.id === 'documents');
        expect(docs?.count).toBe(1);

        const vids = collections.find(c => c.id === 'videos');
        expect(vids?.count).toBe(1);
    });
});
