// QA overlays: renders the solved p63 / p70 / p71 views and blends each with its page from
// the deck (reference/pages, 200 DPI), marking the measured board corners (red) and the
// model's projected corners (green). Output: qa/<page>_overlay.jpg and qa/<page>_side.jpg.
// Needs ImageMagick (`convert`) and the rasterised pages (npm run rasterize).
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { loadPlaywright, CHROME_ARGS } from './pw.mjs';
import { startServer } from './serve.mjs';
import { solve, TARGETS } from './fit-cameras.mjs';
import { VOLUME_PARAMS } from '../src/geometry/volumeParams.js';
import { volumeVertices } from '../src/geometry/volume.js';

const OUT = new URL('../qa/', import.meta.url).pathname;
const PAGES = new URL('../reference/pages/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// time in the timeline whose state (skin, lighting) suits each comparison
const JOBS = [
  { name: 'p70', page: 'p-070.png', t: 29.0, note: 'Option 2 hybrid, p70 field-level frame' },
  { name: 'p71', page: 'p-071.png', t: 36.5, note: 'Option 2 hybrid, p71 field-level frame' },
  { name: 'p63', page: 'p-063.png', t: 41.0, near: 150, note: 'north volume lean + cantilever, p63 proposed panel (near-plane cutaway)' },
];

const { chromium } = await loadPlaywright();
const server = await startServer();
const browser = await chromium.launch({ args: CHROME_ARGS });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${server.url}/?record=1`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });

const W = (key, p) => {
  const o = key === 'north' ? [0, 62, -292] : [0, 66, 286];
  return new THREE.Vector3(p[0] + o[0], p[1] + o[1], (key === 'north' ? -p[2] : p[2]) + o[2]);
};

for (const job of JOBS) {
  const T = TARGETS[job.name];
  const cam = solve(job.name);
  const asp = T.aspect || 16 / 9;
  const ref = PAGES + job.page;
  if (!existsSync(ref)) throw new Error(`missing ${ref} — run npm run rasterize`);
  await page.evaluate(([t, p, l, f, n]) => window.__renderQA(t, p, l, f, n), [job.t, cam.pos, cam.look, cam.fov, job.near || 0.05]);
  const render = `${OUT}${job.name}_render.png`;
  await page.screenshot({ path: render });

  // reference cropped to the comparison frame, scaled to the render's frame
  const fw = Math.round(1080 * asp);
  const refCrop = `${OUT}.ref_${job.name}.png`;
  if (T.panel) {
    const [x0, y0, x1, y1] = T.panel;
    execFileSync('convert', [ref, '-crop', `${x1 - x0}x${y1 - y0}+${x0}+${y0}`, '+repage', '-resize', `${fw}x1080!`, refCrop]);
  } else execFileSync('convert', [ref, '-resize', '1920x1080!', refCrop]);
  const rendCrop = `${OUT}.rend_${job.name}.png`;
  execFileSync('convert', [render, '-gravity', 'center', '-crop', `${fw}x1080+0+0`, '+repage', rendCrop]);

  // corner markers
  const camera = new THREE.PerspectiveCamera(cam.fov, asp, 0.1, 1e4);
  camera.position.set(...cam.pos);
  camera.lookAt(...cam.look);
  camera.updateMatrixWorld();
  const v = volumeVertices(VOLUME_PARAMS[T.key]);
  const draw = [];
  T.corners.forEach((c, i) => {
    const q = W(T.key, v[c]).project(camera);
    const gx = (q.x * 0.5 + 0.5) * fw, gy = (-q.y * 0.5 + 0.5) * 1080;
    const rx = T.img[i][0] * fw, ry = T.img[i][1] * 1080;
    draw.push('-stroke', '#ff3b30', '-strokewidth', '3', '-fill', 'none', '-draw', `circle ${rx},${ry} ${rx + 9},${ry}`);
    draw.push('-stroke', '#3CCB5A', '-strokewidth', '3', '-fill', 'none', '-draw', `rectangle ${gx - 7},${gy - 7} ${gx + 7},${gy + 7}`);
  });
  const overlay = `${OUT}${job.name}_overlay.jpg`;
  execFileSync('convert', [refCrop, rendCrop, '-compose', 'blend', '-define', 'compose:args=50,50', '-composite', ...draw,
    '-fill', '#ffffff', '-undercolor', '#00000099', '-pointsize', '22', '-gravity', 'southwest', '-annotate', '+12+12',
    `${job.name}: ${job.note} · red = deck corners, green = model · corner RMS ${cam.rmsPx}px@1080`, '-quality', '88', overlay]);
  execFileSync('convert', [refCrop, rendCrop, '+append', '-resize', '2400x', '-quality', '85', `${OUT}${job.name}_side.jpg`]);
  execFileSync('rm', ['-f', refCrop, rendCrop, render]);
  console.log(job.name, JSON.stringify(cam), '→', overlay);
}
await browser.close();
await server.close();
