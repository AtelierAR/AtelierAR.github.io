// Renderiza un PNG del cuadro más fuerte de cada escena de "Aficion".
// Uso: npm run stills   (requiere Node ≥ 22.18 por los imports .ts)
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {STILLS_AFICION, s} from '../src/constants/brand.ts';

const raiz = path.resolve(import.meta.dirname, '..');
const salida = path.join(raiz, 'render', 'stills', 'aficion');
const browserExecutable = process.env.REMOTION_BROWSER ?? null;

const serveUrl = await bundle({entryPoint: path.join(raiz, 'src', 'index.ts')});
const composition = await selectComposition({serveUrl, id: 'Aficion', browserExecutable});

for (const [escena, segundos] of Object.entries(STILLS_AFICION)) {
  const frame = s(segundos);
  const archivo = path.join(salida, `${escena}.png`);
  await renderStill({composition, serveUrl, frame, output: archivo, browserExecutable});
  console.log(`✔ ${escena} · frame ${frame} → ${path.relative(raiz, archivo)}`);
}
