import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/database.js';

async function bootstrap() {
  try {
    console.log('Starting TeleGphoto Backend Service...');
    
    // Connect to MongoDB Atlas
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`✓ TeleGphoto API Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`✓ Health endpoint: http://localhost:${env.PORT}/health`);
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
