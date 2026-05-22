import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const fallbackPort = 3000;

  if (!value) {
    return fallbackPort;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackPort;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  dbHost: getRequiredEnv('DB_HOST'),
  dbPort: parsePort(process.env.DB_PORT),
  dbName: getRequiredEnv('DB_NAME'),
  dbUser: getRequiredEnv('DB_USER'),
  dbPassword: getRequiredEnv('DB_PASSWORD'),
  databaseUrl: process.env.DATABASE_URL,
} as const;
