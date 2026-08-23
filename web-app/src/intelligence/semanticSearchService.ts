import type { PhotoAsset } from '../types';
import { generateTextEmbedding, cosineSimilarity } from './embeddingService';
import { categorizePhoto } from './smartCollectionsService';

export interface SearchResult {
    photo: PhotoAsset;
    score: number;
    matchReasons: string[];
}

/**
 * Build rich descriptive text representation of a photo for semantic vectorization.
 */
export function buildPhotoSemanticContext(photo: PhotoAsset): string {
    const parts: string[] = [];

    // Filename
    parts.push(photo.fileName);

    // Media type
    parts.push(photo.mediaType);

    // OCR extracted text
    if (photo.ocrText) {
        parts.push(photo.ocrText);
    }

    // Geolocation name
    if (photo.location?.name) {
        parts.push(photo.location.name);
    }

    // Smart Categories
    const categories = categorizePhoto(photo);
    parts.push(...categories);

    // Camera Model
    if (photo.exif?.cameraModel) {
        parts.push(photo.exif.cameraModel);
    }

    return parts.join(' ');
}

/**
 * Execute privacy-preserving hybrid semantic search across a collection of photos.
 */
export function searchPhotosSemantically(
    photos: (PhotoAsset & { vaultId?: string })[],
    rawQuery: string,
    activeVaultId?: string,
    threshold: number = 0.12
): SearchResult[] {
    const trimmedQuery = rawQuery.trim().toLowerCase();
    if (!trimmedQuery) {
        return photos
            .filter(p => !p.isTrash && (!activeVaultId || p.vaultId === activeVaultId))
            .map(p => ({ photo: p, score: 1.0, matchReasons: ['all'] }));
    }

    const queryVector = generateTextEmbedding(trimmedQuery);
    const results: SearchResult[] = [];

    for (const photo of photos) {
        // Strict boundary 1: Exclude Trash
        if (photo.isTrash) continue;

        // Strict boundary 2: Vault Isolation
        if (activeVaultId && photo.vaultId && photo.vaultId !== activeVaultId) {
            continue;
        }

        let score = 0;
        const reasons: string[] = [];

        // 1. Direct lexical filename and token matches
        const lowerName = photo.fileName.toLowerCase();
        const queryTokens = trimmedQuery.split(/\s+/).filter(t => t.length > 2);
        
        if (lowerName.includes(trimmedQuery)) {
            score += 0.85;
            reasons.push('Filename match');
        } else {
            const tokenHits = queryTokens.filter(t => lowerName.includes(t));
            if (tokenHits.length > 0) {
                score += 0.35 * tokenHits.length;
                reasons.push('Filename keyword match');
            }
        }

        // 2. Direct OCR match and token hits
        if (photo.ocrText) {
            const lowerOcr = photo.ocrText.toLowerCase();
            if (lowerOcr.includes(trimmedQuery)) {
                score += 0.90;
                reasons.push('OCR text match');
            } else {
                const ocrTokenHits = queryTokens.filter(t => lowerOcr.includes(t));
                if (ocrTokenHits.length > 0) {
                    score += 0.40 * ocrTokenHits.length;
                    reasons.push(`OCR keyword match (${ocrTokenHits.join(', ')})`);
                }
            }
        }

        // 3. Location match
        if (photo.location?.name && photo.location.name.toLowerCase().includes(trimmedQuery)) {
            score += 0.75;
            reasons.push('Location match');
        }

        // 4. Vector Cosine Similarity
        const photoContext = buildPhotoSemanticContext(photo);
        const photoVector = generateTextEmbedding(photoContext);
        const similarity = cosineSimilarity(queryVector, photoVector);

        if (similarity > 0.05) {
            score += similarity * 0.75;
            if (similarity > 0.25) {
                reasons.push(`Semantic concept similarity (${Math.round(similarity * 100)}%)`);
            }
        }

        // 5. Smart category match
        const categories = categorizePhoto(photo);
        const matchedCats = categories.filter(c => trimmedQuery.includes(c) || queryTokens.includes(c));
        if (matchedCats.length > 0) {
            score += 0.45;
            reasons.push(`Category match (${matchedCats.join(', ')})`);
        }

        // 6. Favorite slight relevance boost
        if (photo.isFavourite) {
            score += 0.05;
        }

        if (score >= threshold) {
            results.push({
                photo,
                score,
                matchReasons: reasons.length > 0 ? reasons : ['General concept match'],
            });
        }
    }

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score);
}
