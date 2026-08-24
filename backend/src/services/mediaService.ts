import { queryPg } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { TelegramStorageService } from './telegramStorage.js';

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
  ): Promise<any> {
    // 1. Check existing media
    const existing = await queryPg('SELECT * FROM media WHERE user_id = $1 AND id = $2 LIMIT 1', [userId, input.id]);
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const chatId = env.TELEGRAM_DEFAULT_CHAT_ID || (env.NODE_ENV === 'test' || env.NODE_ENV === 'development' ? 'mock_chat_id' : '');
    if (!chatId) {
      throw new AppError(500, 'TELEGRAM_CHAT_ID_MISSING', 'Telegram default chat ID is not configured');
    }

    // 2. Upload to Telegram
    const mainUpload = await TelegramStorageService.uploadEncryptedMedia(
      input.fileBuffer,
      input.fileName,
      chatId
    );

    let thumbUpload: any = undefined;
    if (input.thumbnailBuffer && input.thumbnailBuffer.length > 0) {
      thumbUpload = await TelegramStorageService.uploadEncryptedMedia(
        input.thumbnailBuffer,
        `thumb_${input.fileName}`,
        chatId
      );
    }

    // 3. Ensure target vault belongs to user
    let targetVaultId = input.vaultId;
    const userVaults = await queryPg('SELECT id FROM vaults WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    const matchingVault = userVaults.rows.find((v) => v.id === input.vaultId);

    if (matchingVault) {
      targetVaultId = matchingVault.id;
    } else if (userVaults.rows.length > 0) {
      targetVaultId = userVaults.rows[0].id;
    } else {
      const newVaultRes = await queryPg(
        `INSERT INTO vaults (user_id, name, encrypted_vault_key, salt)
         VALUES ($1, 'Personal Vault', 'default_key', 'default_salt')
         RETURNING id`,
        [userId]
      );
      targetVaultId = newVaultRes.rows[0].id;
    }

    // 4. Insert into PostgreSQL media table
    const mediaRes = await queryPg(
      `INSERT INTO media (
        id, user_id, vault_id, file_name, mime_type, media_type, file_size, width, height,
        is_favorite, is_deleted, telegram_chat_id, telegram_message_id, telegram_file_id,
        encryption_version, encryption_iv, encrypted_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        input.id,
        userId,
        targetVaultId,
        input.fileName,
        input.mimeType,
        input.mediaType,
        input.size,
        input.width || null,
        input.height || null,
        !!input.favorite,
        mainUpload.chatId,
        mainUpload.messageId,
        mainUpload.fileId,
        input.encryption.version || 1,
        input.encryption.iv || null,
        JSON.stringify(input.exifSummary || {}),
      ]
    );

    // 5. Create Sync Event
    await queryPg(
      `INSERT INTO sync_events (user_id, entity_type, entity_id, operation, sync_version, payload)
       VALUES ($1, 'media', $2, 'CREATE', (SELECT COALESCE(MAX(sync_version), 0) + 1 FROM sync_events WHERE user_id = $1), $3)`,
      [userId, input.id, JSON.stringify({ fileName: input.fileName, favorite: !!input.favorite, vaultId: targetVaultId })]
    );

    const row = mediaRes.rows[0];
    return {
      id: row.id,
      fileName: row.file_name,
      size: Number(row.file_size),
      createdAt: row.created_at,
    };
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
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const params: any[] = [userId, options.trashed === true];
    let query = 'SELECT * FROM media WHERE user_id = $1 AND is_deleted = $2';

    if (options.vaultId) {
      params.push(options.vaultId);
      query += ` AND vault_id = $${params.length}`;
    }
    if (options.favorite === true) {
      query += ' AND is_favorite = TRUE';
    }
    if (options.mediaType && options.mediaType !== 'all') {
      params.push(options.mediaType);
      query += ` AND media_type = $${params.length}`;
    }
    if (options.cursor) {
      params.push(new Date(options.cursor));
      query += ` AND created_at < $${params.length}`;
    }

    params.push(limit + 1);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const res = await queryPg(query, params);
    const hasMore = res.rows.length > limit;
    const items = hasMore ? res.rows.slice(0, limit) : res.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at.toISOString() : null;

    return {
      items: items.map((m) => ({
        id: m.id,
        fileName: m.file_name,
        mimeType: m.mime_type,
        mediaType: m.media_type,
        size: Number(m.file_size),
        width: m.width,
        height: m.height,
        favorite: m.is_favorite,
        trashed: m.is_deleted,
        vaultId: m.vault_id,
        telegram: {
          original: {
            chatId: m.telegram_chat_id,
            messageId: m.telegram_message_id ? Number(m.telegram_message_id) : 0,
            fileId: m.telegram_file_id,
          },
        },
        encryption: {
          version: m.encryption_version,
          algorithm: 'AES-256-GCM',
          iv: m.encryption_iv,
        },
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
      nextCursor,
      hasMore,
    };
  }

  public static async getMediaById(userId: string, mediaId: string): Promise<any> {
    const res = await queryPg('SELECT * FROM media WHERE user_id = $1 AND id = $2 LIMIT 1', [userId, mediaId]);
    if (res.rows.length === 0) {
      throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media asset not found');
    }
    return res.rows[0];
  }

  public static async downloadEncryptedMedia(userId: string, mediaId: string): Promise<Buffer> {
    const media = await this.getMediaById(userId, mediaId);
    if (!media.telegram_file_id) {
      throw new AppError(404, 'FILE_NOT_FOUND', 'No remote storage reference found for this media');
    }
    return TelegramStorageService.downloadMediaBuffer(media.telegram_file_id);
  }

  public static async downloadEncryptedThumbnail(userId: string, mediaId: string): Promise<Buffer> {
    const media = await this.getMediaById(userId, mediaId);
    if (media.telegram_file_id) {
      return TelegramStorageService.downloadMediaBuffer(media.telegram_file_id);
    }
    return Buffer.from('');
  }

  public static async toggleFavorite(userId: string, mediaId: string, favState?: boolean): Promise<boolean> {
    const current = await this.getMediaById(userId, mediaId);
    const nextFav = typeof favState === 'boolean' ? favState : !current.is_favorite;

    await queryPg('UPDATE media SET is_favorite = $1, updated_at = NOW() WHERE user_id = $2 AND id = $3', [
      nextFav,
      userId,
      mediaId,
    ]);

    await queryPg(
      `INSERT INTO sync_events (user_id, entity_type, entity_id, operation, sync_version, payload)
       VALUES ($1, 'media', $2, 'UPDATE', (SELECT COALESCE(MAX(sync_version), 0) + 1 FROM sync_events WHERE user_id = $1), $3)`,
      [userId, mediaId, JSON.stringify({ isFavorite: nextFav })]
    );

    return nextFav;
  }

  public static async moveToTrash(userId: string, mediaId: string): Promise<void> {
    await queryPg('UPDATE media SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND id = $2', [
      userId,
      mediaId,
    ]);

    await queryPg(
      `INSERT INTO sync_events (user_id, entity_type, entity_id, operation, sync_version, payload)
       VALUES ($1, 'media', $2, 'DELETE', (SELECT COALESCE(MAX(sync_version), 0) + 1 FROM sync_events WHERE user_id = $1), $3)`,
      [userId, mediaId, JSON.stringify({ isDeleted: true })]
    );
  }

  public static async restoreFromTrash(userId: string, mediaId: string): Promise<void> {
    await queryPg('UPDATE media SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW() WHERE user_id = $1 AND id = $2', [
      userId,
      mediaId,
    ]);

    await queryPg(
      `INSERT INTO sync_events (user_id, entity_type, entity_id, operation, sync_version, payload)
       VALUES ($1, 'media', $2, 'RESTORE', (SELECT COALESCE(MAX(sync_version), 0) + 1 FROM sync_events WHERE user_id = $1), $3)`,
      [userId, mediaId, JSON.stringify({ isDeleted: false })]
    );
  }

  public static async permanentDelete(userId: string, mediaId: string): Promise<void> {
    const media = await this.getMediaById(userId, mediaId);
    if (media.telegram_message_id && media.telegram_chat_id) {
      await TelegramStorageService.deleteMediaMessage(media.telegram_chat_id, Number(media.telegram_message_id));
    }
    await queryPg('DELETE FROM media WHERE user_id = $1 AND id = $2', [userId, mediaId]);
  }
}
