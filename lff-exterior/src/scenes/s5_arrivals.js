// Scene 5 (0:56-1:12) — four arrivals. Each camera move ends on a frame matched to its deck
// rendering (p26-29, see ./qa), then leader lines and labels draw in as on the page.
// Between arrivals the camera rides one continuous orbit at a 120 m stand-off.
import * as THREE from 'three';
import { ARRIVALS, FT, LAYOUT } from '../data.js';
import { LeaderLabels } from '../overlay/overlay.js';
import { spline, camPose, ringPoint } from '../director.js';
import { orbit, ALL_CATS } from './common.js';
import { fitAnchors, LABEL_CAT } from './anchors.js';

const T0 = 56, T1 = 72, SLOT = 4, MOVE = 2.2;
const ORBIT_M = 120;
// scratch camera at an arrival pose (for ordering labels left to right)
const _pc = new THREE.PerspectiveCamera(35, 16 / 9, 1, 9000);
function poseCam(p) {
  _pc.fov = p.fov; _pc.position.copy(p.pos); _pc.lookAt(p.target);
  if (p.shiftX || p.shiftY) _pc.setViewOffset(1920, 1080, -(p.shiftX || 0) * 1920, -(p.shiftY || 0) * 1080, 1920, 1080); else _pc.clearViewOffset();
  _pc.updateProjectionMatrix(); _pc.updateMatrixWorld();
  return _pc;
}
const MIRROR_WING = { plaza: 'NW', vipEast: 'SE', altGA: 'SE', gaWest: 'SW' };

export async function build(ctx) {
  const { overlay: O, master: tl, director, MAT } = ctx;
  const S = ctx.state;

  // footprint half-extents incl. wing overhangs (m) for the orbit ring
  const halfX = 432 * FT, halfZ = Math.max(...LAYOUT.wings.map((w) => w.zEndOut)) * FT;
  const ring = (az, h) => { const p = ringPoint(az, ORBIT_M, halfX, halfZ); p.y = h; return p; };
  const azOf = (p) => THREE.MathUtils.radToDeg(Math.atan2(p.x, -p.z));

  // ---------------------------------------------------------------- state
  tl.set(S, { mirror: 1, crowd: 0, sunAz: 235, sunEl: 58 }, T0);
  tl.to(S, { boardOn: 0, duration: 1.4 }, T0 + 0.2);
  tl.to(S, { sunK: 0.45, envK: 1.4, duration: 1.2 }, T0); // bright overcast, like the deck renderings
  // arrive in clay (the deck frame), then each labelled material switches on with its label
  for (const c of ALL_CATS) tl.to(MAT.state[c], { mix: 0, fade: 1, duration: 1.4, ease: 'power1.inOut' }, T0 + 0.2);
  tl.to(S, { sunK: 1, envK: 1, duration: 1.0 }, T1 - 0.2);

  // ---------------------------------------------------------------- per arrival
  const keys = [];
  const prevEnd = orbit(-16, 450, 260, [0, 35, 40], 40, { shiftX: -0.1 }); // scene 4's last pose
  let prev = { pos: prevEnd.pos, target: prevEnd.target, fov: 40, shiftX: -0.1, shiftY: 0 };
  const K = (t, p) => ({ t, pos: p.pos.toArray(), target: p.target.toArray(), fov: p.fov, shiftX: p.shiftX || 0, shiftY: p.shiftY || 0 });

  ARRIVALS.forEach((arr, i) => {
    const t = T0 + i * SLOT;
    const pose = camPose(arr.cam);
    // continuous orbit: leave the previous frame up onto the ring, travel, settle into the next
    const a0 = azOf(prev.pos), a1 = azOf(pose.pos);
    let da = a1 - a0; if (i > 0 && da < 0) da += 360;
    const center = new THREE.Vector3(0, 28, 0);
    const mids = i === 0 ? [0.5] : [0.25, 0.5, 0.75];
    keys.push(K(t, prev));
    mids.forEach((m) => {
      const p = ring(a0 + da * m, i === 0 ? 120 : 46);
      const tgt = center.clone().lerp(i === 0 ? pose.target : center, 0.3);
      keys.push({ t: t + MOVE * m, pos: p.toArray(), target: tgt.toArray(), fov: (prev.fov + pose.fov) / 2, shiftX: 0, shiftY: (prev.shiftY + pose.shiftY) / 2 * 0.6 });
    });
    keys.push(K(t + MOVE, pose));
    // a slow push during the hold keeps the frame alive without leaving the match
    const hold = { ...pose, pos: pose.pos.clone().lerp(pose.target, 0.03) };
    keys.push(K(t + SLOT - 0.02, hold));
    prev = hold;

    // title like the deck ("PLAZA VIEW"), page reference chip, leader labels
    const sec = O.el('div', 'ov sec', O.root, arr.title);
    const chip = O.el('div', 'ov ref-chip', O.root, `Ref. p${arr.page}`);
    const fitted = fitAnchors(ctx, arr, pose);
    const miss = fitted.filter((l) => !l.fitted).map((l) => l.text);
    if (miss.length) console.warn(`[anchors] ${arr.id}: fallback for ${miss.join(', ')}`);
    const LL = new LeaderLabels(O, fitted, { groundBand: arr.groundBand });
    LL.setVisible(false);
    tl.set([sec, chip], { opacity: 0 }, 0);
    tl.fromTo(sec, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4 }, t + MOVE - 0.3);
    tl.to(chip, { opacity: 1, duration: 0.3 }, t + MOVE);
    tl.to([sec, chip], { opacity: 0, duration: 0.25 }, t + SLOT - 0.3);
    const items = LL.items;
    tl.set(items, { p: 0 }, 0);
    tl.to(items, { p: 1, duration: 0.6, ease: 'power2.out', stagger: 0.07 }, t + MOVE + 0.05);
    tl.to(items, { p: 0, duration: 0.25, ease: 'power1.in' }, t + SLOT - 0.32);
    tl.set(S, { mirrorWing: MIRROR_WING[arr.id] }, t + MOVE * 0.5);
    // material events, left to right with the labels
    const order = fitted.map((l, k) => ({ l, k, x: ctx.overlay.project(l.anchor, poseCam(pose)).x })).sort((a, b) => a.x - b.x);
    const seen = new Set();
    order.forEach(({ l }, n) => {
      for (const c of LABEL_CAT[l.text] || []) {
        if (seen.has(c)) continue;
        seen.add(c);
        const at = t + MOVE + 0.15 + n * 0.07;
        if (c === 'board') tl.to(S, { boardOn: 1, duration: 0.55, ease: 'power2.inOut' }, at);
        else tl.to(MAT.state[c], { mix: 1, duration: 0.55, ease: 'power2.inOut' }, at);
      }
    });
    // back to clay through the next orbit move
    if (i < ARRIVALS.length - 1) {
      for (const c of ALL_CATS) tl.to(MAT.state[c], { mix: 0, duration: 1.5, ease: 'power1.inOut' }, t + SLOT + 0.1);
      tl.to(S, { boardOn: 0, duration: 1.5, ease: 'power1.inOut' }, t + SLOT + 0.1);
    }
    ctx.onFrame((T) => {
      const on = T >= t + MOVE && T < t + SLOT;
      LL.setVisible(on);
      if (on) {
        LL.update(ctx.engine.camera);
        if (LL.crossings && !LL._warned) { console.warn(`[qa] ${arr.id}: ${LL.crossings} leader crossings`); LL._warned = true; }
      }
    });
    ctx.labels = ctx.labels || {};
    ctx.labels[arr.page] = LL;
  });

  director.add(T0, T1, (u, T) => path(T), 's5');
  const path = spline(keys);
}
