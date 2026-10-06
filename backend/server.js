import app from './src/app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/database.js';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[RU VERSE Backend] Database connection established successfully.');

    const server = app.listen(PORT, () => {
      console.log(`[RU VERSE Backend] Server running in ${env.NODE_ENV} mode on port ${PORT}`);
      console.log(`[RU VERSE Backend] API Health endpoint: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`[RU VERSE Backend] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[RU VERSE Backend] Server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[RU VERSE Backend] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
