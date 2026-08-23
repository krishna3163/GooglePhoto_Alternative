import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import type { AuthenticatedUser } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: payload.sub || payload.userId,
      username: payload.username,
      email: payload.email,
      sessionId: payload.sessionId,
      deviceId: payload.deviceId,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired. Please refresh.');
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token');
  }
}
