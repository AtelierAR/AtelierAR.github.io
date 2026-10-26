// Deterministic frame capture.
//
//   npm run record                      → out/frames_1080/00000.png … then out/01_the_nest_1080p60.mp4
//   npm run record:4k                   → out/frames_2160/… then out/01_the_nest_2160p60.mp4
//
// Options:
//   --scale 2          device scale factor (2 → 3840×2160)
//   --workers 3        parallel browsers, each rendering a contiguous slice of frames
//   --from 0 --to 81   time range in seconds (default: whole film)
//   --no-encode        stop after writing PNGs
//   --gpu              use the host GPU instead of SwiftShader
//
// Already-written frames are skipped, so an interrupted run can simply be started again.
// Every frame is rendered by window.__nest.frame(i), which sets t = i / 60 exactly.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { startServer, openPage, ROOT } from './server.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
};
const has = (name) => argv.includes(`--${name}`);

const scale = Number(opt('scale', 1));
const workers = Math.max(1, Number(opt('workers', 1)));
const label = scale === 2 ? '2160' : '1080';
const framesDir = path.join(ROOT, 'out', `frames_${label}`);
fs.mkdirSync(framesDir, { recursive: true });

const server = await startServer();
const first = await openPage(server.url, { scale, gpu: has('gpu') });
const { fps, frames: total } = first.info;
const f0 = Math.round(Number(opt('from', 0)) * fps);
const f1 = Math.min(total, Math.round(Number(opt('to', total / fps)) * fps));
const todo = [];
for (let f = f0; f < f1; f++) if (!fs.existsSync(path.join(framesDir, `${String(f).padStart(5, '0')}.png`))) todo.push(f);
console.log(`${todo.length} of ${f1 - f0} frames to render at ${1920 * scale}×${1080 * scale}, ${workers} worker(s)`);

const pages = [first];
for (let w = 1; w < workers; w++) pages.push(await openPage(server.url, { scale, gpu: has('gpu') }));
const slice = Math.ceil(todo.length / workers);
const t0 = Date.now();
let done = 0;
await Promise.all(
  pages.map(async ({ page }, w) => {
    for (const f of todo.slice(w * slice, (w + 1) * slice)) {
      await page.evaluate((i) => window.__nest.frame(i), f);
      await page.screenshot({ path: path.join(framesDir, `${String(f).padStart(5, '0')}.png`) });
      done++;
      if (done % 30 === 0 || done === todo.length) {
        const s = (Date.now() - t0) / 1000;
        console.log(`${done}/${todo.length}  ${(s / done).toFixed(2)} s/frame  eta ${(((todo.length - done) * s) / done / 60).toFixed(1)} min`);
      }
    }
  }),
);
await Promise.all(pages.map((p) => p.browser.close()));
await server.close();

const complete = fs.readdirSync(framesDir).filter((f) => f.endsWith('.png')).length >= total;
if (has('no-encode') || !complete) {
  if (!complete) console.log('Not all frames present yet; skipping encode.');
  process.exit(0);
}
const out = path.join(ROOT, 'out', `01_the_nest_${label}p60.mp4`);
const args = ['-y', '-framerate', String(fps), '-i', path.join(framesDir, '%05d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out];
console.log('ffmpeg', args.join(' '));
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
