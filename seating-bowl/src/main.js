import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import '@fontsource/hanken-grotesk/800.css';
import '@fontsource/hanken-grotesk/900.css';
import '@fontsource/hanken-grotesk/700-italic.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { createStage, W, H } from './stage.js';
import { makeMaterials, CUT, SLICE } from './three/materials.js';
import { buildModel } from './three/model.js';
import { buildField } from './three/field.js';
import { buildPlans } from './three/plan.js';
import { buildCrowd } from './three/crowd.js';
import { buildLadder } from './three/ladder.js';
import { buildDust } from './three/dust.js';
import { grainDataURL } from './overlay/svg.js';
import { C } from './palette.js';
import { SCENES, DURATION } from './scenes/index.js';

const FPS = 60;
const q = new URLSearchParams(location.search);
const RECORD = q.get('record') === '1';
const frameEl = document.getElementById('frame');
if (RECORD) document.body.classList.add('record');

// Letterbox the fixed 1920x1080 frame into the window (record mode: 1:1).
function fit() {
  const s = RECORD ? 1 : Math.min(innerWidth / W, innerHeight / H);
  frameEl.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
  if (RECORD) frameEl.style.transform = 'none';
}
addEventListener('resize', fit);
fit();

async function loadFonts() {
  const weights = [400, 500, 600, 700, 800, 900];
  await Promise.all(weights.map((w) => document.fonts.load(`${w} 40px "Hanken Grotesk"`, '0123456789,ABCabc')));
  await document.fonts.ready;
}

async function init() {
  await loadFonts();
  const stage = createStage(document.getElementById('gl'), { dpr: Number(q.get('dpr')) || window.devicePixelRatio || 1 });
  const { scene } = stage;
  document.getElementById('grain').style.backgroundImage = `url(${grainDataURL()})`;

  const M = makeMaterials();
  for (const m of M.hatchAll) m.userData.uniforms.uDpr.value = stage.dpr;
  const model = buildModel(M);
  const field = buildField();
  const plans = buildPlans();
  const ladder = buildLadder();
  const dust = buildDust();
  const p = model.parts;
  const seatParts = ['LO_E2', 'LO_W2', 'LO_N2', 'LO_S2A', 'LO_S2B', 'ROWS_S', 'CL_E2', 'CL_W2', 'CL_SE2', 'CL_SW2',
    'SWEEP_NE', 'SWEEP_NW', 'UP_E', 'UP_W', 'UP_SE', 'UP_SW'];
  const crowd = buildCrowd(seatParts.map((n) => p[n].tier.seats(2.4, 1)), { density: 0.8 });
  scene.add(model.root, field.group, plans.p37.group, plans.p42.group, crowd.mesh, ladder.group, dust.points);
  for (const n of model.match(/^RIB_/)) stage.bloom.selection.add(p[n].mesh);

  const svg = document.getElementById('overlay');
  const cover = document.getElementById('cover');
  const grain = document.getElementById('grain');
  const tl = gsap.timeline({ paused: true });
  const ctx = { THREE, stage, scene, model, field, plans, ladder, crowd, dust, M, svg, tl, C, CUT, SLICE, grain, q };

  // each scene draws into its own overlay layer; only the active one is shown
  for (const s of SCENES) {
    s.layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    s.layer.setAttribute('id', `scene-${s.id}`);
    svg.appendChild(s.layer);
    s.build({ ...ctx, svg: s.layer });
  }
  tl.set({}, {}, DURATION); // pad the master timeline to the full length

  function resetWorld() {
    model.preset('existing');
    model.root.visible = true;
    model.root.scale.set(1, 1, 1);
    field.group.visible = true;
    field.group.position.y = 0;
    field.planMat.opacity = 0;
    field.clay.visible = true;
    field.clay.material = field.clayMat;
    plans.p37.group.visible = false;
    plans.p42.group.visible = false;
    crowd.mesh.visible = false;
    ladder.group.visible = false;
    dust.points.visible = false;
    stage.sky.visible = false;
    scene.background.set(C.paper);
    stage.dof.bokehScale = 0;
    stage.bloom.intensity = 2.2;
    CUT.constant = 1e5;
    SLICE.constant = 1e5;
    grain.style.opacity = 0.07;
  }

  let t = Math.max(0, Number(q.get('t')) || 0);
  let playing = !RECORD && q.get('paused') !== '1';
  const sceneAt = (time) => SCENES.find((s) => time >= s.start && time < s.end) || SCENES[SCENES.length - 1];

  function renderAt(time) {
    tl.time(Math.min(time, DURATION), true);
    resetWorld();
    const s = sceneAt(time);
    const lt = time - s.start;
    for (const sc of SCENES) sc.layer.style.display = sc === s ? '' : 'none';
    const mode = s.frame(ctx, time, lt) || {};
    stage.applyRig();
    if (mode.render) mode.render(ctx);
    else stage.render({ post: mode.post !== false });
    if (s.after) s.after(ctx, time, lt);
    // dip to the next scene's ground at every cut (0.18 s out, 0.3 s in)
    let c = 0;
    for (const sc of SCENES) {
      if (sc.start > 0) c = Math.max(c, 1 - Math.min(1, Math.abs(time - sc.start) / (time < sc.start ? 0.18 : 0.3)));
    }
    cover.style.opacity = c.toFixed(3);
    cover.style.background = sceneAt(time + 0.2).ground || C.paper;
  }

  // QA overlay (?qa=56 shows p-056.png at 50%)
  if (q.get('qa')) {
    const img = document.getElementById('qa');
    img.src = `/reference/pages/p-${String(q.get('qa')).padStart(3, '0')}.png`;
    img.style.display = 'block';
    img.style.opacity = q.get('qaOpacity') || 0.5;
  }

  // controls
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { playing = !playing; e.preventDefault(); }
    if (e.code === 'KeyR') t = 0;
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      const i = SCENES.indexOf(sceneAt(t));
      const j = THREE.MathUtils.clamp(i + (e.code === 'ArrowRight' ? 1 : -1), 0, SCENES.length - 1);
      t = SCENES[j].start + 0.001;
    }
  });

  // deterministic frame stepping for the recorder
  window.__film = {
    fps: FPS, duration: DURATION, frames: Math.round(DURATION * FPS),
    scenes: SCENES.map(({ id, name, start, end }) => ({ id, name, start, end })),
    renderFrame(f) { t = f / FPS; renderAt(t); return true; },
    renderTime(s) { t = s; renderAt(t); return true; },
  };

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (playing) { t += dt; if (t >= DURATION) { t = DURATION - 1e-3; playing = false; } }
    renderAt(t);
    requestAnimationFrame(tick);
  }
  renderAt(t);
  window.__ready = true;
  if (!RECORD) requestAnimationFrame(tick);
}

init().catch((err) => {
  console.error(err);
  window.__error = String(err && err.stack || err);
});
