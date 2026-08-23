import { describe, it, expect } from 'vitest';
import { searchPhotosSemantically, buildPhotoSemanticContext } from '../../src/intelligence/semanticSearchService';
import { generateTextEmbedding, cosineSimilarity } from '../../src/intelligence/embeddingService';
import type { PhotoAsset } from '../../src/types';

describe('Phase 3.2 - Privacy-Preserving Semantic Search Engine Suite', () => {
    const mockLibrary: (PhotoAsset & { vaultId?: string })[] = [
        {
            id: 'photo-beach-sunset',
            url: 'https://example.com/p1.jpg',
            fileName: 'IMG_48291.jpg',
            mediaType: 'image',
            timestamp: '2026-08-10T19:00:00Z',
            ocrText: 'Golden hour sunset over ocean waves and palm trees',
            location: { name: 'Goa Coast Beach' },
            vaultId: 'vault-personal',
            isTrash: false,
        },
        {
            id: 'photo-coding-desk',
            url: 'https://example.com/p2.jpg',
            fileName: 'desk_setup.png',
            mediaType: 'image',
            timestamp: '2026-08-12T14:00:00Z',
            ocrText: 'export const App = () => { return <ViteApp /> }',
            vaultId: 'vault-personal',
            isTrash: false,
        },
        {
            id: 'photo-restaurant-food',
            url: 'https://example.com/p3.jpg',
            fileName: 'cafe_dinner.jpg',
            mediaType: 'image',
            timestamp: '2026-08-15T20:30:00Z',
            ocrText: 'Italian Pizza Pasta & Coffee Cafe Menu',
            vaultId: 'vault-family',
            isTrash: false,
        },
        {
            id: 'photo-trashed-sunset',
            url: 'https://example.com/p4.jpg',
            fileName: 'blurry_sunset.jpg',
            mediaType: 'image',
            timestamp: '2026-08-10T19:05:00Z',
            ocrText: 'Sunset sky',
            vaultId: 'vault-personal',
            isTrash: true, // IN TRASH
        },
    ];

    it('1. Generates rich semantic context including OCR and metadata', () => {
        const context = buildPhotoSemanticContext(mockLibrary[0]);
        expect(context).toContain('IMG_48291.jpg');
        expect(context).toContain('sunset');
        expect(context).toContain('Goa Coast Beach');
    });

    it('2. Finds relevant photo using natural-language concept query ("sunset near ocean beach")', () => {
        const results = searchPhotosSemantically(mockLibrary, 'sunset near ocean beach');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].photo.id).toBe('photo-beach-sunset');
        expect(results[0].score).toBeGreaterThan(0.5);
    });

    it('3. Finds coding setup using technology query ("laptop programming code")', () => {
        const results = searchPhotosSemantically(mockLibrary, 'laptop programming code');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].photo.id).toBe('photo-coding-desk');
    });

    it('4. Strict Trash Exclusion: Trashed photos never appear in search results', () => {
        const results = searchPhotosSemantically(mockLibrary, 'sunset');

        for (const res of results) {
            expect(res.photo.isTrash).toBe(false);
            expect(res.photo.id).not.toBe('photo-trashed-sunset');
        }
    });

    it('5. Strict Vault Isolation: Limits results strictly to the active vault', () => {
        // Query "food" in Personal Vault (which only has beach & coding)
        const personalResults = searchPhotosSemantically(mockLibrary, 'food pizza', 'vault-personal');
        expect(personalResults.some(r => r.photo.id === 'photo-restaurant-food')).toBe(false);

        // Query "food" in Family Vault
        const familyResults = searchPhotosSemantically(mockLibrary, 'food pizza', 'vault-family');
        expect(familyResults.length).toBeGreaterThan(0);
        expect(familyResults[0].photo.id).toBe('photo-restaurant-food');
    });

    it('6. Cosine similarity calculates exact 1.0 for identical semantic embeddings', () => {
        const text = 'family vacation trip to mountains and lake';
        const vec1 = generateTextEmbedding(text);
        const vec2 = generateTextEmbedding(text);

        const similarity = cosineSimilarity(vec1, vec2);
        expect(similarity).toBeCloseTo(1.0, 5);
    });
});
