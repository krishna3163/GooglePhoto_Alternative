import { Router, Response, NextFunction } from 'express';
import { queryPg } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/v1/albums
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resAlbums = await queryPg('SELECT * FROM albums WHERE user_id = $1 ORDER BY created_at DESC', [req.user!.id]);
    res.json({
      success: true,
      data: resAlbums.rows.map((a) => ({
        id: a.id,
        vaultId: a.vault_id,
        name: a.name,
        description: a.description,
        mediaIds: [],
        coverMediaId: a.cover_media_id,
        createdAt: a.created_at.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/albums
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, name, description, vaultId, coverMediaId } = req.body || {};

    if (!name) {
      throw new AppError(400, 'MISSING_NAME', 'Album name is required');
    }

    const albumId = id || crypto.randomUUID();
    const vaultRes = await queryPg('SELECT id FROM vaults WHERE user_id = $1 LIMIT 1', [req.user!.id]);
    const targetVaultId = (vaultId && vaultRes.rows.some((v: any) => v.id === vaultId)) ? vaultId : (vaultRes.rows[0]?.id || null);

    const insertRes = await queryPg(
      `INSERT INTO albums (id, user_id, vault_id, name, description, cover_media_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [albumId, req.user!.id, targetVaultId, name.trim(), description || null, coverMediaId || null]
    );

    const doc = insertRes.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        mediaIds: [],
        coverMediaId: doc.cover_media_id,
        createdAt: doc.created_at.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/albums/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await queryPg('DELETE FROM albums WHERE user_id = $1 AND id = $2', [req.user!.id, req.params.id]);
    res.json({ success: true, message: 'Album deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
