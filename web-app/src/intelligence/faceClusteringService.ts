/**
 * Privacy-First On-Device Face Clustering Engine.
 *
 * Implements:
 * 1. Client-side face descriptor representation.
 * 2. Unsupervised vector clustering (Agglomerative / Distance Threshold Clustering).
 * 3. Person Group management without automated identity claims.
 * 4. Zero-cloud guarantee: Face embeddings NEVER leave the local client.
 */

import type { PhotoAsset } from '../types';

export interface FaceDescriptor {
    faceId: string;
    photoId: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    embedding: number[]; // Normalized 128-dimensional face embedding vector
}

export interface PersonGroup {
    id: string;
    name: string; // User-defined name or default "Person #N"
    coverPhotoUrl?: string;
    faceIds: string[];
    photoIds: string[];
    createdAt: string;
}

/**
 * Calculate Euclidean Distance between two normalized face embedding vectors.
 */
export function calculateFaceDistance(emb1: number[], emb2: number[]): number {
    if (emb1.length !== emb2.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < emb1.length; i++) {
        const diff = emb1[i] - emb2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Group face descriptors into Person clusters based on distance threshold.
 */
export function clusterFaces(
    faces: FaceDescriptor[],
    photosMap: Map<string, PhotoAsset>,
    existingGroups: PersonGroup[] = [],
    distanceThreshold: number = 0.50
): PersonGroup[] {
    if (faces.length === 0) return existingGroups;

    const groups: PersonGroup[] = [...existingGroups];
    let personCounter = groups.length + 1;

    for (const face of faces) {
        let matchedGroup: PersonGroup | null = null;
        let minDistance = Infinity;

        // Check if face matches any existing cluster
        for (const group of groups) {
            // Find representative face embedding of this group
            const groupFaces = faces.filter(f => group.faceIds.includes(f.faceId));
            for (const gf of groupFaces) {
                const dist = calculateFaceDistance(face.embedding, gf.embedding);
                if (dist < distanceThreshold && dist < minDistance) {
                    minDistance = dist;
                    matchedGroup = group;
                }
            }
        }

        if (matchedGroup) {
            if (!matchedGroup.faceIds.includes(face.faceId)) {
                matchedGroup.faceIds.push(face.faceId);
            }
            if (!matchedGroup.photoIds.includes(face.photoId)) {
                matchedGroup.photoIds.push(face.photoId);
            }
        } else {
            // Create new cluster
            const photo = photosMap.get(face.photoId);
            const newGroup: PersonGroup = {
                id: `person-${Date.now()}-${personCounter}`,
                name: `Person #${personCounter}`,
                coverPhotoUrl: photo?.url,
                faceIds: [face.faceId],
                photoIds: [face.photoId],
                createdAt: new Date().toISOString(),
            };
            groups.push(newGroup);
            personCounter++;
        }
    }

    return groups;
}

/**
 * Rename a Person Group (User customization).
 */
export function renamePersonGroup(
    groups: PersonGroup[],
    groupId: string,
    newName: string
): PersonGroup[] {
    const trimmed = newName.trim();
    if (!trimmed) return groups;

    return groups.map(g => (g.id === groupId ? { ...g, name: trimmed } : g));
}
