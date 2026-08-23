import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/database.js';

async function bootstrap() {
  try {
    console.log('Starting TeleGphoto Backend Service...');
    
    // Connect to database if configured
    await connectDatabase().catch((err) => {
      console.warn('Database initialization warning:', err?.message || err);
    });

    const port = env.PORT || 4000;
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✓ TeleGphoto API Server running on port ${port} [${env.NODE_ENV}]`);
      console.log(`✓ Health endpoint: http://0.0.0.0:${port}/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await closeDatabase();
        console.log('Server terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
