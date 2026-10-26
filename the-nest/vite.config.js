import { defineConfig } from 'vite';

// Relative base so the built film runs from any folder (e.g. GitHub Pages /the-nest/dist/).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1600 },
});
