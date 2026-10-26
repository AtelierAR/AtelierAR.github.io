// Scene 4 (0:42-0:56) — the canopy: shelter, reflection, energy.
// 1. space frame draws in line green, wing surfaces sweep in, PV tiles ripple (9,198 · 5.3 MWp)
// 2. swoop under the NW wing: the 316 stainless soffit switches on and mirrors plaza + crowd live
// 3. roof callouts (p22 rows only), 4. sun-path arc, shadow across the concourse + p79/p80 stat.
import * as THREE from 'three';
import { ROOF, OPEN_AIR, COPY, PAL, FT } from '../data.js';
import { REVEAL } from '../materials.js';
import { spline, ft, smooth } from '../director.js';
import { orbit } from './common.js';

export async function build(ctx) {
  const { overlay: O, master: tl, director, engine, MAT, parts } = ctx;
  const T0 = 42, T1 = 56;
  const S = ctx.state;
  Object.assign(S, { frame: 0, frameOpacity: 0, revealR: 1e6, ripple: 1e6, sunArc: 0, sunPos: 0 });

  // ---------------------------------------------------------------- materials / state
  tl.set(S, { revealR: 0, ripple: 0, frame: 0, frameOpacity: 0.95, mirror: 0, mirrorWing: 'NW' }, T0);
  for (const c of ['masonry', 'fins', 'glazing', 'metal', 'mesh', 'soffit', 'roof', 'pv', 'steel']) tl.set(MAT.state[c], { mix: 1, fade: 1 }, T0);
  tl.set(MAT.state.reflective, { mix: 0, fade: 1 }, T0);
  tl.to(S, { frame: 1, duration: 2.4, ease: 'power1.inOut' }, T0 + 0.1);
  tl.to(S, { revealR: 215, duration: 2.3, ease: 'power1.in' }, T0 + 1.6);
  tl.set(S, { revealR: 1e6 }, T0 + 3.95);
  tl.fromTo(S, { ripple: 48 }, { ripple: 225, duration: 2.5, ease: 'none', immediateRender: false }, T0 + 2.1);
  tl.set(S, { ripple: 1e6 }, T0 + 4.65);
  tl.to(S, { frameOpacity: 0, duration: 1.0 }, T0 + 3.6);
  tl.to(S, { crowd: 1, duration: 1.2 }, T0 + 3.4);
  tl.to(S, { crowd: 0, duration: 0.8 }, T0 + 9.0);
  tl.set(S, { mirror: 1 }, T0 + 4.6);
  tl.to(MAT.state.reflective, { mix: 1, duration: 0.9, ease: 'power2.inOut' }, T0 + 5.0);

  // ---------------------------------------------------------------- overlay
  const sec = O.el('div', 'ov sec light', O.root, `${COPY.s4Title}<small style="color:rgba(255,255,255,.75)">Shelter · reflection · energy</small>`);
  tl.set(sec, { opacity: 0 }, 0);
  tl.fromTo(sec, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 }, T0 + 0.35);
  tl.to(sec, { opacity: 0, duration: 0.4 }, T0 + 8.2);

  // PV counter — panel count follows the ripple front exactly
  const pv = O.el('div', 'ov stat');
  pv.style.left = '103px'; pv.style.top = '808px';
  const big = O.el('div', 'big', pv, '');
  O.el('div', 'cap', pv, `Solar array on the structural space frame · p${ROOF.pv.page}`);
  const dists = [];
  for (const w of parts.wings) { const a = w.pv.geometry.attributes.aDist.array; for (let i = 0; i < a.length; i++) dists.push(a[i]); }
  dists.sort((a, b) => a - b);
  const fmt = new Intl.NumberFormat('en-US');
  tl.set(pv, { opacity: 0 }, 0);
  tl.to(pv, { opacity: 1, duration: 0.4 }, T0 + 2.4);
  tl.to(pv, { opacity: 0, duration: 0.4 }, T0 + 5.9);

  // roof rows (p22) — only the two row values and their percentages are shown
  const rr = O.el('div', 'ov roofrows');
  const rows = ROOF.rows.map((r) => O.el('div', 'row', rr, `<b>${r.label}</b><span>${r.area} SF</span><i>${r.pct}</i>`));
  O.el('div', 'row', rr, `<b style="font-weight:400;font-size:19px;opacity:.8;width:auto">Roof materials · p${ROOF.page}</b>`).style.fontSize = '19px';
  tl.set(rr, { opacity: 0 }, 0);
  tl.to(rr, { opacity: 1, duration: 0.01 }, T0 + 6.1);
  tl.fromTo(rows, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.35 }, T0 + 6.1);
  tl.to(rr, { opacity: 0, duration: 0.4 }, T0 + 9.0);

  // 96 % open-air (p80) + conditioned area p79 -> p80
  const oa = O.el('div', 'ov openair');
  O.el('div', 'big', oa, OPEN_AIR.headline);
  O.el('div', 'line', oa, OPEN_AIR.line);
  O.el('div', 'sub', oa, `Conditioned area <b>${OPEN_AIR.conditioned.existing} SF</b> → <b>${OPEN_AIR.conditioned.proposed} SF</b><br>p79 existing → p80 proposed`);
  tl.set(oa, { opacity: 0 }, 0);
  tl.fromTo(oa, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, T0 + 9.9);
  tl.to(oa, { opacity: 0, duration: 0.4 }, T1 - 0.45);

  // ---------------------------------------------------------------- sun path arc
  const C = new THREE.Vector3(0, 0, 0), RARC = 330;
  const SUN = { az: (s) => 112 + 146 * s, el: (s) => 30 + 36 * Math.sin(Math.PI * s) };
  const sunDir = (s) => {
    const az = THREE.MathUtils.degToRad(SUN.az(s)), el = THREE.MathUtils.degToRad(SUN.el(s));
    return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  };
  const pts = Array.from({ length: 121 }, (_, i) => C.clone().addScaledVector(sunDir(i / 120), RARC));
  const arcGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 1.1, 6, false);
  const arc = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color: '#FFE7B0', transparent: true, opacity: 0.95, fog: false }));
  arc.visible = false;
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE9C2').multiplyScalar(1.6), fog: false }));
  sunBall.visible = false;
  engine.scene.add(arc, sunBall);
  const ticks = [];
  for (let i = 0; i <= 8; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), arc.material);
    m.position.copy(C).addScaledVector(sunDir(i / 8), RARC);
    m.visible = false;
    engine.scene.add(m);
    ticks.push(m);
  }
  tl.to(S, { sunArc: 1, duration: 1.4, ease: 'power2.inOut' }, T0 + 8.6);
  tl.fromTo(S, { sunPos: 0 }, { sunPos: 1, duration: 4.6, ease: 'sine.inOut', immediateRender: false }, T0 + 9.2);
  tl.set(S, { sunArc: 0 }, T1);

  ctx.onFrame((T, c) => {
    const inS4 = T >= T0 && T < T1;
    // reveal / ripple uniforms (metres)
    REVEAL.uRevealO.value.set(0, 0, 0);
    REVEAL.uRevealR.value = S.revealR;
    REVEAL.uRipple.value = S.ripple;
    for (const w of parts.wings) {
      w.frameLines.material.opacity = S.frameOpacity;
      w.setFrameProgress(inS4 ? S.frame : 0);
    }
    if (inS4 && S.revealR < 1e5) c.shadowKey.push('rv' + S.revealR.toFixed(1));
    if (inS4 && S.ripple < 1e5) c.shadowKey.push('rp' + S.ripple.toFixed(1));
    // PV counter
    if (inS4) {
      let n = 0;
      if (S.ripple >= 1e5) n = dists.length;
      else { let lo = 0, hi = dists.length; while (lo < hi) { const m = (lo + hi) >> 1; if (dists[m] < S.ripple - 2) lo = m + 1; else hi = m; } n = lo; }
      const done = n >= ROOF.pv.panels;
      big.innerHTML = `${done ? ROOF.pv.panelsText : fmt.format(n)} panels<em>·</em>${done ? ROOF.pv.mwp : ((5.3 * n) / ROOF.pv.panels).toFixed(1)} MWp`;
    }
    // the sun follows the arc position for the whole scene (deterministic when scrubbing)
    if (inS4) { const sp = T >= T0 + 9.2 ? S.sunPos : 0; S.sunAz = SUN.az(sp); S.sunEl = SUN.el(sp); }
    // sun arc + moving sun
    const vis = inS4 && S.sunArc > 0.001;
    arc.visible = vis;
    if (vis) {
      const idx = arcGeo.index.count;
      arc.geometry.setDrawRange(0, Math.floor((idx * S.sunArc) / 6) * 6);
      sunBall.visible = S.sunArc > 0.95;
      const d = sunDir(S.sunPos);
      sunBall.position.copy(C).addScaledVector(d, RARC);
      ticks.forEach((m, i) => (m.visible = i / 8 <= S.sunArc));
    } else { sunBall.visible = false; ticks.forEach((m) => (m.visible = false)); }
  });

  // ---------------------------------------------------------------- camera
  const k = (t, pos, target, fov = 34, x = {}) => ({ t, pos: pos.toArray(), target: target.toArray(), fov, ...x });
  const o1 = orbit(-70, 470, 330, [-15, 40, -20]);
  const o2 = orbit(-50, 330, 205, [-40, 45, -90]);
  const path = spline([
    k(T0, o1.pos, o1.target, 34),
    k(T0 + 4.0, o2.pos, o2.target, 34),
    k(T0 + 5.4, ft(-420, 190, -900), ft(-330, 170, -560), 42),
    k(T0 + 7.2, ft(-468, 54, -712), ft(-330, 202, -548), 50),
    k(T0 + 8.5, ft(-486, 48, -700), ft(-336, 206, -530), 50),
  ]);
  const o3 = orbit(-30, 430, 250, [0, 40, 30], 40, { shiftX: -0.1 });
  const o4 = orbit(-16, 450, 260, [0, 35, 40], 40, { shiftX: -0.1 });
  const rise = spline([
    k(T0 + 8.5, ft(-486, 48, -700), ft(-336, 206, -530), 50),
    k(T0 + 10.2, o3.pos, o3.target, 40, { shiftX: o3.shiftX }),
    k(T1, o4.pos, o4.target, 40, { shiftX: o4.shiftX }),
  ]);
  director.add(T0, T0 + 8.5, (u, T) => path(T), 's4a');
  director.add(T0 + 8.5, T1, (u, T) => rise(T), 's4b');
  void PAL; void FT; void smooth;
}
