// One deterministic crowd envelope drives the touchdown on both halves of the split
// (lights, figures, waveform) and the procedural roar written by scripts/render-audio.mjs.
// Pure function of time so recording and live playback agree frame for frame.

export const TOUCHDOWN_T = 70.4; // s — the score in Scene 6 (1:06–1:22)

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Small, cheap pseudo-random flutter (sum of incommensurate sines).
function flutter(t) {
  return (
    0.5 * Math.sin(t * 7.3) * Math.sin(t * 2.1 + 1.3) +
    0.3 * Math.sin(t * 13.7 + 0.4) +
    0.2 * Math.sin(t * 23.1 + 2.2)
  );
}

// Crowd level 0..1.
export function crowd(t) {
  let v = 0;
  // Scene 1: a quiet house at night
  v += 0.12 * (1 - smooth(6.5, 8.5, t)) * smooth(0, 1.2, t);
  // Scene 5–6: murmur builds through the pass-through into the drive
  v += 0.18 * smooth(60, 66, t) * (1 - smooth(82, 88, t));
  v += 0.22 * smooth(66, TOUCHDOWN_T - 0.2, t) * (1 - smooth(TOUCHDOWN_T, TOUCHDOWN_T + 0.1, t));
  // the score
  const hit = smooth(TOUCHDOWN_T - 0.05, TOUCHDOWN_T + 0.25, t) * (1 - smooth(TOUCHDOWN_T + 6.5, 84, t));
  v += 0.62 * hit;
  v += 0.06 * flutter(t) * smooth(64, 67, t) * (1 - smooth(83, 86, t));
  return Math.min(1, Math.max(0, v));
}

// "Energy" for the visuals: the crowd level plus a sharp transient at the score.
export function energy(t) {
  const burst = t >= TOUCHDOWN_T ? Math.exp(-(t - TOUCHDOWN_T) * 1.6) : 0;
  return Math.min(1.4, crowd(t) + 0.6 * burst);
}

// 0 → the dashed TODAY line, 1 → the RENOVATED BOWL amplitude (p4).
export function amplitude(t) {
  return smooth(TOUCHDOWN_T - 0.1, TOUCHDOWN_T + 0.5, t);
}
