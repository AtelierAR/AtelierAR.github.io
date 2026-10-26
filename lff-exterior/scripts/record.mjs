// Offline recorder: steps the master clock frame by frame (?record=1), screenshots each
// frame with Playwright and encodes with ffmpeg.
//   npm run record                 -> out/03_exterior_1080p60.mp4
//   npm run record:4k              -> out/03_exterior_2160p60.mp4 (deviceScaleFactor 2)
// Options: --fps=60 --from=0 --to=85 (seconds) --step=1 (render every Nth frame, preview)
//          --url=http://127.0.0.1:5173/ (otherwise a Vite dev server is started) --no-encode
// Frames are kept in out/frames_<res>/ and skipped if present, so a run can be resumed.
import { createRequire } from 'module';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
const scale = Number(arg('scale', 1));
const fps = Number(arg('fps', 60));
const from = Number(arg('from', 0));
const to = Number(arg('to', 85));
const step = Number(arg('step', 1));
const res = scale === 2 ? '2160p' : scale === 1 ? '1080p' : `${Math.round(1080 * scale)}p`;
const tag = arg('tag', `${res}${Math.round(fps / step)}`);
const dir = path.join('out', `frames_${tag}`);
fs.mkdirSync(dir, { recursive: true });

let server = null;
let url = arg('url', null);
if (!url) {
  const { createServer } = await import('vite');
  server = await createServer({ server: { port: 5199, host: '127.0.0.1' }, logLevel: 'warn' });
  await server.listen();
  url = 'http://127.0.0.1:5199/';
}

const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url + '?record=1');
await page.waitForFunction(() => document.body.dataset.ready === '1' || document.body.dataset.error, null, { timeout: 600000 });
const err = await page.evaluate(() => document.body.dataset.error);
if (err) { console.error(err); process.exit(1); }

const total = Math.round(to * fps);
const first = Math.round(from * fps);
const t0 = Date.now();
let done = 0;
for (let i = first; i < total; i += step) {
  const file = path.join(dir, String(i).padStart(5, '0') + '.png');
  if (fs.existsSync(file)) continue;
  await page.evaluate(({ i, fps }) => {
    const L = window.__lff;
    L.renderAt(i / fps);
    const gl = L.ctx.engine.renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); // wait for the GPU
  }, { i, fps });
  await page.screenshot({ path: file, type: 'png' });
  done++;
  if (done % 25 === 0) {
    const per = (Date.now() - t0) / done / 1000;
    const left = Math.max(0, (total - i) / step) * per;
    console.log(`frame ${i}/${total}  ${per.toFixed(2)} s/frame  ~${(left / 60).toFixed(0)} min left`);
  }
}
await browser.close();
if (server) await server.close();

if (!flag('no-encode')) {
  const out = path.join('out', `03_exterior_${tag}.mp4`);
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps / step),
    '-pattern_type', 'glob', '-i', path.join(dir, '*.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', scale === 2 ? '18' : '16',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status === 0) console.log('wrote', out);
}
