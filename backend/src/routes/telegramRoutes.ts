import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
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
    const token = env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = env.TELEGRAM_DEFAULT_CHAT_ID;

    if (!token) {
      res.json({
        success: true,
        data: {
          isConnected: false,
          botUsername: null,
          chatId: null,
        },
      });
      return;
    }

    const botInfo = await TelegramStorageService.validateBotToken(token);
    res.json({
      success: true,
      data: {
        isConnected: true,
        botUsername: botInfo.username,
        chatId: defaultChatId || 'configured',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
