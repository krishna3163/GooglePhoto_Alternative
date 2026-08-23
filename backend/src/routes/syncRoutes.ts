import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { SyncService } from '../services/syncService.js';

const router = Router();

// GET /api/v1/sync/state
router.get('/state', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const state = await SyncService.getSyncState(req.user!.id);
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sync/bootstrap
router.get('/bootstrap', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await SyncService.getBootstrap(req.user!.id, {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      cursor: req.query.cursor as string,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/mutations
router.post('/mutations', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mutations = Array.isArray(req.body?.mutations) ? req.body.mutations : [];
    const result = await SyncService.processMutations(req.user!.id, mutations);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
