// Exterior Strategies: The Skin, the Canopy, the Plaza
// Lincoln Financial Field renovation, HKS Concept Pricing Package (Oct 22 2026).
// One GSAP master timeline driven by a manual clock; the camera director, materials,
// overlays and per-frame systems are all pure functions of the master time T.
import '@fontsource/hanken-grotesk/300.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import './style.css';
import './overlay/overlay.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { DURATION, FPS, SCENES, WIDTH, HEIGHT, FT, LAYOUT } from './data.js';
import { createEngine } from './engine.js';
import { initMaterials, applyMaterials, MAT, setWash } from './materials.js';
import { buildStadium } from './stadium.js';
import { buildSite } from './site.js';
import { createBoardScreen } from './board.js';
import { Director, ft } from './director.js';
import { createOverlay } from './overlay/overlay.js';
import { SCENE_MODULES } from './scenes/index.js';

const params = new URLSearchParams(location.search);
const RECORD = params.has('record');
const BASE = import.meta.env.BASE_URL;

gsap.ticker.lagSmoothing(0);
gsap.ticker.sleep(); // the master clock below drives everything

const stage = document.getElementById('stage');
function fit() {
  if (RECORD) { stage.style.transform = 'translate(-50%,-50%)'; return; }
  const k = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  stage.style.transform = `translate(-50%,-50%) scale(${k})`;
}
stage.style.transformOrigin = '50% 50%';
addEventListener('resize', fit);
fit();

async function boot() {
  const [siteMeta, elevMeta] = await Promise.all([
    fetch(BASE + 'assets/siteplan.json').then((r) => r.json()),
    fetch(BASE + 'assets/elev.json').then((r) => r.json()),
  ]);
  const engine = createEngine(document.getElementById('gl'), { pixelRatio: Math.min(2, devicePixelRatio || 1), record: RECORD });
  initMaterials();
  const board = createBoardScreen();
  MAT.materials.board.emissiveMap = board.texture;
  MAT.materials.board.needsUpdate = true;
  MAT.materials.reflective.envMap = engine.cubeRT.texture;
  for (const k of ['reflective', 'wingSoffit', 'roof', 'boardFrame', 'mesh']) MAT.materials[k].side = THREE.DoubleSide;

  const stadium = buildStadium(MAT.materials.board);
  engine.scene.add(stadium);
  const site = buildSite(siteMeta);
  engine.scene.add(site.root);

  const director = new Director(engine.camera);
  const overlay = createOverlay(document.getElementById('overlay'));
  const master = gsap.timeline({ paused: true });

  const frameFns = [];
  engine.renderer.shadowMap.autoUpdate = false;
  let shadowSig = '';
  const ctx = {
    shadowKey: [], // per-frame values that change shadow casters (pushed by scene hooks)
    THREE, gsap, engine, stadium, site, board, director, overlay, master, MAT, siteMeta, elevMeta,
    parts: stadium.userData.parts,
    onFrame: (fn) => frameFns.push(fn),
    // global state tweened by scenes
    state: {
      dusk: 0, boardOn: 0, crowd: 0, mirror: 0, mirrorWing: 'NW', bloom: 0, glow: 0, rim: 0,
      sunAz: 75, sunEl: 38, dof: 0, studio: 0, plan: 0, exposure: 1, grain: 0.03,
    },
  };
  for (const m of SCENE_MODULES) await m.build(ctx);

  // ------------------------------------------------------------------ per-frame
  const tmp = new THREE.Vector3();
  const mirrorPlane = new THREE.Plane();
  function update(T) {
    master.seek(Math.min(T, master.duration()), false);
    director.update(T);
    ctx.shadowKey.length = 0;
    for (const fn of frameFns) fn(T, ctx);
    const S = ctx.state;
    MAT.global.glow = S.glow;
    MAT.global.boardGlow = S.boardOn > 0 ? S.dusk : 0;
    MAT.state.board.mix = S.boardOn;
    applyMaterials();

    // sky follows the camera; sun; dusk
    engine.sky.position.copy(engine.camera.position);
    engine.skyU.uDusk.value = S.dusk;
    engine.sunState.az = S.sunAz; engine.sunState.el = S.sunEl;
    engine.placeSun(S.studio > 0.5 ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(0, 0, 0));
    const L = engine.lights;
    L.sun.intensity = THREE.MathUtils.lerp(2.6, 0.9, S.dusk);
    L.sun.color.set('#FFF5E8').lerp(new THREE.Color('#FF9E5E'), S.dusk);
    L.hemi.intensity = THREE.MathUtils.lerp(0.3, 0.2, S.dusk);
    L.hemi.color.set('#E4E8F0').lerp(new THREE.Color('#6F7796'), S.dusk);
    L.hemi.groundColor.set('#D6D3CE').lerp(new THREE.Color('#5a4a40'), S.dusk);
    L.rim.intensity = S.rim * 2.2;
    L.boardLight.intensity = S.boardOn * S.dusk * 9000;
    L.plazaGlow.intensity = S.dusk * S.glow * 5000;
    const bc = stadium.userData.parts.boards[0].screenCenter;
    L.boardLight.position.set(bc.x, bc.y - 10, bc.z - 40);
    L.plazaGlow.position.set(0, 12, -190);
    engine.scene.fog.color.copy(engine.skyU.horizon.value).lerp(engine.skyU.duskHorizon.value.clone().multiplyScalar(0.8), S.dusk);
    setWash(new THREE.Color('#E6E8EC').lerp(new THREE.Color('#8a8796'), S.dusk), 0.62 * (1 - 0.6 * S.dusk));
    engine.updateEnv();
    const sig = [S.sunAz.toFixed(3), S.sunEl.toFixed(3), stadium.visible, site.trees.visible, ...ctx.shadowKey].join('|');
    if (sig !== shadowSig) { engine.renderer.shadowMap.needsUpdate = true; shadowSig = sig; }

    // post
    engine.effects.bloom.intensity = S.bloom;
    engine.effects.noise.blendMode.opacity.value = S.grain;
    engine.setPost({ dofOn: S.dof > 0.01, bloomOn: S.bloom > 0.01, target: director.target, bokeh: 1.4 * S.dof });
    // idle lights cost a full shader term each on CPU WebGL: switch them off when dark
    L.rim.visible = L.rim.intensity > 0;
    L.boardLight.visible = L.boardLight.intensity > 0;
    L.plazaGlow.visible = L.plazaGlow.intensity > 0;

    // board content
    if (S.boardOn > 0) board.update(T, S.dusk > 0.5 ? 1 : 0);

    // crowd
    site.crowd.mesh.visible = S.crowd > 0.001;
    if (site.crowd.mesh.visible) site.crowd.update(T, S.crowd);
    site.planMat.opacity = S.plan;
    site.plan.visible = S.plan > 0.001;

    // live mirror for the reflective soffit
    if (S.mirror > 0.001 && MAT.state.reflective.mix > 0.001 && stadium.visible) {
      const wing = stadium.userData.parts.wings.find((w) => w.o.id === S.mirrorWing) || stadium.userData.parts.wings[0];
      const o = wing.o;
      const sx = Math.sign(o.x0 + o.x1), sz = Math.sign(o.z0 + o.z1) || 1;
      const n = tmp.set(-o.gx * sx, 1, -o.gz * sz).normalize();
      const xin = Math.min(Math.abs(o.x0), Math.abs(o.x1));
      const p0 = ft(sx * xin, o.y0 - LAYOUT.wingDepth, 0);
      mirrorPlane.setFromNormalAndCoplanarPoint(n, p0);
      const cam = engine.camera.position;
      const d = mirrorPlane.distanceToPoint(cam);
      engine.cubeCam.position.copy(cam).addScaledVector(mirrorPlane.normal, -2 * d);
      const wings = stadium.userData.parts.wings;
      wings.forEach((w) => (w.visible = false));
      const sv = engine.sky.position.clone();
      engine.sky.position.copy(engine.cubeCam.position);
      engine.cubeCam.update(engine.renderer, engine.scene);
      engine.sky.position.copy(sv);
      wings.forEach((w) => (w.visible = true));
    }
  }

  // ------------------------------------------------------------------ clock + controls
  let T = parseFloat(params.get('t') || '0');
  let playing = !RECORD && !params.has('t');
  let last = performance.now();
  const hud = document.getElementById('hud');
  if (params.has('hud')) hud.hidden = false;
  const bounds = SCENES.map((s) => s.t0).concat([DURATION]);

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (playing) {
      T += dt;
      if (T >= DURATION) { T = DURATION; playing = false; }
    }
    update(T);
    engine.render(dt);
    if (!hud.hidden) {
      const sc = SCENES.find((s) => T >= s.t0 && T < s.t1) || SCENES[SCENES.length - 1];
      hud.textContent = `${T.toFixed(2)}s  ·  scene ${sc.id} ${sc.name}  ·  ${playing ? 'playing' : 'paused'}`;
    }
    if (!RECORD) requestAnimationFrame(frame);
  }

  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); playing = !playing; if (T >= DURATION) T = 0; }
    else if (e.code === 'ArrowRight') { T = bounds.find((b) => b > T + 0.01) ?? DURATION; }
    else if (e.code === 'ArrowLeft') { const prev = bounds.filter((b) => b < T - 0.25); T = prev.length ? prev[prev.length - 1] : 0; }
    else if (e.code === 'KeyR') { T = 0; playing = true; }
    else if (e.code === 'KeyH') { hud.hidden = !hud.hidden; }
  });

  // debug camera override: ?cam=x,y,z,tx,ty,tz,fov,shift (feet)
  if (params.has('cam')) {
    const v = params.get('cam').split(',').map(Number);
    director.override = { pos: ft(v[0], v[1], v[2]), target: ft(v[3], v[4], v[5]), fov: v[6] || 35, shiftY: v[7] || 0 };
  }

  // wait for every texture the timeline will need
  await new Promise((res) => {
    const m = THREE.DefaultLoadingManager;
    if (!m.itemsLoaded || m.itemsLoaded >= m.itemsTotal) setTimeout(res, 50);
    m.onLoad = () => res();
    setTimeout(res, 8000);
  });
  await document.fonts.ready;
  engine.updateEnv(true);
  update(T);

  // recording API (scripts/record.mjs)
  window.__lff = {
    duration: DURATION, fps: FPS, ready: true, ctx,
    renderAt(t) { update(t); engine.render(1 / FPS); return engine.renderer.info.render.calls; },
    renderFrame(i) { const t = i / FPS; update(t); engine.render(1 / FPS); return t; },
  };
  document.body.dataset.ready = '1';
  if (!RECORD) requestAnimationFrame(frame);
}

boot().catch((e) => {
  console.error(e);
  document.body.dataset.error = String(e && e.stack || e);
});
