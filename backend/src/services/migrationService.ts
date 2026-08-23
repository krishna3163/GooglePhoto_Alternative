import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import type { MediaDocument } from '../types/index.js';

export interface LegacyMediaRecord {
  id: string;
  vaultId?: string;
  fileName: string;
  mimeType?: string;
  mediaType?: 'image' | 'video' | 'document';
  fileSizeBytes?: number;
  isFavourite?: boolean;
  isTrash?: boolean;
  albumIds?: string[];
  tags?: string[];
  exif?: Record<string, any>;
  messageId?: number;
  fileId?: string;
  chatId?: string;
  isEncrypted?: boolean;
  encryptionMetadata?: {
    v: number;
    alg: 'AES-256-GCM';
    iv: string;
    salt?: string;
  };
  timestamp?: string;
}

export interface LegacyAlbumRecord {
  id: string;
  vaultId?: string;
  name: string;
  photoIds: string[];
  coverPhotoUrl?: string;
  createdAt?: string;
}

export interface MigrationBootstrapPayload {
  media: LegacyMediaRecord[];
  albums: LegacyAlbumRecord[];
  vaults?: { id: string; name: string; encryptedVaultKey?: string; salt?: string }[];
}

export class MigrationService {
  public static async migrateLegacyLibrary(
    userId: string,
    payload: MigrationBootstrapPayload
  ): Promise<{
    migratedMedia: number;
    skippedMedia: number;
    migratedAlbums: number;
  }> {
    const userObjectId = new ObjectId(userId);
    const mediaColl = collections.media();
    const albumsColl = collections.albums();
    const syncRevs = collections.syncRevisions();

    let migratedMedia = 0;
    let skippedMedia = 0;
    let migratedAlbums = 0;

    // 1. Process Media Records
    for (const item of payload.media || []) {
      const existing = await mediaColl.findOne({ userId: userObjectId, id: item.id });
      if (existing) {
        skippedMedia++;
        continue;
      }

      const mediaType = item.mediaType || (item.fileName?.toLowerCase().endsWith('.mp4') ? 'video' : 'image');

      const doc: MediaDocument = {
        id: item.id,
        userId: userObjectId,
        vaultId: item.vaultId || 'default',
        fileName: item.fileName,
        mimeType: item.mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        mediaType,
        size: item.fileSizeBytes || 1024 * 1024,
        favorite: !!item.isFavourite,
        trashed: !!item.isTrash,
        albumIds: item.albumIds || [],
        tags: item.tags || [],
        exifSummary: item.exif || {},
        telegram: {
          original: {
            chatId: item.chatId || 'legacy_chat',
            messageId: item.messageId || 0,
            fileId: item.fileId || `legacy_file_${item.id}`,
          },
        },
        encryption: {
          version: item.encryptionMetadata?.v || 1,
          algorithm: 'AES-256-GCM',
          iv: item.encryptionMetadata?.iv || 'legacy_iv',
          salt: item.encryptionMetadata?.salt,
        },

        createdAt: item.timestamp ? new Date(item.timestamp) : new Date(),
        updatedAt: new Date(),
      };

      await mediaColl.insertOne(doc);
      migratedMedia++;
    }

    // 2. Process Album Records
    for (const album of payload.albums || []) {
      await albumsColl.updateOne(
        { userId: userObjectId, id: album.id },
        {
          $setOnInsert: {
            id: album.id,
            userId: userObjectId,
            vaultId: album.vaultId || 'default',
            name: album.name || 'Untitled Album',
            mediaIds: album.photoIds || [],
            createdAt: album.createdAt ? new Date(album.createdAt) : new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      migratedAlbums++;
    }

    // Increment revision
    await syncRevs.updateOne(
      { userId: userObjectId },
      { $inc: { currentRevision: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );

    return {
      migratedMedia,
      skippedMedia,
      migratedAlbums,
    };
  }
}
