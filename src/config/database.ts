import mysql, {
  type FieldPacket,
  type Pool,
  type PoolConnection,
  type QueryResult,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise';

import { env } from './env';

let pool: Pool | null = null;

const createPool = (): Pool =>
  mysql.createPool({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });

export const getPool = (): Pool => {
  if (!pool) {
    pool = createPool();
  }

  return pool;
};

export const connectDatabase = async (): Promise<void> => {
  const activePool = getPool();
  const connection = await activePool.getConnection();

  try {
    await connection.ping();
    console.log(`Database connected: ${env.dbHost}:${env.dbPort}/${env.dbName}`);
  } finally {
    connection.release();
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export const getConnection = async (): Promise<PoolConnection> => getPool().getConnection();

export const query = async <T extends RowDataPacket[] | RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params: unknown[] = [],
): Promise<[T, FieldPacket[]]> => {
  return getPool().query<T & QueryResult>(sql, params);
};
