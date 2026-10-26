import * as THREE from 'three';
import { AMBITION } from '../data.js';
import { C } from '../palette.js';
import { RIB_BOWL, RIB_CANOPY, FIELD_HALF, PX_PER_FT } from '../ref.js';
import { to, EASE, clamp01, prog } from '../core/timeline.js';
import { layer, el, textBlock, typeOn, wordsIn, show, hide, rule, vrule, scrim } from '../core/overlay.js';
import { lineMaterial, segments } from '../core/lines.js';
import { fieldPlate, placeOnScreen } from '../core/plates.js';
import { SECTION_CAMERA, SECTION_DROP } from './s1_energy.js';

// Scene 2 — the ambition (p2). The p34 section extrudes into a wireframe of the bowl, and the
// model answers each of the four p2 lines as it lands.

const N_RIB = 72;

// Rounded-rectangle field edge, sampled evenly by arc length starting at (+x, 0) so that ribs
// 0 and N/2 coincide with the p34 cut.
export function perimeter(n, { x: ax, z: az, r }) {
  const pts = [];
  const seg = 24;
  const corner = (cx, cz, a0) => {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  };
  pts.push([ax, 0]);
  corner(ax - r, az - r, 0);
  corner(-ax + r, az - r, Math.PI / 2);
  corner(-ax + r, -az + r, Math.PI);
  corner(ax - r, -az + r, (3 * Math.PI) / 2);
  pts.push([ax, 0]);
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1];
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * L;
    while (d[j + 1] < s) j++;
    const f = (s - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]);
  }
  return out.map((p, k) => {
    const a = out[(k - 1 + n) % n];
    const b = out[(k + 1) % n];
    let nx = b[1] - a[1];
    let nz = -(b[0] - a[0]);
    const l = Math.hypot(nx, nz);
    nx /= l;
    nz /= l;
    if (nx * p[0] + nz * p[1] < 0) {
      nx = -nx;
      nz = -nz;
    }
    return { x: p[0], z: p[1], nx, nz, angle: Math.atan2(p[1], p[0]) };
  });
}

// Build ribs + rings for a half profile. Returns segments sorted by a key so that a draw count
// reveals them progressively.
function sweep(per, profile, include, key) {
  const segs = [];
  const P = (k, j) => {
    const p = per[k];
    const [u, y] = profile[j];
    return [p.x + p.nx * u, y, p.z + p.nz * u];
  };
  for (let k = 0; k < per.length; k++) {
    if (!include(per[k])) continue;
    for (let j = 0; j < profile.length - 1; j++) segs.push([P(k, j), P(k, j + 1)]);
    const k2 = (k + 1) % per.length;
    if (!include(per[k2])) continue;
    for (let j = 0; j < profile.length; j++) segs.push([P(k, j), P(k2, j)]);
  }
  segs.sort((a, b) => key(a) - key(b));
  return { flat: segs.flatMap((s) => [...s[0], ...s[1]]), keys: segs.map(key) };
}

export function surfaces(per, profile, include) {
  const pos = [];
  const P = (k, j) => {
    const p = per[k];
    const [u, y] = profile[j];
    return [p.x + p.nx * u, y, p.z + p.nz * u];
  };
  for (let k = 0; k < per.length; k++) {
    const k2 = (k + 1) % per.length;
    if (!include(per[k]) || !include(per[k2])) continue;
    for (let j = 0; j < profile.length - 1; j++) {
      const a = P(k, j);
      const b = P(k2, j);
      const c = P(k2, j + 1);
      const d = P(k, j + 1);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

const countUpTo = (keys, v) => {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (keys[m] <= v) lo = m + 1;
    else hi = m;
  }
  return lo;
};

export function build(ctx, S) {
  const { camera, rig } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  const cam = ctx.cam;
  const bowl = new THREE.Group();
  bowl.position.y = -SECTION_DROP / PX_PER_FT;
  root.add(bowl);

  const bg = fieldPlate('#03191c', '#0f4a52');
  cam.add(bg);

  const per = perimeter(N_RIB, FIELD_HALF);
  const north = (p) => p.z < -FIELD_HALF.z + FIELD_HALF.r * 0.35;
  const sides = (p) => Math.abs(p.x) > FIELD_HALF.x - FIELD_HALF.r * 0.55;
  const zKey = (s) => Math.max(Math.abs(s[0][2]), Math.abs(s[1][2]));
  const aKey = (s) => {
    const a = Math.atan2(s[0][2] + s[1][2], s[0][0] + s[1][0]);
    return (a + Math.PI * 2.25) % (Math.PI * 2);
  };

  const existing = sweep(per, RIB_BOWL, (p) => !north(p), zKey);
  const northS = sweep(per, RIB_BOWL, north, zKey);
  const canopy = sweep(per, RIB_CANOPY, sides, aKey);

  const mExisting = lineMaterial({ color: C.silver, width: 1.3, opacity: 0.8 });
  const mNorth = lineMaterial({ color: C.silver, width: 1.3, opacity: 0.8 });
  const mCanopy = lineMaterial({ color: C.line, width: 1.8, opacity: 1 });
  const lExisting = segments(existing.flat, mExisting);
  const lNorth = segments(northS.flat, mNorth);
  const lCanopy = segments(canopy.flat, mCanopy);
  bowl.add(lExisting, lNorth, lCanopy);

  const skinMat = new THREE.MeshStandardMaterial({
    color: C.midnight,
    emissive: new THREE.Color(C.midnight),
    emissiveIntensity: 0.45,
    roughness: 0.55,
    metalness: 0.1,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const skin = new THREE.Mesh(surfaces(per, RIB_BOWL, () => true), skinMat);
  const skinCanopy = new THREE.Mesh(surfaces(per, RIB_CANOPY.slice(0, 4), sides), skinMat);
  skin.renderOrder = skinCanopy.renderOrder = -1;
  bowl.add(skin, skinCanopy);
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(800, 1400, 900);
  root.add(key, new THREE.AmbientLight('#9ab', 0.5));

  // --- timeline -------------------------------------------------------------------------------
  const st = { bg: 0, extrude: 0, sectionFade: 0, rot: 0, glow: 0, flicker: 0, canopy: 0, eagles: 0, out: 0 };
  to(st, S.start, 1.4, { bg: 1 }, 'power2.inOut');
  to(st, S.start + 0.2, 4.0, { extrude: 1 }, EASE.camera);
  to(st, S.start + 0.3, 1.4, { sectionFade: 1 }, 'power2.inOut');
  to(st, S.start + 0.4, S.end - S.start, { rot: 1 }, 'power1.inOut');

  // camera: from the orthographic section view to a 3/4 view, bowl framed right of the type
  const by = -SECTION_DROP / PX_PER_FT;
  to(rig, S.start + 0.1, 5.2, { x: 2000, y: by + 1450, z: 3100, tx: -1000, ty: by - 60, tz: 180, fov: 24 }, EASE.camera);
  to(rig, S.start + 5.4, S.end - S.start - 5.6, { x: 1750, y: by + 1300, z: 2850, tx: -980, ty: by - 60, tz: 160, fov: 24.5 }, 'power1.inOut');
  // push into the bowl as the drivers begin
  to(rig, S.end - 0.4, 1.2, { x: 420, y: by + 300, z: 620, tx: 0, ty: by + 40, tz: 0, fov: 40 }, EASE.camera);

  // --- type (p2 layout × 0.96) -------------------------------------------------------------
  const L = layer('ambition');
  const sc = scrim(L, { left: '0', top: '0', width: '1300px', height: '1080px', background: 'linear-gradient(90deg, rgba(3,25,28,0.88) 0%, rgba(3,25,28,0.65) 55%, rgba(3,25,28,0) 100%)' });
  show(sc, S.start + 0.9, 1.2, {}, 'power2.out');
  const rail = vrule(L, 91, 0, 1080, S.start + 0.9, 1.2);
  rail.style.background = 'rgba(255,255,255,0.5)';
  const railLabel = textBlock(L, AMBITION.rail, { left: '30px', top: '285px', fontSize: '19px', fontWeight: '400', letterSpacing: '0.04em', transform: 'rotate(-90deg)', transformOrigin: '0 0', color: '#e9eeee' });
  typeOn(railLabel, S.start + 1.3, { per: 0.02 });
  const eyebrow = textBlock(L, AMBITION.eyebrow, { left: '204px', top: '92px', fontSize: '29px', fontWeight: '300', letterSpacing: '0.01em' });
  typeOn(eyebrow, S.start + 1.25, { per: 0.03 });
  const hA = textBlock(L, AMBITION.headline[0], { left: '200px', top: '215px', fontSize: '107px', fontWeight: '500', letterSpacing: '0.035em', lineHeight: '1' });
  const hB = textBlock(L, AMBITION.headline[1], { left: '200px', top: '345px', fontSize: '107px', fontWeight: '500', letterSpacing: '0.035em', lineHeight: '1', color: C.line });
  typeOn(hA, S.start + 1.5, { duration: 1.0, per: 0.03, rise: 26 });
  typeOn(hB, S.start + 1.9, { duration: 1.0, per: 0.03, rise: 26 });

  const RULES = [534, 616, 698, 780, 863]; // p2 rules (556/642/727/813/899) × 0.96
  const LINE_AT = [17.2, 18.3, 19.4, 20.5];
  const items = [];
  AMBITION.lines.forEach((txt, i) => {
    items.push(rule(L, 203, RULES[i], 1001, LINE_AT[i] - 0.25, 0.9));
    const ln = textBlock(L, txt, { left: '205px', top: `${RULES[i] + 22}px`, fontSize: '37px', fontWeight: '300', letterSpacing: '0.005em' });
    wordsIn(ln, LINE_AT[i], { per: 0.06 });
    items.push(ln);
  });
  items.push(rule(L, 203, RULES[4], 1001, LINE_AT[3] + 0.4, 0.9));
  [sc, rail, railLabel, eyebrow, hA, hB, ...items].forEach((e) => hide(e, S.end - 0.4, 0.45));

  // responses
  to(st, LINE_AT[0] + 0.1, 0.8, { glow: 1 }, 'power2.out');
  to(st, LINE_AT[1] + 0.1, 1.0, { flicker: 1 }, 'none');
  to(st, LINE_AT[2] + 0.1, 1.3, { canopy: 1 }, EASE.type);
  to(st, LINE_AT[3] + 0.1, 1.2, { eagles: 1 }, 'power2.inOut');
  to(st, S.end - 0.4, 0.9, { out: 1 }, 'power2.in');

  const silver = new THREE.Color(C.silver);
  const glowSilver = new THREE.Color('#f2f6f7');
  const green = new THREE.Color(C.line);
  const glass = new THREE.Color('#8fe0d8');
  const tmp = new THREE.Color();

  function update(t) {
    placeOnScreen(bg, camera, { dist: 60 });
    bg.userData.u.opacity.value = st.bg * (1 - st.out);
    bowl.rotation.y = -0.42 * st.rot;

    // the section lines from Scene 1 hand over to the rib at the cut
    const sec = ctx.section.userData;
    ctx.section.visible = st.sectionFade < 1;
    sec.green.opacity = 1 - st.sectionFade;
    sec.silver.opacity = 0.95 * (1 - st.sectionFade);
    ctx.section.position.y = 0;

    const zMax = existing.keys[existing.keys.length - 1];
    const zv = st.extrude * zMax + 1;
    lExisting.geometry.instanceCount = countUpTo(existing.keys, zv);
    lNorth.geometry.instanceCount = countUpTo(northS.keys, zv);
    lCanopy.geometry.instanceCount = st.canopy <= 0 ? 0 : countUpTo(canopy.keys, st.canopy * Math.PI * 2 + 0.001);

    // "Preserve" — the existing structure glows silver
    const g = st.glow * (1 - 0.55 * prog(t, LINE_AT[0] + 1.0, LINE_AT[0] + 2.2));
    tmp.copy(silver).lerp(glowSilver, g).multiplyScalar(1 + 0.9 * g);
    mExisting.color.copy(tmp).lerp(glass, st.eagles);
    mExisting.opacity = (0.8 + 0.2 * st.glow) * (1 - st.out);
    // "Transform" — the north end zone flickers, then holds green
    let on = 0;
    if (st.flicker > 0 && st.flicker < 1) on = Math.sin(st.flicker * 61.0) + Math.sin(st.flicker * 23.0) > 0.4 - st.flicker * 1.6 ? 1 : 0;
    else if (st.flicker >= 1) on = 1;
    mNorth.color.copy(tmp).lerp(green, on).lerp(glass, st.eagles * 0.5);
    mNorth.opacity = (0.8 + 0.2 * on) * (1 - st.out);
    // "new-build" — canopy wings draw in line green; "Unmistakably Eagles" — midnight green
    mCanopy.opacity = 1 - st.out;
    skinMat.opacity = 0.82 * st.eagles * (1 - st.out);
  }

  return { root, layer: L, window: [S.start, S.end + 0.6], update };
}
