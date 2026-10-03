import 'dotenv/config';
import { createApp } from './app.js';
import { closePool } from './db.js';
const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido.');
const server = createApp().listen(port, () => console.log(`API Aromas By Pikin en http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => { await closePool(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
