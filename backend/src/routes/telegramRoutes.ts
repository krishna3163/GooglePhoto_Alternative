import { Router, Response } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { TelegramStorageService } from '../services/telegramStorage.js';

const router = Router();

const connectSchema = z.object({
  botToken: z.string().min(10),
  chatId: z.string().min(1),
});

// POST /api/v1/telegram/connect
router.post(
  '/connect',
  requireAuth,
  validateRequest({ body: connectSchema }),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { botToken, chatId } = req.body;
      const userObjectId = new ObjectId(req.user!.id);
      const tgColl = collections.telegramConnections();
      const usersColl = collections.users();

      // Validate bot token
      const botInfo = await TelegramStorageService.validateBotToken(botToken.trim());

      // Save connection
      const connRes = await tgColl.updateOne(
        { userId: userObjectId },
        {
          $set: {
            chatId: chatId.trim(),
            botTokenEncrypted: botToken.trim(), // In production, can wrap with system KEK
            botUsername: botInfo.username,
            isVerified: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      await usersColl.updateOne(
        { _id: userObjectId },
        { $set: { telegramConnectionId: connRes.upsertedId?.toString() || 'connected' } }
      );

      res.json({
        success: true,
        data: {
          botUsername: botInfo.username,
          chatId: chatId.trim(),
          isVerified: true,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/telegram/status
router.get('/status', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const tgColl = collections.telegramConnections();
    const conn = await tgColl.findOne({ userId: userObjectId });

    res.json({
      success: true,
      data: {
        isConnected: !!conn?.isVerified,
        botUsername: conn?.botUsername,
        chatId: conn?.chatId,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
