import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { getPool, closePool } from './db.js';
const directory = fileURLToPath(new URL('../../database/migrations/', import.meta.url));
const pool = getPool();
if (!pool) throw new Error('Completa DATABASE_URL en backend/.env antes de aplicar las migraciones.');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(41872001)');
  await client.query('CREATE SCHEMA IF NOT EXISTS aromas');
  await client.query('REVOKE ALL ON SCHEMA aromas FROM PUBLIC');
  await client.query(`CREATE TABLE IF NOT EXISTS aromas.schema_migrations (
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
  for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
    const sql = await readFile(`${directory}/${name}`, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const { rows } = await client.query('SELECT checksum FROM aromas.schema_migrations WHERE name = $1', [name]);
    if (rows.length) {
      if (rows[0].checksum !== checksum) throw new Error(`Migración aplicada modificada: ${name}. Crea otra migración.`);
      continue;
    }
    await client.query(sql);
    await client.query('INSERT INTO aromas.schema_migrations(name, checksum) VALUES ($1, $2)', [name, checksum]);
    console.log(`Aplicada: ${name}`);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('No se aplicaron cambios:', error.message);
  process.exitCode = 1;
} finally { client.release(); await closePool(); }
