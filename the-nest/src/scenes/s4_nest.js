import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { NEST } from '../data.js';
import { paragraphSchedule, FADE_IN, FADE_OUT } from '../paragraph.js';
import { C } from '../palette.js';
import { to, EASE, clamp01, prog, fromTo } from '../core/timeline.js';
import { layer, el, textBlock, typeOn, wordsIn, show, hide, rule, scrim, wrapBalanced } from '../core/overlay.js';
import { plate, placeOnScreen, fieldPlate } from '../core/plates.js';
import { masonryMaterial, steelMaterial, glassMaterial, digitalMaterial, stainlessMaterial } from '../core/materials.js';

// Scene 4 — The Nest: a kit of parts (p9, p10). Title card → four era frames that collapse into
// the five material tiles → Our City › Our Architecture › Our Identity as one continuous morph of
// the same 64 parts standing on a reflective ground.

const SCREEN_DIST = 40; // ft in front of the lens for camera-attached tiles

// ---------------------------------------------------------------------------------------------
// Material tiles (real PBR on 3D tiles, built at unit size and scaled to a screen rect)
export function buildTiles(mats) {
  const dark = new THREE.MeshStandardMaterial({ color: '#111a1c', roughness: 0.7, metalness: 0.2 });
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const tiles = {};
  {
    const g = new THREE.Group();
    g.add(box(1, 1, 0.12, [dark, dark, dark, dark, mats.masonry, dark]));
    tiles.masonry = g;
  }
  {
    const g = new THREE.Group();
    g.add(box(1, 1, 0.1, mats.steel));
    const seam = box(0.035, 1.0, 0.03, mats.steel);
    seam.position.set(0.22, 0, 0.065);
    g.add(seam);
    tiles.steel = g;
  }
  {
    const g = new THREE.Group();
    g.add(box(1, 1, 0.05, dark));
    for (let i = 0; i < 9; i++) {
      const f = box(0.03, 1, 0.2, mats.glass);
      f.position.set(-0.45 + i * 0.1125, 0, 0.11);
      f.rotation.y = 0.35;
      g.add(f);
    }
    tiles.glass = g;
  }
  {
    const g = new THREE.Group();
    g.add(box(1, 1, 0.1, [dark, dark, dark, dark, mats.digital, dark]));
    tiles.digital = g;
  }
  {
    const g = new THREE.Group();
    const R = 1.7;
    const th = 0.62;
    const geo = new THREE.CylinderGeometry(R, R, 1, 48, 1, true, -th / 2, th);
    const m = new THREE.Mesh(geo, mats.reflective);
    m.position.z = -R + 0.08;
    // tipped back so the mirror picks up the horizon and ground, not just open sky
    const tilt = new THREE.Group();
    tilt.rotation.x = -0.2;
    tilt.add(m);
    g.add(tilt);
    tiles.reflective = g;
  }
  return tiles;
}

// ---------------------------------------------------------------------------------------------
// Triptych layouts: arrays of { p:[x,yBase,z], s:[w,h,d], r: yaw, c: colour }.
const N = 64;
function rnd(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const BRICK = ['#6a4535', '#5b3b2e', '#704a39', '#4e3328'];

function layoutCity() {
  const L = [];
  const B = (x, y, z, w, h, d, c) => L.push({ p: [x, y, z], s: [w, h, d], r: 0, c });
  // chimney (p10 "Our City", left)
  B(-262, 0, -30, 28, 36, 28, '#5a3a2e');
  B(-262, 36, -30, 18, 150, 18, '#5f3d30');
  B(-262, 186, -30, 23, 8, 23, '#4a3027');
  // brick mill, six bays + clerestory + stair tower
  for (let i = 0; i < 6; i++) B(-188 + i * 40, 0, -10, 39.5, 92, 74, BRICK[i % 4]);
  B(-88, 92, -10, 200, 14, 40, '#4a3a33');
  B(60, 0, -20, 32, 124, 34, '#5a3a2e');
  // rowhouses, stepping
  for (let i = 0; i < 10; i++) B(110 + i * 23, 0, 30, 22, 44 + ((i * 7) % 3) * 4, 42, BRICK[(i + 1) % 4]);
  // industrial gantry
  B(372, 0, -40, 6, 124, 6, C.steel);
  B(442, 0, -40, 6, 124, 6, C.steel);
  B(407, 118, -40, 86, 8, 8, C.steel);
  // sheds
  B(-330, 0, 20, 60, 22, 40, '#4e3328');
  B(-226, 0, 50, 36, 18, 30, '#5b3b2e');
  B(350, 0, 30, 54, 26, 36, '#5b3b2e');
  B(450, 0, 10, 44, 20, 32, '#4e3328');
  return L;
}

function layoutArchitecture() {
  const L = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const h = 136 + 20 * Math.sin(a * 3 + 0.6) + 9 * Math.sin(a * 7 + 1.3);
    L.push({ p: [Math.cos(a) * 72, 0, Math.sin(a) * 72], s: [1.6, h, 9], r: -a, c: '#a9dcd6', a });
  }
  return L;
}

function layoutIdentity() {
  const L = [];
  const T = (x, z, w, h, c = '#9fb4bb') => L.push({ p: [x, 0, z], s: [w, h, w * 0.9], r: 0, c });
  const S = (x, z, w, y, h, c = '#9fb4bb') => L.push({ p: [x, y, z], s: [w, h, w * 0.9], r: 0, c });
  // One Liberty Place and Two Liberty Place (stepped crowns, spires added separately)
  T(-10, -20, 46, 205, '#a8bcc3');
  S(-10, -20, 37, 205, 45, '#a8bcc3');
  S(-10, -20, 27, 250, 28, '#b4c7cd');
  T(78, -50, 40, 172, '#a8bcc3');
  S(78, -50, 31, 172, 40, '#a8bcc3');
  S(78, -50, 22, 212, 22, '#b4c7cd');
  // Comcast Center (tall, tapering) and Comcast Technology Center (tallest)
  T(-140, -70, 52, 282, '#8fa7b0');
  S(-140, -70, 44, 282, 20, '#8fa7b0');
  T(196, -110, 46, 300, '#7f98a2');
  S(196, -110, 40, 300, 42, '#7f98a2');
  const r = rnd(91);
  const used = L.length;
  for (let i = used; i < N; i++) {
    const x = -360 + r() * 720;
    const z = -170 + r() * 230;
    const near = Math.abs(x) < 120 && z > -60;
    const h = (near ? 40 : 60) + r() * (Math.abs(x) < 220 ? 170 : 90);
    const w = 20 + r() * 26;
    T(x, z, w, h, r() > 0.5 ? '#6f8790' : '#8aa0a8');
  }
  return L;
}

const pad = (L) => {
  while (L.length < N) L.push({ p: [0, 0, 0], s: [0.001, 0.001, 0.001], r: 0, c: '#000000', hidden: true });
  return L;
};

// ---------------------------------------------------------------------------------------------
export function build(ctx, S) {
  const { camera, tex, rig, post } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  const cam = ctx.cam;
  const L = layer('nest');

  const T_PANELS = S.start + 4.4; // 41.4
  const T_TRIPTYCH = S.start + 15.0; // 52.0
  const T_ARCH = S.start + 19.0; // 56.0
  const T_IDENT = S.start + 23.0; // 60.0

  // backgrounds
  const bg = fieldPlate('#021417', '#0e4850', -200);
  cam.add(bg);
  const p9 = plate(tex.p09_bg, { opacity: 0, order: -190 });
  cam.add(p9);
  const st = { bg: 0, p9: 0, p9zoom: 1, out: 0 };
  to(st, S.start - 0.2, 0.8, { bg: 1 }, 'power2.out');
  to(st, S.start, 0.9, { p9: 1 }, 'power2.out');
  to(st, S.start, 4.8, { p9zoom: 1.045 }, 'power1.inOut');
  to(st, T_PANELS - 0.3, 1.0, { p9: 0.16 }, 'power2.inOut');
  to(st, T_TRIPTYCH - 0.6, 1.0, { p9: 0 }, 'power2.inOut');

  // --- title card (p9 × 0.96) -------------------------------------------------------------
  const tTitle = textBlock(L, NEST.title, { left: '200px', top: '212px', fontSize: '118px', fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1' });
  const tSub = textBlock(L, [{ t: NEST.sub }, { t: '…', style: { color: C.glass } }], { left: '403px', top: '386px', fontSize: '73px', fontWeight: '600', letterSpacing: '0.03em', lineHeight: '1' });
  const tSmall = textBlock(L, NEST.small, { left: '204px', top: '527px', fontSize: '30px', fontWeight: '300', color: C.line, letterSpacing: '0.01em' });
  typeOn(tTitle, S.start + 0.4, { duration: 1.0, per: 0.05, rise: 28 });
  typeOn(tSub, S.start + 1.0, { duration: 1.0, per: 0.02, rise: 20 });
  typeOn(tSmall, S.start + 1.7, { per: 0.02 });
  [tTitle, tSub, tSmall].forEach((e) => hide(e, T_PANELS - 0.2, 0.5, { y: -20 }));

  // --- era frames (p10) ---------------------------------------------------------------------
  const PANELS = [
    [68, 252, 434, 482],
    [516, 252, 433, 482],
    [963, 252, 435, 482],
    [1415, 252, 436, 482],
  ];
  const keys = ['p10_past', 'p10_contemporary', 'p10_future', 'p10_faithful'];
  const TILE = 236;
  const GAP = 44;
  const X0 = (1920 - (5 * TILE + 4 * GAP)) / 2;
  const TILE_Y = 300;
  const tileRect = (i) => [X0 + i * (TILE + GAP), TILE_Y, TILE, TILE];
  // each frame holds 1.2 s after it lands, then collapses (arrivals are staggered 0.18 s)
  const COLLAPSE = [0, 1, 2, 3].map((i) => T_PANELS + 1.1 + 1.2 + i * 0.42);

  const panels = keys.map((k, i) => {
    const m = plate(tex[k], { opacity: 0, order: -120 + i, duotone: 0.15, dark: '#16303a', light: '#e3ecef' });
    cam.add(m);
    const s = { in: 0, col: 0 };
    to(s, T_PANELS + 0.1 + i * 0.18, 1.0, { in: 1 }, EASE.type);
    to(s, COLLAPSE[i], 0.8, { col: 1 }, EASE.move);
    const lbl = textBlock(L, NEST.eras[i], { left: `${PANELS[i][0]}px`, top: `${PANELS[i][1] - 44}px`, fontSize: '27px', fontWeight: '800', letterSpacing: '0.07em' });
    typeOn(lbl, T_PANELS + 0.35 + i * 0.18, { per: 0.025 });
    hide(lbl, COLLAPSE[i], 0.35);
    return { m, s, rect: PANELS[i] };
  });

  // material tiles
  const mats = {
    masonry: masonryMaterial(),
    steel: steelMaterial(),
    glass: glassMaterial(0.55),
    digital: digitalMaterial({ cols: 22, rows: 22, size: 256 }),
    reflective: stainlessMaterial(),
  };
  ctx.materials = mats;
  const tiles = buildTiles(mats);
  const tileState = NEST.materials.map((m, i) => {
    const g = tiles[m.id];
    g.traverse((o) => o.layers.set(1));
    cam.add(g);
    const s = { k: 0, fly: 0 };
    const at = COLLAPSE[m.era] + 0.3 + (m.id === 'steel' ? 0.15 : 0);
    to(s, at, 1.2, { k: 1 }, 'power3.out');
    to(s, T_TRIPTYCH - 0.7 + i * 0.06, 1.0, { fly: 1 }, 'power3.in');
    // name + caption under the tile (p10 strip)
    const [x, y] = tileRect(i);
    const cap = el('div', 'abs', L, { left: `${x}px`, top: `${y + TILE + 22}px` });
    el('div', '', cap, { fontSize: '22px', fontWeight: '800', letterSpacing: '0.08em' }).textContent = m.name;
    const body = el('div', '', cap, { fontSize: '22px', lineHeight: '29px', fontWeight: '400', color: '#d8e1e1', marginTop: '6px' });
    body.innerHTML = wrapBalanced(m.caption, 20).join('<br>');
    show(cap, at + 0.35, 0.8, { y: 14 });
    hide(cap, T_TRIPTYCH - 0.75, 0.4);
    return { g, s, i, m };
  });
  const heading = textBlock(L, NEST.materialHeading, { left: `${X0}px`, top: `${TILE_Y - 64}px`, fontSize: '24px', fontWeight: '700', letterSpacing: '0.12em', color: '#e6eeee' });
  typeOn(heading, COLLAPSE[0] + 0.2, { per: 0.03 });
  hide(heading, T_TRIPTYCH - 0.8, 0.4);

  // light raking across the tiles: rides with the camera like the tiles do
  const rake = new THREE.DirectionalLight('#fff3e2', 2.6);
  const rakeTarget = new THREE.Object3D();
  rakeTarget.position.set(0, 0, -SCREEN_DIST);
  cam.add(rake, rakeTarget);
  rake.target = rakeTarget;
  const fill = new THREE.DirectionalLight('#9fc9d0', 0.35);
  fill.position.set(0, -1, 0.5);
  cam.add(fill);
  const rakeS = { a: 0 };
  to(rakeS, T_PANELS + 1.5, T_TRIPTYCH - T_PANELS - 1.5, { a: 1 }, 'power1.inOut');

  // --- triptych: Our City › Our Architecture › Our Identity ----------------------------------
  const world = new THREE.Group();
  root.add(world);
  const ground = new Reflector(new THREE.PlaneGeometry(6000, 6000), { textureWidth: 1024, textureHeight: 576, color: new THREE.Color('#8a9497'), clipBias: 0.003 });
  ground.rotation.x = -Math.PI / 2;
  world.add(ground);
  // a dark veil over the mirror so the reflection falls off into the field
  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { col: { value: new THREE.Color('#03181b') } },
      vertexShader: 'varying vec3 w; void main(){ vec4 p = modelMatrix*vec4(position,1.0); w = p.xyz; gl_Position = projectionMatrix*viewMatrix*p; }',
      fragmentShader: 'uniform vec3 col; varying vec3 w; void main(){ float d = length(w.xz); gl_FragColor = vec4(col, clamp(0.38 + d / 1400.0, 0.0, 0.96)); }',
    }),
  );
  veil.rotation.x = -Math.PI / 2;
  veil.position.y = 0.3;
  world.add(veil);
  // the horizon line of p10's triptych
  const horizon = new THREE.Mesh(new THREE.PlaneGeometry(1400, 0.8), new THREE.MeshBasicMaterial({ color: '#9fb0b2', transparent: true, opacity: 0.35 }));
  horizon.position.set(0, 0.6, 60);
  horizon.rotation.x = -Math.PI / 2;
  world.add(horizon);

  const A = pad(layoutCity());
  const B = pad(layoutArchitecture());
  const Cc = pad(layoutIdentity());
  const partMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, metalness: 0.05, envMapIntensity: 1.0 });
  const unit = new THREE.BoxGeometry(1, 1, 1);
  unit.translate(0, 0.5, 0); // origin at the base so parts grow from the ground
  const parts = new THREE.InstancedMesh(unit, partMat, N);
  parts.castShadow = parts.receiveShadow = true;
  parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(parts);
  for (let i = 0; i < N; i++) parts.setColorAt(i, new THREE.Color(A[i].c));
  // morph order: left → right across the frame
  const orderOf = (L2) => L2.map((p) => clamp01((p.p[0] + 400) / 800));
  const ordA = orderOf(B);
  const ordB = orderOf(Cc);

  // Liberty Place spires and the logo slot only exist in "Our Identity"
  const spireMat = new THREE.MeshStandardMaterial({ color: '#b9cbd0', roughness: 0.25, metalness: 0.6 });
  const spire1 = new THREE.Mesh(new THREE.ConeGeometry(14, 70, 4), spireMat);
  spire1.position.set(-10, 278 + 35, -20);
  spire1.rotation.y = Math.PI / 4;
  const spire2 = new THREE.Mesh(new THREE.ConeGeometry(11, 56, 4), spireMat);
  spire2.position.set(78, 234 + 28, -50);
  spire2.rotation.y = Math.PI / 4;
  world.add(spire1, spire2);
  const logoMat = new THREE.MeshStandardMaterial({
    color: '#dfe7e8',
    roughness: 0.3,
    metalness: 0.5,
    transparent: true,
    opacity: 0,
    map: tex.logo || null,
  });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(150, 96), logoMat);
  logo.name = 'LOGO_SLOT';
  logo.position.set(0, 78, 150);
  world.add(logo);
  const logoFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(150, 96)), new THREE.LineBasicMaterial({ color: '#e9f1f1', transparent: true, opacity: 0 }));
  logo.add(logoFrame);

  const key = new THREE.DirectionalLight('#ffe8cc', 2.2);
  key.position.set(-500, 600, 700);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -600, right: 600, top: 600, bottom: -200, near: 100, far: 2500 });
  const glint = new THREE.PointLight('#e8fffb', 0, 900, 1.2);
  world.add(key, glint, new THREE.HemisphereLight('#7f97a0', '#041c20', 0.6));

  const tr = { city: 0, toArch: 0, wave: 0, toIdent: 0, ident: 0, orbit: 0 };
  to(tr, T_TRIPTYCH + 0.1, 1.8, { city: 1 }, 'power3.out');
  to(tr, T_ARCH, 1.9, { toArch: 1 }, EASE.move);
  to(tr, T_ARCH + 1.2, 3.0, { wave: 1 }, 'power1.inOut');
  to(tr, T_IDENT, 1.9, { toIdent: 1 }, EASE.move);
  to(tr, T_IDENT + 1.5, 1.0, { ident: 1 }, 'power2.out');
  to(tr, T_TRIPTYCH, S.end - T_TRIPTYCH, { orbit: 1 }, 'power1.inOut');

  // camera: hold through the cards, then arrive at the model on its mirror
  to(rig, T_TRIPTYCH - 0.8, 2.2, { x: -260, y: 64, z: 980, tx: -40, ty: 112, tz: 0, fov: 30, roll: 0 }, EASE.camera);
  to(rig, T_TRIPTYCH + 1.6, T_ARCH - T_TRIPTYCH - 1.4, { x: -120, y: 58, z: 900, tx: -20, ty: 110, tz: 0, fov: 30 }, 'power1.inOut');
  to(rig, T_ARCH + 0.2, 3.8, { x: 120, y: 46, z: 560, tx: 0, ty: 104, tz: 0, fov: 34 }, EASE.camera);
  to(rig, T_IDENT - 0.2, 3.0, { x: 90, y: 56, z: 1060, tx: 10, ty: 150, tz: -40, fov: 31 }, EASE.camera);
  to(rig, T_IDENT + 2.8, S.end - T_IDENT - 2.8, { x: 40, y: 70, z: 1000, tx: 10, ty: 150, tz: -40, fov: 30.5 }, 'power1.inOut');
  // dip to midnight while the building's plaza replaces the model
  to(ctx.fade, S.end - 0.55, 0.55, { v: 1 }, 'power2.in');
  to(ctx.fade, S.end, 0.6, { v: 0 }, 'power2.out');

  const refHead = textBlock(L, NEST.reflectionHeading, { left: '204px', top: '96px', fontSize: '24px', fontWeight: '700', letterSpacing: '0.12em', color: '#e6eeee' });
  typeOn(refHead, T_TRIPTYCH + 0.4, { per: 0.03 });
  hide(refHead, S.end - 0.6, 0.4);
  const crumbs = el('div', 'abs', L, { right: '96px', left: 'auto', top: '958px', fontSize: '22px', fontWeight: '700', letterSpacing: '0.1em', textAlign: 'right' });
  const crumbSpans = NEST.triptych.map((t, i) => {
    const s = el('span', '', crumbs, { opacity: '0.32', transition: 'none' });
    s.textContent = t;
    if (i < 2) el('span', '', crumbs, { opacity: '0.45', margin: '0 18px' }).textContent = '›';
    return s;
  });
  show(crumbs, T_TRIPTYCH + 0.6, 0.6);
  hide(crumbs, S.end - 0.6, 0.4);
  [T_TRIPTYCH + 0.6, T_ARCH + 0.4, T_IDENT + 0.4].forEach((at, i) => {
    fromTo(crumbSpans[i], at, 0.5, { opacity: 0.32 }, { opacity: 1 }, 'power2.out');
    if (i < 2) fromTo(crumbSpans[i], [T_ARCH, T_IDENT][i] + 0.4, 0.5, { opacity: 1 }, { opacity: 0.32 }, 'power2.out');
  });

  // --- the concept paragraph (p9), two lines at a time ---------------------------------------
  buildParagraph(L, S, ctx);

  // --- per frame ------------------------------------------------------------------------------
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const col = new THREE.Color();
  const colB = new THREE.Color();
  const Y = new THREE.Vector3(0, 1, 0);

  function update(t) {
    placeOnScreen(bg, camera, { dist: 90 });
    placeOnScreen(p9, camera, { dist: 80 });
    bg.userData.u.opacity.value = st.bg;
    p9.userData.u.opacity.value = st.p9;
    p9.userData.u.zoom.value = st.p9zoom;
    p9.visible = st.p9 > 0.001;
    post.ao.enabled = t > T_TRIPTYCH - 0.2;
    post.ao.configuration.aoRadius = 20;

    // era frames: slide in, then collapse onto their tile position
    const vh = 2 * SCREEN_DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const k = vh / 1080;
    panels.forEach((p, i) => {
      const [x, y, w, h] = p.rect;
      const tgtIdx = NEST.materials.findIndex((m) => m.era === i);
      // the past collapses onto two tiles (masonry + steel)
      const tgt = i === 0 ? [X0, TILE_Y, 2 * TILE + GAP, TILE] : tileRect(tgtIdx);
      const c = p.s.col;
      const e = 1 - p.s.in;
      const rx = x + (tgt[0] - x) * c;
      const ry = y + 280 * e + (tgt[1] - y) * c;
      const rw = w + (tgt[2] - w) * c;
      const rh = h + (tgt[3] - h) * c;
      placeOnScreen(p.m, camera, { x: rx, y: ry, w: rw, h: rh, dist: SCREEN_DIST + 2 });
      p.m.userData.u.opacity.value = Math.min(1, p.s.in * 1.5) * (1 - clamp01((c - 0.45) / 0.55));
      p.m.visible = p.s.in > 0 && c < 1;
    });
    tileState.forEach(({ g, s, i }) => {
      const [x, y, w, h] = tileRect(i);
      const cx = (x + w / 2 - 960) * k;
      const cy = -(y + h / 2 - 540) * k + s.fly * s.fly * 900 * k;
      g.position.set(cx, cy, -SCREEN_DIST);
      const size = w * k * (0.6 + 0.4 * s.k);
      g.scale.set(size, size, size);
      // rotate into place, then a slow turn so light keeps raking across the surface
      g.rotation.set(0.1 * Math.sin(t * 0.5 + i), (1 - s.k) * -0.9 + 0.22 * Math.sin(t * 0.42 + i * 1.3) + s.fly * 1.2, 0);
      g.visible = s.k > 0.001 && s.fly < 1;
    });
    const a = rakeS.a;
    rake.position.set(-40 + 80 * a, 14, -SCREEN_DIST + 26);
    rake.intensity = t < T_TRIPTYCH + 0.5 ? 2.6 : 0;
    fill.intensity = t < T_TRIPTYCH + 0.5 ? 0.35 : 0;
    mats.digital.userData.draw(t, 'wave');

    // triptych morph
    world.visible = t > T_TRIPTYCH - 0.8;
    if (!world.visible) return;
    const toB = tr.toArch;
    const toC = tr.toIdent;
    for (let i = 0; i < N; i++) {
      let from = A[i];
      let tgt = B[i];
      let kk;
      if (toC > 0) {
        from = B[i];
        tgt = Cc[i];
        kk = easeIO(clamp01(toC * 1.6 - ordB[i] * 0.6));
      } else {
        kk = easeIO(clamp01(toB * 1.6 - ordA[i] * 0.6));
      }
      const grow = toB > 0 || toC > 0 ? 1 : easeOut(clamp01(tr.city * 1.5 - (A[i].p[0] + 400) / 1300));
      let s0 = from.hidden ? [tgt.s[0], 0.001, tgt.s[2]] : from.s;
      let s1 = tgt.hidden ? [from.s[0], 0.001, from.s[2]] : tgt.s;
      let p0 = from.hidden ? tgt.p : from.p;
      let p1 = tgt.hidden ? from.p : tgt.p;
      pos.set(p0[0] + (p1[0] - p0[0]) * kk, p0[1] + (p1[1] - p0[1]) * kk + Math.sin(kk * Math.PI) * 26, p0[2] + (p1[2] - p0[2]) * kk);
      scl.set(s0[0] + (s1[0] - s0[0]) * kk, (s0[1] + (s1[1] - s0[1]) * kk) * grow, s0[2] + (s1[2] - s0[2]) * kk);
      let yaw = from.r + (tgt.r - from.r) * kk;
      // Our Architecture: fins catch the light in sequence, like a wave
      if (toC < 1 && B[i].a !== undefined) {
        const w = tr.wave * (1 - toC) * Math.sin(B[i].a * 2 - (t - T_ARCH) * 2.4);
        yaw += 0.5 * w * (toC > 0 ? 1 - kk : kk);
      }
      q.setFromAxisAngle(Y, yaw);
      m4.compose(pos, q, scl.max(new THREE.Vector3(0.001, 0.001, 0.001)));
      parts.setMatrixAt(i, m4);
      col.set(from.hidden ? tgt.c : from.c);
      colB.set(tgt.hidden ? from.c : tgt.c);
      parts.setColorAt(i, col.lerp(colB, kk));
    }
    parts.instanceMatrix.needsUpdate = true;
    parts.instanceColor.needsUpdate = true;
    // surface character: brick → glass → glass-and-steel
    partMat.roughness = 0.82 + (0.05 - 0.82) * toB + (0.22 - 0.05) * toC;
    partMat.metalness = 0.04 + (0.85 - 0.04) * toB + (0.5 - 0.85) * toC;
    partMat.envMapIntensity = 0.7 + 0.9 * toB;
    glint.intensity = 1600 * tr.wave * (1 - toC);
    const ga = (t - T_ARCH) * 0.9;
    glint.position.set(Math.cos(ga) * 260, 150, Math.sin(ga) * 260 + 80);
    const sp = easeOut(clamp01((toC - 0.75) / 0.25));
    spire1.scale.set(1, sp + 0.001, 1);
    spire2.scale.set(1, sp + 0.001, 1);
    spire1.visible = spire2.visible = sp > 0.001;
    logoMat.opacity = (tex.logo ? 0.95 : 0.1) * tr.ident;
    logoFrame.material.opacity = 0.7 * tr.ident;
    logo.visible = tr.ident > 0.001;
    world.rotation.y = -0.05 + 0.1 * tr.orbit;
  }

  return { root, layer: L, window: [S.start - 0.2, 76.2], rootWindow: [S.start - 0.2, S.end], update };
}

const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

// ---------------------------------------------------------------------------------------------
// p9 paragraph (schedule in src/paragraph.js). The last sentence runs into Scene 5, where it moves
// to the top-left so it never meets the p26 leader labels.
function buildParagraph(L, S, ctx) {
  const boxes = [];
  for (const c of paragraphSchedule()) {
    const late = c.sentence === 4;
    const box = el('div', 'abs', L, {
      left: late ? '96px' : '206px',
      top: late ? '64px' : '902px',
      fontSize: '22px',
      lineHeight: '31px',
      fontWeight: '600',
      color: '#eef3f3',
      whiteSpace: 'normal',
    });
    box.innerHTML = c.lines.map((ln) => `<div>${ln}</div>`).join('');
    fromTo(box, c.at + 0.02, FADE_IN, { opacity: 0, y: 10 }, { opacity: 1, y: 0 }, EASE.type);
    fromTo(box, c.at + c.dur - FADE_OUT, FADE_OUT, { opacity: 1 }, { opacity: 0 }, 'power2.in');
    boxes.push({ box, ...c });
  }
  // hairline rules framing the paragraph (p9), and a soft scrim for legibility
  const sc = scrim(L, { left: '0', top: '700px', width: '1400px', height: '380px', background: 'radial-gradient(60% 75% at 22% 82%, rgba(2,20,23,0.82), rgba(2,20,23,0) 100%)' });
  show(sc, 37.4, 0.8);
  hide(sc, 64.4, 0.5);
  const r1 = rule(L, 204, 884, 760, 37.5, 1.0);
  const r2 = rule(L, 204, 978, 760, 37.7, 1.0);
  hide(r1, 64.4, 0.5);
  hide(r2, 64.4, 0.5);
  const sc2 = scrim(L, { left: '0', top: '0', width: '1400px', height: '330px', background: 'radial-gradient(55% 60% at 22% 18%, rgba(18,28,40,0.72), rgba(18,28,40,0) 100%)' });
  show(sc2, 65.3, 0.6);
  hide(sc2, 76.0, 0.5);
  ctx.paragraph = boxes;
}
