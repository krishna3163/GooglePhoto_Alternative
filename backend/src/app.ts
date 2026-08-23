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
      // Allow requests with no origin (like mobile apps, curl, health checks, UptimeRobot)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for public API endpoints
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root Status & Health Check endpoints (for UptimeRobot, Render, & Monitoring)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'TeleGphoto Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

app.get('/', healthHandler);
app.head('/', healthHandler);
app.get('/health', healthHandler);
app.head('/health', healthHandler);
app.get('/ping', healthHandler);
app.get('/api/v1/health', healthHandler);

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
