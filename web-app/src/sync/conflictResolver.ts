import type {
    SyncManifest,
    ManifestMediaItem,
    ManifestAlbumItem,
    ManifestVaultItem,
} from './syncTypes';

export interface MergeResult {
    mergedManifest: SyncManifest;
    conflictsResolvedCount: number;
    hasChanges: boolean;
}

/**
 * Merge two ManifestMediaItem records using field-aware 3-way resolution.
 */
export function mergeMediaItem(
    localItem: ManifestMediaItem,
    remoteItem: ManifestMediaItem
): { merged: ManifestMediaItem; hadConflict: boolean } {
    let hadConflict = false;

    // Use timestamps to determine field precedence
    const localTime = new Date(localItem.updatedAt || localItem.createdAt).getTime();
    const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt).getTime();

    // 1. Base copy from the newer item
    const newer = remoteTime >= localTime ? remoteItem : localItem;

    const merged: ManifestMediaItem = { ...newer };

    // 2. Field-aware merging: Independent modifications
    // Favorites: If either device set favorite, preserve favorite
    if (localItem.isFavourite !== remoteItem.isFavourite) {
        merged.isFavourite = localItem.isFavourite || remoteItem.isFavourite;
        hadConflict = true;
    }

    // Filename: Newer update takes precedence
    if (localItem.fileName !== remoteItem.fileName) {
        merged.fileName = newer.fileName;
        hadConflict = true;
    }

    // Albums: Union of assigned album IDs
    const albumSet = new Set([...(localItem.albumIds || []), ...(remoteItem.albumIds || [])]);
    merged.albumIds = Array.from(albumSet);

    // Tags: Union of tags
    const tagSet = new Set([...(localItem.tags || []), ...(remoteItem.tags || [])]);
    merged.tags = Array.from(tagSet);

    // Soft delete & Trash: Newer update takes precedence (allows restore after delete)
    if (localItem.isTrash !== remoteItem.isTrash) {
        merged.isTrash = newer.isTrash;
        merged.deletedAt = newer.deletedAt || null;
        hadConflict = true;
    }

    // Latest updatedAt
    merged.updatedAt = new Date(Math.max(localTime, remoteTime)).toISOString();

    return { merged, hadConflict };
}

/**
 * Merge two ManifestAlbumItem records.
 */
export function mergeAlbumItem(
    localAlbum: ManifestAlbumItem,
    remoteAlbum: ManifestAlbumItem
): ManifestAlbumItem {
    const localTime = new Date(localAlbum.updatedAt || localAlbum.createdAt).getTime();
    const remoteTime = new Date(remoteAlbum.updatedAt || remoteAlbum.createdAt).getTime();
    const newer = remoteTime >= localTime ? remoteAlbum : localAlbum;

    // Union of photos inside the album so photos added on either device are preserved
    const combinedPhotoIds = Array.from(
        new Set([...(localAlbum.photoIds || []), ...(remoteAlbum.photoIds || [])])
    );

    return {
        id: localAlbum.id,
        name: newer.name,
        coverPhotoId: newer.coverPhotoId,
        createdAt: localAlbum.createdAt || remoteAlbum.createdAt,
        updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
        photoIds: combinedPhotoIds,
    };
}

/**
 * Perform complete field-aware conflict resolution between Local and Remote Manifests.
 */
export function mergeManifests(
    localManifest: SyncManifest,
    remoteManifest: SyncManifest,
    currentDeviceId: string
): MergeResult {
    let conflictsResolvedCount = 0;
    let hasChanges = false;

    // 1. Vaults merge
    const vaultMap = new Map<string, ManifestVaultItem>();
    for (const v of remoteManifest.vaults) vaultMap.set(v.id, v);
    for (const v of localManifest.vaults) {
        if (!vaultMap.has(v.id)) {
            vaultMap.set(v.id, v);
            hasChanges = true;
        }
    }

    // 2. Albums merge
    const albumMap = new Map<string, ManifestAlbumItem>();
    for (const a of remoteManifest.albums) albumMap.set(a.id, a);
    for (const a of localManifest.albums) {
        if (albumMap.has(a.id)) {
            const remoteA = albumMap.get(a.id)!;
            const mergedA = mergeAlbumItem(a, remoteA);
            albumMap.set(a.id, mergedA);
            if (mergedA.photoIds.length !== remoteA.photoIds.length || mergedA.name !== remoteA.name) {
                hasChanges = true;
            }
        } else {
            albumMap.set(a.id, a);
            hasChanges = true;
        }
    }

    // 3. Media merge
    const mediaMap = new Map<string, ManifestMediaItem>();
    for (const m of remoteManifest.media) mediaMap.set(m.id, m);

    for (const localM of localManifest.media) {
        if (mediaMap.has(localM.id)) {
            const remoteM = mediaMap.get(localM.id)!;
            const { merged, hadConflict } = mergeMediaItem(localM, remoteM);
            mediaMap.set(localM.id, merged);
            if (hadConflict) {
                conflictsResolvedCount++;
                hasChanges = true;
            }
        } else {
            // New local item not yet in remote
            mediaMap.set(localM.id, localM);
            hasChanges = true;
        }
    }

    const mergedRevision = Math.max(localManifest.revision, remoteManifest.revision) + (hasChanges ? 1 : 0);

    const mergedManifest: SyncManifest = {
        version: Math.max(localManifest.version, remoteManifest.version),
        accountId: remoteManifest.accountId || localManifest.accountId,
        revision: mergedRevision,
        updatedAt: new Date().toISOString(),
        lastModifiedByDeviceId: currentDeviceId,
        vaults: Array.from(vaultMap.values()),
        albums: Array.from(albumMap.values()),
        media: Array.from(mediaMap.values()),
        deltaHistory: [
            ...(remoteManifest.deltaHistory || []),
            ...(hasChanges ? [{
                revision: mergedRevision,
                timestamp: new Date().toISOString(),
                deviceId: currentDeviceId,
                operations: [],
            }] : []),
        ],
    };

    return {
        mergedManifest,
        conflictsResolvedCount,
        hasChanges,
    };
}
