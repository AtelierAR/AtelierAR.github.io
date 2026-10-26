// Deterministic render: vite build -> preview server -> Playwright steps every
// frame through window.__film.renderTime(f / fps) -> PNG -> ffmpeg (H.264).
//
//   npm run record                  -> out/02_seating_bowl_1080p60.mp4
//   npm run record:4k               -> out/02_seating_bowl_2160p60.mp4
//   node scripts/record.mjs --from 20 --to 32 --keep   (partial, keep PNGs)
//   node scripts/record.mjs --scale 0.5 --fps 30       (quick 540p30 preview)
//
// Env: RECORD_SWIFTSHADER=1 forces software GL (slow, but works headless
// without a GPU). SKIP_BUILD=1 reuses dist/.
import { build, preview } from 'vite';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadPlaywright, chromiumArgs } from './pw.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
const scale = Number(opt('scale', 1));
const from = Number(opt('from', 0));
const to = opt('to', null);
const root = resolve(new URL('..', import.meta.url).pathname);
const fpsOpt = opt('fps', null);
const label = `${Math.round(1080 * scale)}p${fpsOpt || 60}`;
const frames = join(root, 'frames', label);
const outDir = join(root, 'out');
const outFile = opt('out', join(outDir, `02_seating_bowl_${label}.mp4`));

if (!process.env.SKIP_BUILD) await build({ root, logLevel: 'warn' });
const server = await preview({ root, preview: { port: 4173, strictPort: false }, logLevel: 'warn' });
const url = server.resolvedUrls.local[0];

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ args: chromiumArgs() });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.goto(`${url}?record=1&dpr=${scale}`);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 300000 });
const err = await page.evaluate(() => window.__error);
if (err) throw new Error(err);
const film = await page.evaluate(() => window.__film);
const fps = Number(fpsOpt || film.fps);
const f0 = Math.round(from * fps);
const f1 = Math.round((to === null ? film.duration : Number(to)) * fps);

if (existsSync(frames) && !flag('resume')) rmSync(frames, { recursive: true });
mkdirSync(frames, { recursive: true });
mkdirSync(outDir, { recursive: true });
console.log(`recording ${f1 - f0} frames @ ${1920 * scale}x${1080 * scale}, ${fps} fps -> ${frames}`);
const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  const file = join(frames, `f${String(f).padStart(5, '0')}.png`);
  if (flag('resume') && existsSync(file)) continue;
  await page.evaluate((s) => window.__film.renderTime(s), f / fps);
  await page.screenshot({ path: file, type: 'png' });
  if ((f - f0) % 60 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`  frame ${f}/${f1}  ${(el / Math.max(1, f - f0 + 1)).toFixed(2)} s/frame`);
  }
}
await browser.close();
await server.close();

const ff = spawnSync('ffmpeg', [
  '-y', '-framerate', String(fps), '-start_number', String(f0), '-i', join(frames, 'f%05d.png'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', scale === 2 ? '16' : '14', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-r', String(fps), outFile,
], { stdio: 'inherit' });
if (ff.status !== 0) process.exit(ff.status || 1);
if (!flag('keep')) rmSync(frames, { recursive: true });
console.log(`wrote ${outFile}`);
