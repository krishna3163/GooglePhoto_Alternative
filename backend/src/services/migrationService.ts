import { queryPg } from '../config/database.js';

export interface LegacyMediaRecord {
  id: string;
  vaultId?: string;
  fileName: string;
  url?: string;
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

    // 1. Ensure user has a valid vault in PostgreSQL
    const vaultRes = await queryPg('SELECT id FROM vaults WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    let defaultVaultId: string;

    if (vaultRes.rows.length > 0) {
      defaultVaultId = vaultRes.rows[0].id;
    } else {
      const newV = await queryPg(
        `INSERT INTO vaults (user_id, name, encrypted_vault_key, salt)
         VALUES ($1, 'Personal Vault', 'default_key', 'default_salt')
         RETURNING id`,
        [userId]
      );
      defaultVaultId = newV.rows[0].id;
    }

    const validVaultIds = new Set(vaultRes.rows.map((v) => v.id));
    validVaultIds.add(defaultVaultId);

    // 2. Process Media Records
    for (const item of payload.media || []) {
      if (!item || !item.id) continue;

      const existing = await queryPg('SELECT id FROM media WHERE user_id = $1 AND id = $2 LIMIT 1', [userId, item.id]);
      if (existing.rows.length > 0) {
        skippedMedia++;
        continue;
      }

      const mediaType = item.mediaType || (item.fileName?.toLowerCase().endsWith('.mp4') ? 'video' : 'image');
      const targetVaultId = item.vaultId && validVaultIds.has(item.vaultId) ? item.vaultId : defaultVaultId;
      const fileId = item.fileId || item.id;
      const messageId = item.messageId ? Number(item.messageId) : 0;
      const size = Number(item.fileSizeBytes) || 1024 * 1024;

      try {
        await queryPg(
          `INSERT INTO media (
            id, user_id, vault_id, file_name, mime_type, media_type, file_size,
            is_favorite, is_deleted, telegram_chat_id, telegram_message_id, telegram_file_id,
            encryption_version, encryption_iv, encrypted_metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
          [
            item.id,
            userId,
            targetVaultId,
            item.fileName || 'media_asset',
            item.mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
            mediaType,
            size,
            !!item.isFavourite,
            !!item.isTrash,
            item.chatId || 'telegram_cloud',
            messageId,
            fileId,
            item.encryptionMetadata?.v || 1,
            item.encryptionMetadata?.iv || 'default_iv',
            JSON.stringify(item.exif || {}),
            item.timestamp ? new Date(item.timestamp) : new Date(),
          ]
        );
        migratedMedia++;
      } catch (insertErr) {
        console.warn(`Skipping media ${item.id} due to insert notice:`, insertErr);
        skippedMedia++;
      }
    }

    // 3. Process Album Records
    for (const album of payload.albums || []) {
      if (!album || !album.name) continue;
      const albumVaultId = album.vaultId && validVaultIds.has(album.vaultId) ? album.vaultId : defaultVaultId;

      try {
        await queryPg(
          `INSERT INTO albums (id, user_id, vault_id, name, description, created_at)
           VALUES ($1, $2, $3, $4, '', $5)
           ON CONFLICT (id) DO UPDATE SET name = $4`,
          [
            album.id || crypto.randomUUID(),
            userId,
            albumVaultId,
            album.name || 'Untitled Album',
            album.createdAt ? new Date(album.createdAt) : new Date(),
          ]
        );
        migratedAlbums++;
      } catch (albumErr) {
        console.warn('Skipping album due to insert notice:', albumErr);
      }
    }

    // 4. Record Sync Event
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
