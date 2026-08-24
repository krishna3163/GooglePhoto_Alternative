import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { MediaService } from '../services/mediaService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per media chunk
  },
});

// POST /api/v1/media/upload
router.post(
  '/upload',
  requireAuth,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.file?.[0];
      const thumb = files?.thumbnail?.[0];

      if (!file) {
        throw new AppError(400, 'NO_FILE', 'No encrypted media file provided in upload');
      }

      const metadataRaw = req.body?.metadata ? JSON.parse(req.body.metadata) : req.body || {};

      const result = await MediaService.uploadMedia(req.user!.id, {
        id: metadataRaw.id || crypto.randomUUID(),
        vaultId: metadataRaw.vaultId || 'default',
        fileName: metadataRaw.fileName || file.originalname,
        mimeType: metadataRaw.mimeType || 'application/octet-stream',
        mediaType: metadataRaw.mediaType || 'image',
        size: file.size,
        width: metadataRaw.width,
        height: metadataRaw.height,
        favorite: metadataRaw.favorite,
        albumIds: metadataRaw.albumIds,
        tags: metadataRaw.tags,
        exifSummary: metadataRaw.exifSummary,
        encryption: metadataRaw.encryption || {
          version: 1,
          algorithm: 'AES-256-GCM',
          iv: 'default_iv',
        },
        fileBuffer: file.buffer,
        thumbnailBuffer: thumb?.buffer,
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          fileName: result.fileName,
          size: result.size,
          createdAt: result.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/media
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await MediaService.getGalleryMedia(req.user!.id, {
      vaultId: req.query.vaultId as string,
      trashed: req.query.trashed === 'true',
      favorite: req.query.favorite === 'true',
      mediaType: req.query.mediaType as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      cursor: req.query.cursor as string,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/media/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await MediaService.getMediaById(req.user!.id, req.params.id);
    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/media/:id/download
router.get('/:id/download', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const buffer = await MediaService.downloadEncryptedMedia(req.user!.id, req.params.id);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/media/:id/thumbnail
router.get('/:id/thumbnail', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const buffer = await MediaService.downloadEncryptedThumbnail(req.user!.id, req.params.id);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// POST or PATCH /api/v1/media/:id/favorite
router.all('/:id/favorite', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isFav = await MediaService.toggleFavorite(req.user!.id, req.params.id, req.body?.favorite);
    res.json({ success: true, data: { favorite: isFav } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/media/:id/trash
router.post('/:id/trash', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await MediaService.moveToTrash(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Moved to trash' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/media/:id/restore
router.post('/:id/restore', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await MediaService.restoreFromTrash(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Restored from trash' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/media/:id/permanent
router.delete('/:id/permanent', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await MediaService.permanentDelete(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Permanently deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
