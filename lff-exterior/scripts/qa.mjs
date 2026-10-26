// Arrival QA: renders each arrival camera (data.js ARRIVALS[].cam) with the rasterized deck
// page overlaid at 50 % and side by side, into ./qa/. Needs `npm run dev` running.
//   node scripts/qa.mjs [26 27 28 29] [--t=60]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2);
const pages = args.filter((a) => /^\d+$/.test(a)).map(Number);
const tArg = (args.find((a) => a.startsWith('--t=')) || '--t=6').slice(4);
const base = (args.find((a) => a.startsWith('--url=')) || '--url=http://127.0.0.1:5173/').slice(6);
fs.mkdirSync('qa', { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
for (const pg of pages.length ? pages : [26, 27, 28, 29]) {
  for (const mode of ['overlay', 'render']) {
    const q = `?record=1&t=${tArg}&qa=${pg}${mode === 'render' ? '&noref' : ''}`;
    await page.goto(base + q);
    await page.waitForFunction(() => document.body.dataset.ready === '1' || document.body.dataset.error, null, { timeout: 300000 });
    await page.evaluate((t) => { window.__lff.renderAt(t); window.__lff.renderAt(t); }, Number(tArg));
    await page.screenshot({ path: `qa/p${pg}_${mode}.png` });
  }
  // side by side: reference | render
  try {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `reference/pages/p-0${pg}.png`, '-i', `qa/p${pg}_render.png`,
      '-filter_complex', '[0]scale=960:540[a];[1]scale=960:540[b];[a][b]hstack', `qa/p${pg}_compare.jpg`]);
  } catch (e) { console.log('ffmpeg compare failed', e.message); }
  try { execFileSync('python3', ['-I', 'scripts/qa_edges.py', String(pg)]); } catch (e) { console.log('edges failed', e.message); }
  console.log('qa', pg);
}
await browser.close();
