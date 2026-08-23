import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { validateRequest } from '../middleware/validation.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(64),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  deviceName: z.string().optional(),
  deviceId: z.string().optional(),
  initialVault: z.object({
    name: z.string().optional(),
    encryptedVaultKey: z.string().optional(),
    wrappedWithRecovery: z.string().nullish(),
    salt: z.string().optional(),
    keyVersion: z.number().optional(),
  }).optional(),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Please provide username or email'),
  password: z.string().min(1, 'Please provide your password'),
  deviceName: z.string().optional(),
  deviceId: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  newEncryptedVaultKeys: z.array(
    z.object({
      vaultId: z.string(),
      encryptedVaultKey: z.string(),
      salt: z.string(),
    })
  ),
});

// POST /api/v1/auth/register
router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  async (req, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          defaultVault: result.defaultVault,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  async (req, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          vaults: result.vaults,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
      });
      return;
    }

    const tokens = await AuthService.refreshSession(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.sessionId) {
      await AuthService.logout(req.user.sessionId);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// POST /api/v1/auth/change-password
router.post(
  '/change-password',
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await AuthService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword,
        req.body.newEncryptedVaultKeys
      );
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
