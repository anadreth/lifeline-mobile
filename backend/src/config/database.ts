import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000, // close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
      statement_timeout: 30000, // timeout queries after 30 seconds
      query_timeout: 30000,
    });

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info(`Database connected at ${result.rows[0].now}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
};