import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getPool } from './db.js';

export function createApp() {
  const app = express();
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_ORIGIN) {
    throw new Error('FRONTEND_ORIGIN es obligatorio en producción.');
  }
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin, methods: ['GET'], credentials: false }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'aromas-api' }));
  app.get('/api/ready', async (_req, res) => {
    const pool = getPool();
    if (!pool) return res.status(503).json({ status: 'not_ready', code: 'DATABASE_NOT_CONFIGURED' });
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready', code: 'DATABASE_UNAVAILABLE' });
    }
  });
  // Solo productos publicados. No existen rutas públicas para leer clientes o pedidos.
  app.get('/api/products', async (_req, res) => {
    const pool = getPool();
    if (!pool) return res.status(503).json({ code: 'DATABASE_NOT_CONFIGURED' });
    const { rows } = await pool.query(`SELECT id, slug, name, brand, description,
      family, volume_ml, price_cents, stock, image_url
      FROM aromas.products WHERE active = true ORDER BY name LIMIT 100`);
    res.json({ products: rows });
  });
  app.use((_req, res) => res.status(404).json({ code: 'NOT_FOUND' }));
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ code: 'INVALID_JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ code: 'PAYLOAD_TOO_LARGE' });
    console.error('Error de API:', err.code || 'INTERNAL_ERROR');
    res.status(500).json({ code: 'INTERNAL_ERROR' });
  });
  return app;
}
