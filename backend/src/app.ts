import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimit.js';

import authRoutes from './routes/authRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
const allowedOrigins = env.FRONTEND_URL.split(',').map((u) => u.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check endpoint (for Render & monitoring)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Apply API rate limiting
app.use('/api/v1', apiRateLimiter);

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/telegram', telegramRoutes);
app.use('/api/v1/vaults', vaultRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/albums', albumRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/migration', migrationRoutes);
app.use('/api/v1/devices', deviceRoutes);

// Catch-all 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
