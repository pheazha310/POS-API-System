import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const fallbackPort = 3000;

  if (!value) {
    return fallbackPort;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackPort;
};

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getOptionalEnv = (key: string, fallback = ""): string => {
  const value = process.env[key];

  return value ?? fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  dbHost: getRequiredEnv("DB_HOST"),
  dbPort: parsePort(process.env.DB_PORT),
  dbConnectionLimit: parsePositiveInteger(process.env.DB_CONNECTION_LIMIT, 25),
  dbName: getRequiredEnv("DB_NAME"),
  dbUser: getRequiredEnv("DB_USER"),
  dbPassword: getOptionalEnv("DB_PASSWORD"),
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: getOptionalEnv("JWT_ACCESS_SECRET", "fallback_secret"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
} as const;
