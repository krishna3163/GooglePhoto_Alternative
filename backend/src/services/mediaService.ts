import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { TelegramStorageService } from './telegramStorage.js';
import type { MediaDocument } from '../types/index.js';

export interface CreateMediaInput {
  id: string; // Stable UUID
  vaultId: string;
  fileName: string;
  mimeType: string;
  mediaType: 'image' | 'video' | 'document';
  size: number;
  width?: number;
  height?: number;
  favorite?: boolean;
  albumIds?: string[];
  tags?: string[];
  exifSummary?: Record<string, any>;
  encryption: {
    version: number;
    algorithm: 'AES-256-GCM';
    iv: string;
    salt?: string;
  };
  fileBuffer: Buffer;
  thumbnailBuffer?: Buffer;
}

export class MediaService {
  public static async uploadMedia(
    userId: string,
    input: CreateMediaInput
  ): Promise<MediaDocument> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const telegramColl = collections.telegramConnections();
    const syncRevs = collections.syncRevisions();

    // Check if media with this ID already exists
    const existing = await mediaColl.findOne({ userId: userObjectId, id: input.id });
    if (existing) {
      return existing;
    }

    // Resolve user Telegram connection
    const tgConn = await telegramColl.findOne({ userId: userObjectId });
    const chatId = tgConn?.chatId || 'mock_chat_id';

    // 1. Upload encrypted main file to Telegram
    const mainUpload = await TelegramStorageService.uploadEncryptedMedia(
      input.fileBuffer,
      input.fileName,
      chatId
    );

    // 2. Upload encrypted thumbnail if provided
    let thumbUpload: any = undefined;
    if (input.thumbnailBuffer && input.thumbnailBuffer.length > 0) {
      thumbUpload = await TelegramStorageService.uploadEncryptedMedia(
        input.thumbnailBuffer,
        `thumb_${input.fileName}`,
        chatId
      );
    }

    // 3. Create Media Record in MongoDB
    const doc: MediaDocument = {
      id: input.id,
      userId: userObjectId,
      vaultId: input.vaultId || 'default',
      fileName: input.fileName,
      mimeType: input.mimeType,
      mediaType: input.mediaType,
      size: input.size,
      width: input.width,
      height: input.height,
      favorite: !!input.favorite,
      trashed: false,
      albumIds: input.albumIds || [],
      tags: input.tags || [],
      exifSummary: input.exifSummary || {},
      telegram: {
        original: {
          chatId: mainUpload.chatId,
          messageId: mainUpload.messageId,
          fileId: mainUpload.fileId,
        },
        thumbnail: thumbUpload
          ? {
              chatId: thumbUpload.chatId,
              messageId: thumbUpload.messageId,
              fileId: thumbUpload.fileId,
            }
          : undefined,
      },
      encryption: input.encryption,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mediaColl.insertOne(doc);

    // Increment user sync revision
    await syncRevs.updateOne(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );

    return doc;
  }

  public static async getGalleryMedia(
    userId: string,
    options: {
      vaultId?: string;
      trashed?: boolean;
      favorite?: boolean;
      mediaType?: string;
      limit?: number;
      cursor?: string;
    }
  ): Promise<{ items: any[]; nextCursor: string | null; hasMore: boolean }> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const limit = Math.min(100, Math.max(1, options.limit || 50));

    const query: Record<string, any> = {
      userId: userObjectId,
      trashed: options.trashed === true,
    };

    if (options.vaultId) {
      query.vaultId = options.vaultId;
    }
    if (options.favorite === true) {
      query.favorite = true;
    }
    if (options.mediaType && options.mediaType !== 'all') {
      query.mediaType = options.mediaType;
    }
    if (options.cursor) {
      query.createdAt = { $lt: new Date(options.cursor) };
    }

    // Projection optimized for fast gallery rendering
    const docs = await mediaColl
      .find(query, {
        projection: {
          id: 1,
          fileName: 1,
          mimeType: 1,
          mediaType: 1,
          size: 1,
          width: 1,
          height: 1,
          favorite: 1,
          trashed: 1,
          albumIds: 1,
          vaultId: 1,
          'telegram.thumbnail.fileId': 1,
          'telegram.original.fileId': 1,
          encryption: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      items: items.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        mimeType: d.mimeType,
        mediaType: d.mediaType,
        size: d.size,
        width: d.width,
        height: d.height,
        favorite: d.favorite,
        trashed: d.trashed,
        albumIds: d.albumIds,
        vaultId: d.vaultId,
        hasThumbnail: !!d.telegram?.thumbnail?.fileId,
        encryption: d.encryption,
        createdAt: d.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  public static async getMediaById(userId: string, mediaId: string): Promise<MediaDocument> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();

    const doc = await mediaColl.findOne({ userId: userObjectId, id: mediaId });
    if (!doc) {
      throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media not found');
    }
    return doc;
  }

  public static async downloadEncryptedMedia(userId: string, mediaId: string): Promise<Buffer> {
    const doc = await this.getMediaById(userId, mediaId);
    return TelegramStorageService.downloadMediaBuffer(doc.telegram.original.fileId);
  }

  public static async downloadEncryptedThumbnail(userId: string, mediaId: string): Promise<Buffer> {
    const doc = await this.getMediaById(userId, mediaId);
    const fileId = doc.telegram.thumbnail?.fileId || doc.telegram.original.fileId;
    return TelegramStorageService.downloadMediaBuffer(fileId);
  }

  public static async toggleFavorite(userId: string, mediaId: string, favorite?: boolean): Promise<boolean> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const syncRevs = collections.syncRevisions();

    const doc = await mediaColl.findOne({ userId: userObjectId, id: mediaId });
    if (!doc) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media not found');

    const newFav = typeof favorite === 'boolean' ? favorite : !doc.favorite;
    await mediaColl.updateOne(
      { userId: userObjectId, id: mediaId },
      { $set: { favorite: newFav, updatedAt: new Date() } }
    );

    await syncRevs.updateOne(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } }
    );

    return newFav;
  }

  public static async moveToTrash(userId: string, mediaId: string): Promise<void> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const syncRevs = collections.syncRevisions();

    await mediaColl.updateOne(
      { userId: userObjectId, id: mediaId },
      { $set: { trashed: true, deletedAt: new Date(), updatedAt: new Date() } }
    );

    await syncRevs.updateOne(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  public static async restoreFromTrash(userId: string, mediaId: string): Promise<void> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const syncRevs = collections.syncRevisions();

    await mediaColl.updateOne(
      { userId: userObjectId, id: mediaId },
      { $set: { trashed: false, deletedAt: undefined, updatedAt: new Date() } }
    );

    await syncRevs.updateOne(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  public static async permanentDelete(userId: string, mediaId: string): Promise<void> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const syncRevs = collections.syncRevisions();

    const doc = await mediaColl.findOne({ userId: userObjectId, id: mediaId });
    if (!doc) return;

    // Delete message from Telegram chat
    if (doc.telegram.original.chatId && doc.telegram.original.messageId) {
      await TelegramStorageService.deleteMediaMessage(
        doc.telegram.original.chatId,
        doc.telegram.original.messageId
      );
    }
    if (doc.telegram.thumbnail?.chatId && doc.telegram.thumbnail?.messageId) {
      await TelegramStorageService.deleteMediaMessage(
        doc.telegram.thumbnail.chatId,
        doc.telegram.thumbnail.messageId
      );
    }

    await mediaColl.deleteOne({ userId: userObjectId, id: mediaId });

    await syncRevs.updateOne(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } }
    );
  }
}
