// Offline render of the soundtrack: the procedural crowd roar driven by the same envelope
// as the picture (src/audio/envelope.js), plus a few restrained cues — the p4 "TODAY" hum
// under Scene 1's dashed line, the board's power-down, soft ticks on the skin wipes, and the
// touchdown hit. Writes 48 kHz 16-bit stereo WAV.
import { writeFileSync, mkdirSync } from 'node:fs';
import { crowd, TOUCHDOWN_T } from '../src/audio/envelope.js';

const SR = 48000;

function biquad(type, f, q, sr = SR) {
  const w = (2 * Math.PI * f) / sr, a = Math.sin(w) / (2 * q), c = Math.cos(w);
  let b0, b1, b2;
  if (type === 'bp') [b0, b1, b2] = [a, 0, -a];
  else if (type === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

// deterministic noise
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

export function renderAudio(path, duration = 90) {
  const n = Math.round(duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  for (const [ch, out, seed] of [[0, L, 7], [1, R, 11]]) {
    const r = rng(seed);
    // crowd = several band-limited noise layers with slow, independent swells
    const bands = [
      { f: 280, q: 0.7, g: 1.0 },
      { f: 700, q: 0.8, g: 0.9 },
      { f: 1500, q: 0.9, g: 0.55 },
      { f: 3200, q: 1.0, g: 0.25 },
    ].map((b) => ({ ...b, fn: biquad('bp', b.f, b.q) }));
    const rumble = biquad('lp', 120, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const lvl = crowd(t);
      const w = r();
      let s = 0;
      for (const [k, b] of bands.entries()) {
        const swell = 0.75 + 0.25 * Math.sin(t * (0.37 + 0.11 * k) + seed + k);
        s += b.fn(w) * b.g * swell;
      }
      // the roar brightens and thickens with level
      s *= lvl * (0.6 + 0.6 * lvl);
      s += rumble(w) * 0.8 * lvl * lvl;
      out[i] = s * 2.3;
    }
  }
  const add = (t0, fn, len) => {
    const i0 = Math.round(t0 * SR);
    for (let i = 0; i < len * SR && i0 + i < n; i++) {
      const [a, b] = fn(i / SR);
      L[i0 + i] += a;
      R[i0 + i] += b;
    }
  };
  // Scene 1: TODAY hum under the dashed line (p4), 3.9–7.6 s, wobbling with the line
  add(3.9, (t) => {
    const env = Math.min(1, t / 0.6) * Math.min(1, (3.7 - t) / 0.8);
    const f = 55 + 3 * Math.sin(t * 5.1);
    const v = 0.11 * env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * 2 * f * t));
    return [v, v];
  }, 3.7);
  // board power-down (3.0–4.2 s): descending tone + crackle
  const crack = rng(3);
  add(3.0, (t) => {
    const env = Math.exp(-t * 2.2);
    const f = 220 * Math.exp(-t * 1.8);
    const v = 0.12 * env * Math.sin(2 * Math.PI * f * t) + (t < 0.6 ? 0.05 * crack() * (crack() > 0.6 ? 1 : 0) : 0);
    return [v, v * 0.95];
  }, 1.4);
  // drafting cues: soft ticks as each line completes, deep pulse on the extrude and the total
  for (const t0 of [9.8, 11.6, 13.0, 17.2, 20.9]) add(t0, (t) => {
    const v = 0.08 * Math.exp(-t * 30) * Math.sin(2 * Math.PI * 1800 * t);
    return [v, v];
  }, 0.2);
  for (const t0 of [14.1, 22.6]) add(t0, (t) => {
    const v = 0.16 * Math.exp(-t * 2.5) * Math.sin(2 * Math.PI * (48 + 10 * Math.exp(-t * 4)) * t);
    return [v, v];
  }, 1.6);
  // skin wipes (Scene 3): a sweep of fine clicks left → right
  for (const t0 of [27.5, 31.0, 35.8, 37.1]) {
    const cr = rng(Math.round(t0 * 10));
    add(t0, (t) => {
      const pan = Math.min(1, t / 0.7);
      const v = 0.22 * (cr() > 0.96 ? cr() : 0) * (1 - pan * 0.3);
      return [v * (1 - pan), v * pan];
    }, 0.75);
  }
  // the pass-through (≈55.6 s): an airy swell
  const air = rng(5), airF = biquad('bp', 2400, 0.6);
  add(53.4, (t) => {
    const env = Math.sin(Math.PI * Math.min(1, t / 3.6)) ** 2;
    const v = 0.18 * env * airF(air());
    return [v, v];
  }, 3.6);
  // a quiet harmonic bed under Scenes 2–5 (no music, just air and a low fifth)
  const bed = rng(19), bedF = biquad('lp', 900, 0.5);
  add(7.6, (t) => {
    const T = t + 7.6;
    const env = Math.min(1, t / 2) * Math.min(1, (66.2 - T) / 1.5) * (0.8 + 0.2 * Math.sin(T * 0.4));
    const v = env * (0.035 * Math.sin(2 * Math.PI * 82.4 * T) + 0.025 * Math.sin(2 * Math.PI * 123.6 * T + 0.3 * Math.sin(T * 0.7)) + 0.03 * bedF(bed()));
    return [v, v * 0.97];
  }, 58.6);
  // touchdown hit
  add(TOUCHDOWN_T, (t) => {
    const v = 0.5 * Math.exp(-t * 3.2) * Math.sin(2 * Math.PI * (42 + 30 * Math.exp(-t * 8)) * t);
    return [v, v];
  }, 2.5);

  // soft-clip + 16-bit PCM
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / (SR * 0.05), (n - i) / (SR * 0.6));
    for (const [c, ch] of [[0, L], [1, R]]) {
      const v = Math.tanh(ch[i] * 1.2) * 0.92 * fade;
      data.writeInt16LE(Math.round(v * 32767), i * 4 + c * 2);
    }
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
  return path;
}

if (process.argv[1].endsWith('render-audio.mjs')) {
  const out = new URL('../out/', import.meta.url).pathname;
  mkdirSync(out, { recursive: true });
  console.log('wrote', renderAudio(`${out}04_occupiable_videoboard_audio.wav`));
}
