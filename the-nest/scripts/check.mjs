// Copy rules from the brief, checked without a browser:
//   every sentence of the p9 paragraph is fully legible ≥ 0.4 s per word,
//   no line exceeds 60 characters, at most two lines per chunk, chunks never overlap.
import { paragraphSchedule, FADE_IN } from '../src/paragraph.js';
import { NEST, minSeconds, words } from '../src/data.js';

let ok = true;
const fail = (m) => ((ok = false), console.log('FAIL', m));
const chunks = paragraphSchedule();
NEST.paragraph.forEach((s, i) => {
  const legible = chunks.filter((c) => c.sentence === i).reduce((n, c) => n + c.legible, 0);
  const need = minSeconds(s);
  console.log(`sentence ${i + 1}: ${words(s)} words, legible ${legible.toFixed(2)} s (min ${need.toFixed(2)} s)`);
  if (legible + 1e-6 < need) fail(`sentence ${i + 1} on screen too briefly`);
});
for (const [k, c] of chunks.entries()) {
  if (c.lines.length > 2) fail(`chunk ${k} has ${c.lines.length} lines`);
  for (const l of c.lines) if (l.length > 60) fail(`line over 60 chars: "${l}"`);
  const next = chunks[k + 1];
  if (next && next.at + 0.02 < c.at + c.dur - 1e-6) fail(`chunk ${k} overlaps the next`);
}
const last = chunks[chunks.length - 1];
console.log(`paragraph ${chunks[0].at.toFixed(2)} → ${(last.at + last.dur).toFixed(2)} s, ${chunks.length} chunks`);
console.log(ok ? 'copy rules: OK' : 'copy rules: FAILED');
process.exit(ok ? 0 : 1);
