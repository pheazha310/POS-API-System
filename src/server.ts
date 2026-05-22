import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`POS API listening on port ${env.port}`);
  });
};

void startServer();
