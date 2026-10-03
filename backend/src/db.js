import pg from 'pg';
const { Pool } = pg;
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    const useTls = process.env.DATABASE_SSL !== 'false';
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
      ssl: useTls ? { rejectUnauthorized: true,
        ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } : {}) } : false,
    });
    pool.on('error', () => console.error('Error de conexión PostgreSQL.'));
  }
  return pool;
}
export async function closePool() { if (pool) await pool.end(); }
