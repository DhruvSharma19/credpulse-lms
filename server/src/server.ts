import app from './app';
import { ENV } from './config/env.config';
import { disconnectDatabase } from './config/database.config';

// Server bootstrapping for local/standalone execution
const startServer = async () => {
  const server = app.listen(ENV.PORT, () => {
    if (ENV.NODE_ENV !== 'production') {
      console.log(`LMS Server running on port ${ENV.PORT}`);
    }
  });

  const handleShutdown = async (_signal: string) => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

export { app };
