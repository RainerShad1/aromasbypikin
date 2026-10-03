import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  server: { port: 5173, strictPort: true },
  build: { rollupOptions: { input: {
    root: fileURLToPath(new URL('./index.html', import.meta.url)),
    inicio: fileURLToPath(new URL('./inicio/index.html', import.meta.url)),
    catalogo: fileURLToPath(new URL('./catalogo/index.html', import.meta.url)),
  } } },
});
