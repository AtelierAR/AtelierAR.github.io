// Dev utility: render single frames to PNG.
//   node scripts/shot.mjs out.png "t=12" ["cam=..."] [--url=http://127.0.0.1:5173/]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
const base = urlArg ? urlArg.slice(6) : 'http://127.0.0.1:5173/';
const shots = args.filter((a) => !a.startsWith('--'));
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
for (let i = 0; i < shots.length; i += 2) {
  const out = shots[i], q = shots[i + 1] || '';
  const t0 = Date.now();
  await page.goto(base + '?record=1&' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1' || document.body.dataset.error, null, { timeout: 180000 });
  const err = await page.evaluate(() => document.body.dataset.error);
  if (err) { console.log('ERROR', err); continue; }
  const t = Number((q.match(/(?:^|&)t=([\d.]+)/) || [])[1] || 0);
  const t1 = Date.now();
  await page.evaluate((t) => window.__lff.renderAt(t), t);
  const t2 = Date.now();
  await page.evaluate((t) => window.__lff.renderAt(t), t);
  const t3 = Date.now();
  await page.screenshot({ path: out });
  console.log(out, `load ${t1 - t0}ms, render ${t2 - t1}ms / ${t3 - t2}ms, shot ${Date.now() - t3}ms`);
}
await browser.close();
