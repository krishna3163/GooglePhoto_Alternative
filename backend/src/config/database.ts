import pg, { type QueryResultRow } from 'pg';
import { env } from './env.js';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPgPool(): pg.Pool {
  if (poolInstance) return poolInstance;

  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  poolInstance = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  poolInstance.on('error', (err) => {
    console.warn('Unexpected PostgreSQL client error:', err.message);
  });

  return poolInstance;
}

export async function connectDatabase(): Promise<void> {
  if (!env.DATABASE_URL) {
    console.log('ℹ No DATABASE_URL configured.');
    return;
  }
  try {
    const pool = getPgPool();
    await pool.query('SELECT 1');
    console.log('✓ Successfully connected to PostgreSQL database.');
  } catch (err: any) {
    console.warn('⚠ Database connectivity warning:', err?.message || err);
  }
}

export async function queryPg<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<pg.QueryResult<T>> {
  const pool = getPgPool();
  return pool.query<T>(text, params);
}

export async function closeDatabase(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    console.log('PostgreSQL connection pool closed.');
  }
}
