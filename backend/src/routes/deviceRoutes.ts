import { Router, Response, NextFunction } from 'express';
import { queryPg } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/devices
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [devicesRes, sessionsRes] = await Promise.all([
      queryPg('SELECT * FROM devices WHERE user_id = $1 ORDER BY last_seen_at DESC', [req.user!.id]),
      queryPg('SELECT device_id FROM sessions WHERE user_id = $1 AND revoked_at IS NULL', [req.user!.id]),
    ]);

    const activeDeviceIds = new Set(sessionsRes.rows.map((s) => s.device_id));

    res.json({
      success: true,
      data: devicesRes.rows.map((d) => ({
        id: d.id,
        deviceId: d.device_id,
        deviceName: d.device_name,
        platform: d.device_type || 'Web',
        browser: 'Browser',
        lastActiveAt: d.last_seen_at.toISOString(),
        isActive: activeDeviceIds.has(d.device_id),
        isCurrent: d.device_id === req.user?.deviceId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/devices/:id/revoke
router.post('/:id/revoke', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await queryPg('UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND device_id = $2', [
      req.user!.id,
      req.params.id,
    ]);

    res.json({ success: true, message: 'Device session revoked' });
  } catch (err) {
    next(err);
  }
});

export default router;
