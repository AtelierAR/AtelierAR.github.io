import * as THREE from 'three';
import { ENERGY } from '../data.js';
import { C } from '../palette.js';
import { WAVE_TODAY, WAVE_RENOVATED, WAVE_DIVIDER, WAVE_LABELS, SECTION_LEFT, SECTION_RIGHT, pageToWorld } from '../ref.js';
import { to, EASE, clamp01 } from '../core/timeline.js';
import { layer, el, textBlock, typeOn, wordsIn, show, hide, scrim, wrapBalanced } from '../core/overlay.js';
import { lineMaterial, polyline, updatePolyline, resample, setWidth } from '../core/lines.js';
import { plate, placeOnScreen } from '../core/plates.js';

// Scene 1 — House of Energy (p4). The crowd is the power source: a flat dashed "today" line erupts
// into the renovated-bowl zigzag, whose vertices then settle onto the p34 long section.
//
// The camera is a near-orthographic 12° lens placed so that p4 page coordinates land on screen
// exactly (screen px = page × 0.96) and p34 section coordinates are true to its scale bar.

export const SECTION_CAMERA = (() => {
  const fov = 12;
  const heightFt = 1080 / 1.44; // 1 ft = 1.5 page units = 1.44 px
  const dist = heightFt / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const [tx, ty] = pageToWorld([1000, 562.5]); // page centre
  return { x: tx, y: ty, z: dist, tx, ty, tz: 0, fov, roll: 0 };
})();

const N = 220; // morph resolution per half
// The p34 section lands 250 page units lower than on its own slide so it clears the p4 headline
// block; Scene 2 offsets the bowl by the same amount.
export const SECTION_DROP = 250;
const BASE_Y = 805; // p4 waveform baseline (page units)
const W = (p) => [...pageToWorld(p), 0];
const sx = (x) => x * 0.96; // page → screen px

// Procedural crowd-roar envelope: a few incommensurate swells, so the zigzag breathes.
function roar(t, i) {
  const k = t + i * 0.17;
  return 1 + 0.1 * Math.sin(k * 2.3) + 0.06 * Math.sin(k * 5.1 + 1.3) + 0.04 * Math.sin(k * 9.7 + 0.4) + 0.025 * Math.sin(k * 17.3 + 2.1);
}

export function build(ctx, S) {
  const { camera, rig, tex } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  const cam = ctx.cam;
  Object.assign(rig, SECTION_CAMERA);

  // crowd plate (p4), duotoned midnight green at 25 %
  // the p4 photo already sits under a dark wash on the slide, so its tones are stretched first
  const crowd = plate(tex.p04_crowd, { duotone: 1, dark: '#02171a', light: '#a9dcd6', levels: [0.08, 0.5], opacity: 0 });
  cam.add(crowd);
  const crowdState = { o: 0, zoom: 1 };

  // lines
  const silver = lineMaterial({ color: '#d5dadc', width: 3.6, dashed: true, dash: 22 / 1.5, gap: 10 / 1.5, opacity: 0.95 });
  const green = lineMaterial({ color: C.line, width: 4.6, opacity: 1 });
  const divMat = lineMaterial({ color: '#ffffff', width: 2.2, dashed: true, dash: 2, gap: 4.7, opacity: 0.0 });
  const todayPts = WAVE_TODAY.map(W);
  const renoPts = WAVE_RENOVATED.map(W);
  const today = polyline(resample(todayPts, N), silver);
  const reno = polyline(resample(renoPts, N), green);
  const divider = polyline([W([WAVE_DIVIDER.x, WAVE_DIVIDER.y0]), W([WAVE_DIVIDER.x, WAVE_DIVIDER.y1])], divMat);
  root.add(divider);
  // the morphing lines outlive this scene: Scene 2 takes them over as the section cut
  ctx.section = new THREE.Group();
  ctx.scene.add(ctx.section);
  ctx.section.add(today, reno);
  ctx.section.userData = { today, reno, silver, green };

  const low = (p) => W([p[0], p[1] + SECTION_DROP]);
  const tgtLeft = resample(SECTION_LEFT.map(low), N);
  const tgtRight = resample(SECTION_RIGHT.map(low), N);
  const srcLeft = resample(todayPts, N);

  // --- timeline -------------------------------------------------------------------------------
  const st = { draw: 0, erupt: 0, morph: 0, div: 0, dashGap: 1, lineColor: 0 };
  to(st, 0.6, 3.4, { draw: 1 }, 'power1.inOut');
  to(st, 3.3, 0.6, { div: 1 }, EASE.type);
  to(st, 4.0, 1.1, { erupt: 1 }, 'expo.out');
  to(crowdState, 4.2, 2.2, { o: 0.25 }, 'power2.out');
  to(crowdState, 4.2, 8.4, { zoom: 1.05 }, 'power1.inOut');
  to(st, 9.7, 0.5, { div: 0 }, 'power2.in');
  to(st, 10.0, 2.2, { morph: 1 }, EASE.camera);
  to(st, 10.0, 1.6, { dashGap: 0, lineColor: 1 }, 'power2.inOut');
  to(crowdState, 10.4, 2.0, { o: 0 }, 'power2.inOut');

  // --- type ------------------------------------------------------------------------------------
  const L = layer('energy');
  const sc = scrim(L, {
    left: '0',
    top: '0',
    width: '1500px',
    height: '520px',
    background: 'radial-gradient(120% 100% at 10% 20%, rgba(2,18,20,0.72), rgba(2,18,20,0) 70%)',
  });
  show(sc, 4.4, 1.2, {}, 'power2.out');

  const lbl = { fontSize: '21px', fontWeight: '800', letterSpacing: '0.12em', color: '#c9d0d2' };
  const tToday = textBlock(L, ENERGY.today, { ...lbl, left: `${sx(WAVE_LABELS.today[0])}px`, top: `${sx(WAVE_LABELS.today[1]) - 13}px` });
  typeOn(tToday, 1.0, { duration: 0.8, per: 0.05 });
  const tReno = textBlock(L, ENERGY.renovated, { ...lbl, color: '#5fcf93', left: `${sx(WAVE_LABELS.renovated[0])}px`, top: `${sx(WAVE_LABELS.renovated[1]) - 13}px` });
  typeOn(tReno, 4.7, { duration: 0.8, per: 0.04 });
  hide(tToday, 9.5, 0.5);
  hide(tReno, 9.5, 0.5);

  // p4: "HOUSE OF" light + "ENERGY" black, green square dot; "HIGHER AMPLITUDE" black
  const H = { fontSize: '101px', lineHeight: '1', letterSpacing: '0.01em', color: '#f4f6f6' };
  const w = { light: { fontWeight: '200' }, black: { fontWeight: '900', color: '#e4eceb' }, dot: { fontWeight: '900', color: C.line } };
  const h1 = textBlock(L, ENERGY.headline[0].map((r) => ({ t: r.t, style: w[r.w] })), { ...H, left: '93px', top: '170px' });
  const h2 = textBlock(L, ENERGY.headline[1].map((r) => ({ t: r.t, style: w[r.w] })), { ...H, left: '96px', top: '266px', letterSpacing: '0.035em' });
  typeOn(h1, 4.4, { duration: 1.0, per: 0.035, rise: 24 });
  typeOn(h2, 4.75, { duration: 1.0, per: 0.03, rise: 24 });

  // body: 22 px, ≤ 60 characters per line; each sentence stays ≥ 0.4 s/word
  const body = el('div', 'abs', L, { left: '99px', top: '402px', fontSize: '22px', lineHeight: '34px', fontWeight: '400', color: '#dfe6e6', opacity: '1' });
  const lines = wrapBalanced(ENERGY.body.join(' '), 60);
  lines.forEach((ln, i) => {
    const b = textBlock(body, ln, { position: 'relative', display: 'block' }, '');
    b.style.opacity = '0';
    wordsIn(b, 4.85 + i * 0.18, { duration: 0.9, per: 0.03 });
  });
  // second sentence (18 words) is fully legible from ≈ 5.95 s → needs ≥ 7.2 s → out at 13.25
  [h1, h2, body, sc].forEach((e) => hide(e, 13.25, 0.55));

  // --- per-frame -------------------------------------------------------------------------------
  const work = Array.from({ length: N }, () => [0, 0, 0]);
  const renoNow = renoPts.map((p) => [...p]);
  function update(t) {
    placeOnScreen(crowd, camera, { dist: 50 });
    crowd.userData.u.opacity.value = crowdState.o;
    crowd.userData.u.zoom.value = crowdState.zoom;
    crowd.visible = crowdState.o > 0.001;

    divMat.opacity = st.div * 0.75;
    divider.visible = st.div > 0.001;
    // "waveform scroll": the dash pattern drifts left → right (the one linear motion)
    silver.dashOffset = -t * 18; // ft/s
    silver.gapSize = Math.max(0.0001, (10 / 1.5) * st.dashGap);
    silver.color.set('#d5dadc').lerp(new THREE.Color(C.line), st.lineColor);
    setWidth(silver, 3.6 - 0.9 * st.lineColor);
    setWidth(green, 4.6 - 1.6 * clamp01(st.morph * 1.4));

    // Geometry is recomputed from t every frame (no state carried between frames), so any frame
    // renders the same whether reached by playing or by seeking. Scene 2 owns visibility and
    // opacity of the section lines after S.end.
    ctx.section.visible = true;

    // today line: drawn on left → right with tiny irregular undulations
    const und = WAVE_TODAY.map((p, i) => {
      const q = W(p);
      q[1] += (Math.sin(t * 1.7 + i * 1.9) * 1.6 + Math.sin(t * 3.9 + i * 0.7) * 0.9) * (1 - st.morph);
      return q;
    });
    const srcT = resample(und, N);
    // renovated zigzag: amplitude grows out of the baseline and breathes with the roar
    const base = pageToWorld([0, BASE_Y])[1];
    WAVE_RENOVATED.forEach((p, i) => {
      const q = W(p);
      const a = st.erupt * roar(t, i) * (i === 0 ? 0 : 1);
      renoNow[i][0] = q[0];
      renoNow[i][1] = base + (q[1] - base) * a;
    });
    const srcR = resample(renoNow, N);
    const m = st.morph;
    for (let half = 0; half < 2; half++) {
      const src = half ? srcR : srcT;
      const tgt = half ? tgtRight : tgtLeft;
      for (let i = 0; i < N; i++) {
        // the morph sweeps across the frame left → right
        const xn = (half * N + i) / (2 * N);
        const k = m <= 0 ? 0 : m >= 1 ? 1 : easeInOut(clamp01(m * 1.5 - xn * 0.5));
        work[i][0] = src[i][0] + (tgt[i][0] - src[i][0]) * k;
        work[i][1] = src[i][1] + (tgt[i][1] - src[i][1]) * k;
      }
      // reveal: today draws on; the zigzag is born at the divider
      let count = N;
      if (!half) count = Math.max(2, Math.round(N * (st.draw + (1 - st.draw) * m)));
      else count = st.erupt <= 0 ? 0 : Math.max(2, Math.round(N * Math.min(1, st.erupt * 1.6 + m)));
      const line = half ? reno : today;
      line.visible = count >= 2 && (half ? st.erupt > 0 : st.draw > 0);
      if (line.visible) updatePolyline(line, padTo(work.slice(0, count), N));
    }
  }

  return { root, layer: L, window: [S.start, S.end + 1.4], update };
}

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// Line2 keeps a fixed vertex count; collapse the unrevealed tail onto the head.
function padTo(pts, n) {
  const out = pts.map((p) => [...p]);
  while (out.length < n) out.push([...out[out.length - 1]]);
  return out;
}
