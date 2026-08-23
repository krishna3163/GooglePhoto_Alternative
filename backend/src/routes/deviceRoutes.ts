import { Router, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/devices
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const devicesColl = collections.devices();
    const sessionsColl = collections.sessions();

    const [devices, activeSessions] = await Promise.all([
      devicesColl.find({ userId: userObjectId }).toArray(),
      sessionsColl.find({ userId: userObjectId, revokedAt: { $exists: false } }).toArray(),
    ]);

    const activeDeviceIds = new Set(activeSessions.map((s) => s.deviceId));

    res.json({
      success: true,
      data: devices.map((d) => ({
        id: d._id!.toString(),
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        platform: d.platform,
        browser: d.browser,
        lastActiveAt: d.lastActiveAt.toISOString(),
        isActive: activeDeviceIds.has(d.deviceId),
        isCurrent: d.deviceId === req.user?.deviceId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/devices/:id/revoke
router.post('/:id/revoke', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const sessionsColl = collections.sessions();

    await sessionsColl.updateMany(
      { userId: userObjectId, deviceId: req.params.id },
      { $set: { revokedAt: new Date() } }
    );

    res.json({ success: true, message: 'Device session revoked' });
  } catch (err) {
    next(err);
  }
});

export default router;
