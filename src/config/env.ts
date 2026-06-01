import dotenv from "dotenv";
dotenv.config();

const requireEnv = (key: string, defaultValue?: string) => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 5000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    name: process.env.DB_NAME || "pos_db",
  },

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "fallback_secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
};