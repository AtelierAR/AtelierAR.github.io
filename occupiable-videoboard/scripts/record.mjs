// npm run record            → out/04_occupiable_videoboard_1080p60.mp4
// npm run record -- --4k    → out/04_occupiable_videoboard_2160p60.mp4 (same page, DPR 2)
// Options: --fps 60 · --from 0 --to 90 (seconds) · --workers N (parallel browsers) · --msaa 0|4
//          --quality high|low · --keep (keep the JPEG frames) · --frames-only
// Frames are captured from ?record=1 on a manual clock (window.__renderAt), written to
// out/frames_<res>/, and encoded with ffmpeg together with the offline soundtrack.
// Re-running resumes: frames already on disk are skipped.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { loadPlaywright, CHROME_ARGS } from './pw.mjs';
import { startServer } from './serve.mjs';
import { renderAudio } from './render-audio.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const has = (k) => args.includes(`--${k}`);
const FOURK = has('4k');
const FPS = Number(opt('fps', 60));
const FROM = Number(opt('from', 0));
const TO = Number(opt('to', 90));
const WORKERS = Number(opt('workers', 1));
const QUALITY = opt('quality', 'high');
// MSAA off by default for the capture (SMAA stays on; the 4K pass is effectively 2× SSAA)
const MSAA = Number(opt('msaa', 0));
const DPR = FOURK ? 2 : 1;
const tag = FOURK ? '2160p60' : '1080p60';
const OUT = new URL('../out/', import.meta.url).pathname;
const FRAMES = `${OUT}frames_${tag}/`;
mkdirSync(FRAMES, { recursive: true });

const first = Math.round(FROM * FPS);
const last = Math.round(TO * FPS) - 1;
const all = [];
for (let f = first; f <= last; f++) all.push(f);
const name = (f) => `${FRAMES}f${String(f).padStart(5, '0')}.jpg`;
const todo = all.filter((f) => !existsSync(name(f)) || statSync(name(f)).size === 0);
console.log(`[record] ${tag} · ${all.length} frames (${todo.length} to render) · ${WORKERS} worker(s) · quality ${QUALITY}`);

const { chromium } = await loadPlaywright();
const server = await startServer(5200 + (FOURK ? 1 : 0));
const t0 = Date.now();
let done = 0;

async function worker(frames, id) {
  const browser = await chromium.launch({ args: CHROME_ARGS });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DPR });
  page.on('pageerror', (e) => {
    console.error(`[worker ${id}] page error:`, e.message);
    process.exit(1);
  });
  await page.goto(`${server.url}/?record=1&q=${QUALITY}&msaa=${MSAA}&aohalf=1`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 600000 });
  for (const f of frames) {
    await page.evaluate((t) => window.__renderAt(t), f / FPS);
    await page.screenshot({ path: name(f), type: 'jpeg', quality: 95 });
    done++;
    if (done % 30 === 0 || done === todo.length) {
      const el = (Date.now() - t0) / 1000;
      const eta = (el / done) * (todo.length - done);
      console.log(`[record] ${done}/${todo.length} · ${(el / done).toFixed(2)} s/frame · eta ${(eta / 60).toFixed(1)} min`);
    }
  }
  await browser.close();
}

// contiguous chunks per worker keep each browser's caches warm
const chunks = Array.from({ length: WORKERS }, () => []);
todo.forEach((f, i) => chunks[Math.min(WORKERS - 1, Math.floor((i * WORKERS) / Math.max(1, todo.length)))].push(f));
await Promise.all(chunks.map((c, i) => (c.length ? worker(c, i) : null)));
await server.close();

if (has('frames-only')) process.exit(0);

const missing = all.filter((f) => !existsSync(name(f)));
if (missing.length) {
  console.error(`[record] ${missing.length} frames missing, not encoding`);
  process.exit(1);
}
const wav = renderAudio(`${OUT}04_occupiable_videoboard_audio.wav`, TO);
const mp4 = `${OUT}04_occupiable_videoboard_${tag}.mp4`;
const ff = spawnSync(
  'ffmpeg',
  [
    '-y', '-framerate', String(FPS), '-start_number', String(first), '-i', `${FRAMES}f%05d.jpg`,
    '-ss', String(FROM), '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', FOURK ? '18' : '16', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', mp4,
  ],
  { stdio: 'inherit' },
);
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log('[record] wrote', mp4, execFileSync('du', ['-h', mp4]).toString().split('\t')[0]);
if (!has('keep')) rmSync(FRAMES, { recursive: true, force: true });
else console.log('[record] frames kept in', FRAMES, readdirSync(FRAMES).length);
