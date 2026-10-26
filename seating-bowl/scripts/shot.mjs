// Dev helper: render specific film times to PNG via the running dev server.
//   node scripts/shot.mjs <outDir> <t1> [t2 ...]   (env URL defaults to http://localhost:5173/)
import { loadPlaywright, chromiumArgs } from './pw.mjs';
const { chromium } = await loadPlaywright();
import { mkdirSync } from 'node:fs';
const [out = 'qa/shots', ...times] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const URL = process.env.URL || 'http://localhost:5173/';
const extra = process.env.QS || '';
const browser = await chromium.launch({ args: chromiumArgs() });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(process.env.DPR || 1) });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${URL}?record=1${extra}`);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 180000 });
const err = await page.evaluate(() => window.__error);
if (err) { console.log('INIT ERROR', err); process.exit(1); }
for (const t of times) {
  const t0 = Date.now();
  await page.evaluate((s) => window.__film.renderTime(Number(s)), t);
  await page.screenshot({ path: `${out}/t${String(t).padStart(5, '0')}.png` });
  console.log('t', t, `${Date.now() - t0}ms`);
}
await browser.close();
