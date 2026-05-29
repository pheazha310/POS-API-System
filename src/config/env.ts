import dotenv from "dotenv";

dotenv.config();

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT ?? "3306";
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  if (
    !dbHost ||
    !dbName ||
    !dbUser ||
    typeof dbPassword === "undefined"
  ) {
    return undefined;
  }

  return `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
};

const databaseUrl = buildDatabaseUrl();

const requiredEnvVars = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

if (!databaseUrl) {
  throw new Error(
    "Missing database configuration. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD."
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  databaseUrl,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};
