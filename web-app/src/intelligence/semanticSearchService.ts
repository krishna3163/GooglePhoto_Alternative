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

        let layer1Score = 0; // Deterministic lexical/OCR/metadata signals
        let layer2Score = 0; // Semantic concept vector similarity
        const reasons: string[] = [];

        // -------------------------------------------------------------------
        // LAYER 1: Deterministic Signals
        // -------------------------------------------------------------------
        // 1a. Direct lexical filename and token matches
        const lowerName = photo.fileName.toLowerCase();
        const queryTokens = trimmedQuery.split(/\s+/).filter(t => t.length > 2);
        
        if (lowerName.includes(trimmedQuery)) {
            layer1Score += 0.90;
            reasons.push('Layer 1: Exact filename match');
        } else {
            const tokenHits = queryTokens.filter(t => lowerName.includes(t));
            if (tokenHits.length > 0) {
                layer1Score += 0.35 * tokenHits.length;
                reasons.push(`Layer 1: Filename keyword match (${tokenHits.join(', ')})`);
            }
        }

        // 1b. Direct OCR match and token hits
        if (photo.ocrText) {
            const lowerOcr = photo.ocrText.toLowerCase();
            if (lowerOcr.includes(trimmedQuery)) {
                layer1Score += 0.95;
                reasons.push('Layer 1: Exact OCR text match');
            } else {
                const ocrTokenHits = queryTokens.filter(t => lowerOcr.includes(t));
                if (ocrTokenHits.length > 0) {
                    layer1Score += 0.40 * ocrTokenHits.length;
                    reasons.push(`Layer 1: OCR keyword match (${ocrTokenHits.join(', ')})`);
                }
            }
        }

        // 1c. Geolocation match
        if (photo.location?.name && photo.location.name.toLowerCase().includes(trimmedQuery)) {
            layer1Score += 0.80;
            reasons.push('Layer 1: Geolocation match');
        }

        // 1d. Smart category deterministic match
        const categories = categorizePhoto(photo);
        const matchedCats = categories.filter(c => trimmedQuery.includes(c) || queryTokens.includes(c));
        if (matchedCats.length > 0) {
            layer1Score += 0.45;
            reasons.push(`Layer 1: Category tag (${matchedCats.join(', ')})`);
        }

        // 1e. Favorite slight relevance boost
        if (photo.isFavourite) {
            layer1Score += 0.05;
        }

        // -------------------------------------------------------------------
        // LAYER 2: Semantic Concept Embeddings & Cosine Similarity
        // -------------------------------------------------------------------
        const photoContext = buildPhotoSemanticContext(photo);
        const photoVector = generateTextEmbedding(photoContext);
        const similarity = cosineSimilarity(queryVector, photoVector);

        if (similarity > 0.05) {
            layer2Score = similarity * 0.85;
            if (similarity > 0.20) {
                reasons.push(`Layer 2: Concept similarity (${Math.round(similarity * 100)}%)`);
            }
        }

        // -------------------------------------------------------------------
        // HYBRID RANKER COMBINATION
        // -------------------------------------------------------------------
        const totalScore = layer1Score + layer2Score;

        if (totalScore >= threshold) {
            results.push({
                photo,
                score: totalScore,
                matchReasons: reasons.length > 0 ? reasons : ['General concept match'],
            });
        }
    }

    // Sort descending by total relevance score
    return results.sort((a, b) => b.score - a.score);
}
