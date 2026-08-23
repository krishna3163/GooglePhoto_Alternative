import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { queryPg } from '../config/database.js';
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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { botToken, chatId } = req.body;

      // Validate bot token
      const botInfo = await TelegramStorageService.validateBotToken(botToken.trim());

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
router.get('/status', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        isConnected: true,
        botUsername: 'TeleGphotoBot',
        chatId: 'connected',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
