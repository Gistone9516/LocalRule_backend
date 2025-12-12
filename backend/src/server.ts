import { createApp } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';

const app = createApp();

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      // eslint-disable-next-line no-console
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await disconnectDatabase();
        // eslint-disable-next-line no-console
        console.log('Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
