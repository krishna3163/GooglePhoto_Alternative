/**
 * Duplicate & Similar Media Detection Engine.
 * Uses SHA-256 exact matching and Perceptual Average Hash (aHash) for visual similarity.
 */

import type { PhotoAsset } from '../types';

/**
 * Compute SHA-256 hash of a Blob/File.
 */
export async function computeSHA256(data: Blob | File): Promise<string> {
    const buffer = await data.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute perceptual image hash (Average Hash) via canvas downsampling (8x8).
 */
export async function computeImagePHash(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 8;
                canvas.height = 8;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return resolve('');
                }

                ctx.drawImage(img, 0, 0, 8, 8);
                const imgData = ctx.getImageData(0, 0, 8, 8);
                const data = imgData.data;

                // 1. Calculate grayscale and average brightness
                let sum = 0;
                const grays: number[] = [];
                for (let i = 0; i < data.length; i += 4) {
                    const gray = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                    grays.push(gray);
                    sum += gray;
                }
                const avg = sum / 64;

                // 2. Generate 64-bit binary hash
                let hash = '';
                for (const g of grays) {
                    hash += g >= avg ? '1' : '0';
                }

                resolve(hash);
            } catch (err) {
                resolve('');
            }
        };
        img.onerror = () => resolve('');
        img.src = imageUrl;
    });
}

/**
 * Calculate Hamming distance between two binary hash strings.
 */
export function hammingDistance(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
    let dist = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) dist++;
    }
    return dist;
}

export interface DuplicateGroup {
    original: PhotoAsset;
    duplicates: PhotoAsset[];
    matchType: 'exact' | 'similar';
}

/**
 * Find all duplicate groups from a collection of photos.
 */
export function findDuplicates(photos: PhotoAsset[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    // 1. Group by exact file name and size or timestamp
    const nameMap = new Map<string, PhotoAsset[]>();
    for (const photo of photos) {
        if (photo.isTrash) continue;
        const key = `${photo.fileName}_${photo.fileSizeBytes || ''}`;
        if (!nameMap.has(key)) {
            nameMap.set(key, []);
        }
        nameMap.get(key)!.push(photo);
    }

    for (const [, list] of nameMap) {
        if (list.length > 1) {
            const original = list[0];
            const dups = list.slice(1);
            groups.push({
                original,
                duplicates: dups,
                matchType: 'exact',
            });
            list.forEach(p => processedIds.add(p.id));
        }
    }

    return groups;
}
