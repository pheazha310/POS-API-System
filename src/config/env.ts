import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    name: process.env.DB_NAME || "pos_db",
  },

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "fallback_secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
};