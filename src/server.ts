import { app } from './app';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  app.listen(env.port, () => {
    console.log(`POS API listening at http://localhost:${env.port}`);
  });
};

void startServer();
