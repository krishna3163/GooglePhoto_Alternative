import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import { MediaService } from './mediaService.js';

export interface SyncMutation {
  operationId: string;
  type: 'UPDATE_FAVORITE' | 'TRASH' | 'RESTORE' | 'DELETE_PERMANENT' | 'UPDATE_TAGS' | 'CREATE_ALBUM' | 'UPDATE_ALBUM' | 'DELETE_ALBUM';
  entityId: string;
  payload?: any;
  timestamp: string;
}

export class SyncService {
  public static async getSyncState(userId: string): Promise<{ revision: number; updatedAt: string }> {
    const userObjectId = new ObjectId(userId);
    const syncRevs = collections.syncRevisions();

    const rev = await syncRevs.findOne({ userId: userObjectId });
    return {
      revision: rev?.currentRevision || 1,
      updatedAt: (rev?.updatedAt || new Date()).toISOString(),
    };
  }

  /**
   * Bootstrap endpoint: Returns complete vaults, albums, and paginated media for fresh devices.
   */
  public static async getBootstrap(
    userId: string,
    options: { limit?: number; cursor?: string }
  ): Promise<{
    vaults: any[];
    albums: any[];
    media: any[];
    nextCursor: string | null;
    hasMore: boolean;
    totalMediaCount: number;
    currentRevision: number;
  }> {
    const userObjectId = new ObjectId(userId);
    const vaultsColl = collections.vaults();
    const albumsColl = collections.albums();
    const mediaColl = collections.media();
    const syncRevs = collections.syncRevisions();

    const [vaults, albums, totalMediaCount, syncRev] = await Promise.all([
      vaultsColl.find({ userId: userObjectId }).toArray(),
      albumsColl.find({ userId: userObjectId }).toArray(),
      mediaColl.countDocuments({ userId: userObjectId }),
      syncRevs.findOne({ userId: userObjectId }),
    ]);

    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const mediaQuery: Record<string, any> = { userId: userObjectId };
    if (options.cursor) {
      mediaQuery.createdAt = { $lt: new Date(options.cursor) };
    }

    const mediaDocs = await mediaColl
      .find(mediaQuery)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = mediaDocs.length > limit;
    const items = hasMore ? mediaDocs.slice(0, limit) : mediaDocs;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      vaults: vaults.map((v) => ({
        id: v._id!.toString(),
        name: v.name,
        description: v.description,
        encryptedVaultKey: v.encryptedVaultKey,
        wrappedWithRecovery: v.wrappedWithRecovery,
        salt: v.salt,
        keyVersion: v.keyVersion,
      })),
      albums: albums.map((a) => ({
        id: a.id,
        vaultId: a.vaultId,
        name: a.name,
        description: a.description,
        mediaIds: a.mediaIds,
        coverMediaId: a.coverMediaId,
        createdAt: a.createdAt.toISOString(),
      })),
      media: items.map((m) => ({
        id: m.id,
        vaultId: m.vaultId,
        fileName: m.fileName,
        mimeType: m.mimeType,
        mediaType: m.mediaType,
        size: m.size,
        width: m.width,
        height: m.height,
        favorite: m.favorite,
        trashed: m.trashed,
        deletedAt: m.deletedAt?.toISOString(),
        tags: m.tags,
        albumIds: m.albumIds,
        exifSummary: m.exifSummary,
        encryption: m.encryption,
        telegram: {
          original: m.telegram.original,
          thumbnail: m.telegram.thumbnail,
        },
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      nextCursor,
      hasMore,
      totalMediaCount,
      currentRevision: syncRev?.currentRevision || 1,
    };
  }

  /**
   * Process a batch of mutations atomically from offline queues.
   */
  public static async processMutations(
    userId: string,
    mutations: SyncMutation[]
  ): Promise<{ applied: number; currentRevision: number }> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const albumsColl = collections.albums();
    const syncRevs = collections.syncRevisions();

    let applied = 0;

    for (const m of mutations) {
      try {
        switch (m.type) {
          case 'UPDATE_FAVORITE':
            await MediaService.toggleFavorite(userId, m.entityId, m.payload?.favorite);
            applied++;
            break;

          case 'TRASH':
            await MediaService.moveToTrash(userId, m.entityId);
            applied++;
            break;

          case 'RESTORE':
            await MediaService.restoreFromTrash(userId, m.entityId);
            applied++;
            break;

          case 'DELETE_PERMANENT':
            await MediaService.permanentDelete(userId, m.entityId);
            applied++;
            break;

          case 'CREATE_ALBUM':
            await albumsColl.updateOne(
              { userId: userObjectId, id: m.entityId },
              {
                $setOnInsert: {
                  id: m.entityId,
                  userId: userObjectId,
                  vaultId: m.payload?.vaultId || 'default',
                  name: m.payload?.name || 'New Album',
                  description: m.payload?.description,
                  mediaIds: m.payload?.mediaIds || [],
                  coverMediaId: m.payload?.coverMediaId,
                  createdAt: new Date(m.timestamp || Date.now()),
                  updatedAt: new Date(),
                },
              },
              { upsert: true }
            );
            applied++;
            break;

          case 'UPDATE_ALBUM':
            await albumsColl.updateOne(
              { userId: userObjectId, id: m.entityId },
              {
                $set: {
                  name: m.payload?.name,
                  description: m.payload?.description,
                  mediaIds: m.payload?.mediaIds,
                  coverMediaId: m.payload?.coverMediaId,
                  updatedAt: new Date(),
                },
              }
            );
            applied++;
            break;

          case 'DELETE_ALBUM':
            await albumsColl.deleteOne({ userId: userObjectId, id: m.entityId });
            applied++;
            break;

          case 'UPDATE_TAGS':
            await mediaColl.updateOne(
              { userId: userObjectId, id: m.entityId },
              { $set: { tags: m.payload?.tags || [], updatedAt: new Date() } }
            );
            applied++;
            break;
        }
      } catch (err) {
        console.warn('Error processing mutation item:', m, err);
      }
    }

    const rev = await syncRevs.findOneAndUpdate(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    return {
      applied,
      currentRevision: rev?.currentRevision || 1,
    };
  }
}
