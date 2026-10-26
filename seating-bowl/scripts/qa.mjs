// QA renders (dev server, so reference/pages/ is reachable):
//  - qa/fan_pNN_overlay.jpg : scene-9 camera hold with the deck render at 50%
//  - qa/fan_pNN_side.jpg    : render | reference side by side
//  - qa/contact_sheet.jpg   : keyframes from every scene
// Requires `npm run prep` (rasterized pages) and ImageMagick for the sheets.
import { createServer } from 'vite';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadPlaywright, chromiumArgs } from './pw.mjs';
import { VIEWS } from '../src/scenes/s9_seat.js';

const root = resolve(new URL('..', import.meta.url).pathname);
const qa = join(root, 'qa');
mkdirSync(qa, { recursive: true });
const server = await createServer({ root, logLevel: 'warn', server: { port: 5199, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ args: chromiumArgs() });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('[page]', e.message));

async function open(qs) {
  await page.goto(`${url}?record=1${qs}`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 300000 });
}
const S9 = 86;
const has = (cmd) => spawnSync('which', [cmd]).status === 0;
for (const v of VIEWS) {
  const t = S9 + (v.t[0] + v.t[1]) / 2;
  const pg = String(v.page).padStart(3, '0');
  await open(`&qa=${v.page}`);
  await page.evaluate((s) => window.__film.renderTime(s), t);
  await page.screenshot({ path: join(qa, `fan_p${pg}_overlay.jpg`), type: 'jpeg', quality: 86 });
  await open('');
  await page.evaluate((s) => window.__film.renderTime(s), t);
  const raw = join(qa, `fan_p${pg}_render.jpg`);
  await page.screenshot({ path: raw, type: 'jpeg', quality: 86 });
  if (has('montage')) {
    spawnSync('montage', [raw, join(root, 'reference/pages', `p-${pg}.png`), '-tile', '2x1', '-geometry', '960x540+4+4', '-quality', '86', join(qa, `fan_p${pg}_side.jpg`)]);
  }
  console.log('qa', v.page, v.label);
}
// contact sheet: three frames per scene
await open('');
const film = await page.evaluate(() => window.__film);
const shots = [];
for (const s of film.scenes) {
  for (const k of [0.25, 0.6, 0.92]) {
    const t = s.start + (s.end - s.start) * k;
    const f = join(qa, `key_${String(s.id)}_${k}.jpg`);
    await page.evaluate((x) => window.__film.renderTime(x), t);
    await page.screenshot({ path: f, type: 'jpeg', quality: 86 });
    shots.push(f);
  }
}
if (has('montage')) {
  spawnSync('montage', [...shots, '-tile', '3x', '-geometry', '640x360+3+3', '-quality', '86', join(qa, 'contact_sheet.jpg')]);
  for (const f of shots) rmSync(f);
}
await browser.close();
await server.close();
console.log('qa written to', qa);
