// Shared helpers for the QA and record scripts: a Vite server (fresh production build + preview,
// or the dev server with { dev: true }) and headless Chromium pages sized 1920×1080 × scale,
// ready for window.__nest.
import { build, preview, createServer } from 'vite';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'];

export async function startServer({ dev = false } = {}) {
  let server;
  if (dev) {
    server = await createServer({ root: ROOT, server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
    await server.listen();
  } else {
    await build({ root: ROOT, logLevel: 'error' });
    server = await preview({ root: ROOT, preview: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
  }
  return {
    url: server.resolvedUrls.local[0],
    close: () => (server.close ? server.close() : server.httpServer.close()),
  };
}

// On a machine with a GPU, pass --gpu to the scripts to skip SwiftShader.
export async function openPage(url, { scale = 1, query = 'record=1', gpu = false } = {}) {
  const browser = await chromium.launch({ args: gpu ? ['--ignore-gpu-blocklist', '--disable-gpu-vsync'] : GL_ARGS });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${url}?${query}`);
  await page.waitForFunction(() => window.__nest && window.__nest.ready, null, { timeout: 300000 });
  const info = await page.evaluate(() => ({ frames: window.__nest.frames, fps: window.__nest.fps, duration: window.__nest.duration }));
  return { page, info, browser };
}

export async function open({ dev = false, ...opts } = {}) {
  const server = await startServer({ dev });
  const { page, info, browser } = await openPage(server.url, opts);
  return {
    page,
    info,
    async close() {
      await browser.close();
      await server.close();
    },
  };
}
