import { defineConfig } from 'vite';

// base './' so the built film can be served from any sub-path
// (e.g. GitHub Pages at /seating-bowl/dist/).
export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
