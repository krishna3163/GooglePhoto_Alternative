import { queryPg } from '../config/database.js';
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
    const res = await queryPg('SELECT COALESCE(MAX(sync_version), 1) AS revision, NOW() AS updated_at FROM sync_events WHERE user_id = $1', [userId]);
    const row = res.rows[0];
    return {
      revision: Number(row?.revision || 1),
      updatedAt: new Date(row?.updated_at || Date.now()).toISOString(),
    };
  }

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
    const limit = Math.min(100, Math.max(1, options.limit || 50));

    const [vaultsRes, albumsRes, mediaCountRes, syncRevRes] = await Promise.all([
      queryPg('SELECT * FROM vaults WHERE user_id = $1 ORDER BY created_at ASC', [userId]),
      queryPg('SELECT * FROM albums WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      queryPg('SELECT count(*) FROM media WHERE user_id = $1', [userId]),
      queryPg('SELECT COALESCE(MAX(sync_version), 1) AS revision FROM sync_events WHERE user_id = $1', [userId]),
    ]);

    const mediaParams: any[] = [userId];
    let mediaQuery = 'SELECT * FROM media WHERE user_id = $1';
    if (options.cursor) {
      mediaParams.push(new Date(options.cursor));
      mediaQuery += ` AND created_at < $${mediaParams.length}`;
    }
    mediaParams.push(limit + 1);
    mediaQuery += ` ORDER BY created_at DESC LIMIT $${mediaParams.length}`;

    const mediaDocsRes = await queryPg(mediaQuery, mediaParams);
    const hasMore = mediaDocsRes.rows.length > limit;
    const items = hasMore ? mediaDocsRes.rows.slice(0, limit) : mediaDocsRes.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at.toISOString() : null;

    return {
      vaults: vaultsRes.rows.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        encryptedVaultKey: v.encrypted_vault_key,
        wrappedWithRecovery: v.wrapped_with_recovery,
        salt: v.salt,
        keyVersion: v.key_version,
      })),
      albums: albumsRes.rows.map((a) => ({
        id: a.id,
        vaultId: a.vault_id,
        name: a.name,
        description: a.description,
        mediaIds: [],
        coverMediaId: a.cover_media_id,
        createdAt: a.created_at.toISOString(),
      })),
      media: items.map((m) => ({
        id: m.id,
        vaultId: m.vault_id,
        fileName: m.file_name,
        mimeType: m.mime_type,
        mediaType: m.media_type,
        size: Number(m.file_size),
        width: m.width,
        height: m.height,
        favorite: m.is_favorite,
        trashed: m.is_deleted,
        deletedAt: m.deleted_at?.toISOString(),
        tags: [],
        albumIds: [],
        exifSummary: m.encrypted_metadata ? JSON.parse(m.encrypted_metadata) : {},
        encryption: {
          version: m.encryption_version,
          algorithm: 'AES-256-GCM',
          iv: m.encryption_iv,
        },
        telegram: {
          original: {
            chatId: m.telegram_chat_id,
            messageId: m.telegram_message_id ? Number(m.telegram_message_id) : 0,
            fileId: m.telegram_file_id,
          },
        },
        createdAt: m.created_at.toISOString(),
        updatedAt: m.updated_at.toISOString(),
      })),
      nextCursor,
      hasMore,
      totalMediaCount: Number(mediaCountRes.rows[0]?.count || 0),
      currentRevision: Number(syncRevRes.rows[0]?.revision || 1),
    };
  }

  public static async processMutations(
    userId: string,
    mutations: SyncMutation[]
  ): Promise<{ applied: number; currentRevision: number }> {
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
            await queryPg(
              `INSERT INTO albums (id, user_id, vault_id, name, description)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO NOTHING`,
              [m.entityId, userId, m.payload?.vaultId || 'default', m.payload?.name || 'Untitled Album', m.payload?.description || '']
            );
            applied++;
            break;

          case 'DELETE_ALBUM':
            await queryPg('DELETE FROM albums WHERE user_id = $1 AND id = $2', [userId, m.entityId]);
            applied++;
            break;
        }
      } catch (opErr) {
        console.warn('Sync mutation operation warning:', opErr);
      }
    }

    const state = await this.getSyncState(userId);
    return {
      applied,
      currentRevision: state.revision,
    };
  }
}
