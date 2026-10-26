// Starts a Vite server for the recorder / QA scripts (dev server: no build step needed).
import { createServer } from 'vite';

export async function startServer(port = 5199) {
  const server = await createServer({ server: { port, host: '127.0.0.1', strictPort: false, hmr: false }, logLevel: 'error' });
  await server.listen();
  const url = server.resolvedUrls.local[0].replace(/\/$/, '');
  return { url, close: () => server.close() };
}
