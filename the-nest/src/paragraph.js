import { NEST, minSeconds } from './data.js';

// Schedule for the p9 paragraph: each sentence wrapped to ≤ 60 characters per line, shown two
// lines at a time, chunks never overlapping (so ≤ 3 lines are ever on screen), and every sentence
// fully legible for ≥ 0.4 s/word. Pure, so `npm run check` can verify it without a browser.
export const SLOTS = [37.6, 47.3, 53.95, 60.2, 65.45]; // sentence starts (s)
export const FADE_IN = 0.35;
export const FADE_OUT = 0.3;

export function wrap(text, max = 60) {
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max && line) {
      out.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

// Lines of near-equal length (no orphans), still ≤ max characters.
export function wrapBalanced(text, max = 60) {
  const n = wrap(text, max).length;
  for (let target = Math.ceil(text.length / n); target <= max; target++) {
    const lines = wrap(text, target);
    if (lines.length <= n) return lines;
  }
  return wrap(text, max);
}

const MARGIN = 0.12; // the 0.02 s fade-in delay plus rounding, so the rule holds strictly

export function paragraphSchedule() {
  const chunks = [];
  let prevEnd = 0;
  NEST.paragraph.forEach((sentence, si) => {
    const lines = wrapBalanced(sentence, 60);
    const groups = [];
    for (let i = 0; i < lines.length; i += 2) groups.push(lines.slice(i, i + 2));
    const need = minSeconds(sentence) + groups.length * (FADE_IN + FADE_OUT + MARGIN);
    // a sentence starts at its slot, or later if the previous one needed longer
    const start = Math.max(SLOTS[si], prevEnd);
    const end = si + 1 < SLOTS.length ? Math.max(SLOTS[si + 1], start + need) : start + need + 0.3;
    prevEnd = end;
    const total = groups.reduce((n, c) => n + c.join(' ').length, 0);
    let at = start;
    for (const g of groups) {
      const dur = ((end - start) * g.join(' ').length) / total;
      chunks.push({ sentence: si, lines: g, at, dur, legible: dur - FADE_IN - FADE_OUT - 0.02 });
      at += dur;
    }
  });
  return chunks;
}
