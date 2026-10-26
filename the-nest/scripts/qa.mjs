// Render stills at given times:  npm run qa -- 4.5 11.9 30   (or --every 2)
import fs from 'node:fs';
import path from 'node:path';
import { open, ROOT } from './server.mjs';

const args = process.argv.slice(2);
const dev = args.includes('--dev');
const outDir = path.join(ROOT, 'qa', 'frames');
fs.mkdirSync(outDir, { recursive: true });
const still = args.find((a) => a.startsWith('--still='))?.split('=')[1];
const { page, info, close } = await open({ dev, query: still ? `record=1&still=${still}` : 'record=1' });
let times = args.filter((a) => /^\d/.test(a)).map(Number);
const ev = args.indexOf('--every');
if (ev >= 0) {
  const step = Number(args[ev + 1]);
  times = [];
  for (let t = 0.5; t < info.duration; t += step) times.push(+t.toFixed(2));
}
for (const t of times) {
  const f = Math.round(t * info.fps);
  const t0 = Date.now();
  await page.evaluate((i) => window.__nest.frame(i), f);
  const file = path.join(outDir, `${still ? still + '_' : ''}t${t.toFixed(2).padStart(6, '0')}.png`);
  await page.screenshot({ path: file });
  console.log(file, `${Date.now() - t0} ms`);
}
await close();
