import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn('Database connection failed. Starting with fallback data only.');
    console.warn(error);
  }

  app.listen(env.port, () => {
    console.log(`POS API listening at http://localhost:${env.port}`);
  });
};

void startServer().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
