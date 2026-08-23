import { queryPg } from '../config/database.js';

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
    let migratedMedia = 0;
    let skippedMedia = 0;
    let migratedAlbums = 0;

    // 1. Process Media Records
    for (const item of payload.media || []) {
      const existing = await queryPg('SELECT id FROM media WHERE user_id = $1 AND id = $2 LIMIT 1', [userId, item.id]);
      if (existing.rows.length > 0) {
        skippedMedia++;
        continue;
      }

      const mediaType = item.mediaType || (item.fileName?.toLowerCase().endsWith('.mp4') ? 'video' : 'image');

      await queryPg(
        `INSERT INTO media (
          id, user_id, vault_id, file_name, mime_type, media_type, file_size,
          is_favorite, is_deleted, telegram_chat_id, telegram_message_id, telegram_file_id,
          encryption_version, encryption_iv, encrypted_metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          item.id,
          userId,
          item.vaultId || 'default',
          item.fileName,
          item.mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
          mediaType,
          item.fileSizeBytes || 1024 * 1024,
          !!item.isFavourite,
          !!item.isTrash,
          item.chatId || 'legacy_chat',
          item.messageId || 0,
          item.fileId || `legacy_file_${item.id}`,
          item.encryptionMetadata?.v || 1,
          item.encryptionMetadata?.iv || 'legacy_iv',
          JSON.stringify(item.exif || {}),
          item.timestamp ? new Date(item.timestamp) : new Date(),
        ]
      );

      migratedMedia++;
    }

    // 2. Process Album Records
    for (const album of payload.albums || []) {
      await queryPg(
        `INSERT INTO albums (id, user_id, vault_id, name, description, created_at)
         VALUES ($1, $2, $3, $4, '', $5)
         ON CONFLICT (id) DO NOTHING`,
        [album.id, userId, album.vaultId || 'default', album.name || 'Untitled Album', album.createdAt ? new Date(album.createdAt) : new Date()]
      );
      migratedAlbums++;
    }

    // 3. Create Sync Event
    await queryPg(
      `INSERT INTO sync_events (user_id, entity_type, entity_id, operation, sync_version, payload)
       VALUES ($1, 'library', $1, 'MIGRATE', (SELECT COALESCE(MAX(sync_version), 0) + 1 FROM sync_events WHERE user_id = $1), $2)`,
      [userId, JSON.stringify({ migratedMedia, migratedAlbums })]
    );

    return {
      migratedMedia,
      skippedMedia,
      migratedAlbums,
    };
  }
}
