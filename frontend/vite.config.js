import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  server: { port: 5173, strictPort: true, proxy: { "/api": "http://localhost:3001" } },
  build: { rollupOptions: { input: {
    admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
    root: fileURLToPath(new URL('./index.html', import.meta.url)),
    inicio: fileURLToPath(new URL('./inicio/index.html', import.meta.url)),
    catalogo: fileURLToPath(new URL('./catalogo/index.html', import.meta.url)),
  } } },
});
