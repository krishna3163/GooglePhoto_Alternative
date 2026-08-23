import { Router, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AlbumDocument } from '../types/index.js';

const router = Router();

// GET /api/v1/albums
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const albumsColl = collections.albums();

    const albums = await albumsColl.find({ userId: userObjectId }).toArray();
    res.json({
      success: true,
      data: albums.map((a) => ({
        id: a.id,
        vaultId: a.vaultId,
        name: a.name,
        description: a.description,
        mediaIds: a.mediaIds,
        coverMediaId: a.coverMediaId,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/albums
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const albumsColl = collections.albums();
    const { id, name, description, vaultId, mediaIds, coverMediaId } = req.body || {};

    if (!name) {
      throw new AppError(400, 'MISSING_NAME', 'Album name is required');
    }

    const doc: AlbumDocument = {
      id: id || crypto.randomUUID(),
      userId: userObjectId,
      vaultId: vaultId || 'default',
      name: name.trim(),
      description,
      mediaIds: mediaIds || [],
      coverMediaId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await albumsColl.insertOne(doc);
    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        mediaIds: doc.mediaIds,
        coverMediaId: doc.coverMediaId,
        createdAt: doc.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/albums/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const albumsColl = collections.albums();

    await albumsColl.deleteOne({ userId: userObjectId, id: req.params.id });
    res.json({ success: true, message: 'Album deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
