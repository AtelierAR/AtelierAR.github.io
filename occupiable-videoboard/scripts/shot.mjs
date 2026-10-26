// Dev helper: grab frames at given times from a running dev/preview server.
// node scripts/shot.mjs http://127.0.0.1:5173 outdir 1.5 12 30 ...
import { loadPlaywright, CHROME_ARGS } from './pw.mjs';
const { chromium } = await loadPlaywright();
import { mkdirSync } from 'node:fs';

const [url, outDir, ...times] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: CHROME_ARGS });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(process.env.DPR || 1) });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.type(), m.text().slice(0, 400)); });
page.on('pageerror', (e) => {
  console.log('[pageerror]', e.message);
  process.exit(1);
});
await page.goto(`${url}/?record=1${process.env.Q ? `&q=${process.env.Q}` : ''}${process.env.MSAA ? `&msaa=${process.env.MSAA}` : ''}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });
for (const t of times) {
  const t0 = Date.now();
  await page.evaluate((t) => window.__renderAt(Number(t)), t);
  await page.screenshot({ path: `${outDir}/t${Number(t).toFixed(1).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
  console.log('t', t, `${Date.now() - t0} ms`, JSON.stringify(await page.evaluate(() => window.__debug?.())));
}
await browser.close();
