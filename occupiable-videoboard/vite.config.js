import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'esnext', outDir: 'dist', chunkSizeWarningLimit: 2000 },
  esbuild: { target: 'esnext' },
  server: { host: '127.0.0.1', port: 5173 },
});
