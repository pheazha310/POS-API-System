import dotenv from "dotenv";

dotenv.config();

const getNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: getNumberEnv(process.env.PORT, 3000),
} as const;
