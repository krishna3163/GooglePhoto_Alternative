import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { MigrationService } from '../services/migrationService.js';

const router = Router();

// POST /api/v1/migration/bootstrap
router.post('/bootstrap', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await MigrationService.migrateLegacyLibrary(req.user!.id, req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
