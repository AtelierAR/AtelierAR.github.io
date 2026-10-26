/**
 * Renderiza a render/stills/ un PNG del cuadro más fuerte de cada escena
 * (definido en CUADRO_FUERTE de src/constants/brand.ts).
 *   npm run stills                 → todas las escenas
 *   npm run stills -- --escala=2   → stills a 3840×2160
 * Cualquier otro argumento se pasa tal cual a `remotion still`.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { CUADRO_FUERTE, ESCENAS, inicioEscena, seg } from '../src/constants/brand.ts';

const extra = process.argv.slice(2);
mkdirSync('render/stills', { recursive: true });

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

for (const e of ESCENAS) {
  const cuadro = seg(inicioEscena(e.id) + CUADRO_FUERTE[e.id]);
  const salida = `render/stills/${e.id.slice(-2)}_${slug(e.nombre)}.png`;
  console.log(`→ ${e.id} · ${e.nombre} · cuadro ${cuadro} → ${salida}`);
  const r = spawnSync('npx', ['remotion', 'still', 'Apertura', salida, `--frame=${cuadro}`, '--image-format=png', ...extra], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('Stills listos en render/stills/');
