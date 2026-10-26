// HKS · Lincoln Financial Field · Prompt 4 — The Occupiable Videoboard.
// Live: Space play/pause · ←/→ ±5 s · R restart · 1/2/3 skin options (Q&A) · 0 back to the
// timeline's skins · Q quality · H hide the dev bar.
// Record: ?record=1 exposes window.__renderAt(t) for scripts/record.mjs (manual clock).
import * as THREE from 'three';
import './style.css';
import { Environment } from './world/env.js';
import { Stadium } from './world/stadium.js';
import { BoardVolume } from './world/volumes.js';
import { Ribbons } from './world/ribbons.js';
import { DraftingWorld } from './scenes/drafting.js';
import { ContentTexture } from './content/content.js';
import { ledShared } from './materials/led.js';
import { Post } from './post.js';
import { Hud } from './hud.js';
import { buildTimeline, frame, DURATION, sceneAt } from './timeline.js';
import { CrowdAudio } from './audio/audio.js';
import { COLORS } from './data.js';

const params = new URLSearchParams(location.search);
const RECORD = params.has('record');
const store = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
let quality = params.get('q') || (store && store.getItem('lff-quality')) || 'high';
if (RECORD) document.body.classList.add('record');

// ---- layout: a 16:9 stage fitted to the window (or exactly 1920×1080 when recording)
const stage = document.getElementById('stage');
function layout() {
  let w = window.innerWidth, h = window.innerHeight;
  if (RECORD) {
    w = 1920;
    h = 1080;
  } else if (w / h > 16 / 9) w = Math.round((h * 16) / 9);
  else h = Math.round((w * 9) / 16);
  stage.style.setProperty('--stage-w', `${w}px`);
  stage.style.setProperty('--stage-h', `${h}px`);
  document.documentElement.style.setProperty('--stage-w', `${w}px`);
  return { w, h };
}

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: RECORD, stencil: false });
renderer.setPixelRatio(RECORD ? window.devicePixelRatio : Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false; // see timeline.frame(): updated only when needed
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---- worlds
const scene = new THREE.Scene();
const env = new Environment(scene);
const stadium = new Stadium({ quality });
scene.add(stadium.group);
const north = new BoardVolume('north', { quality });
const south = new BoardVolume('south', { quality });
scene.add(north.group, south.group);
const ribbons = new Ribbons();
scene.add(ribbons.group);
// facade boards seen on the p66 massing (teal glass, massing scenes only)
const facade = new THREE.Group();
{
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.glassTeal), transparent: true, opacity: 0.55, depthWrite: false });
  const e = new THREE.LineBasicMaterial({ color: new THREE.Color('#7FE3DA') });
  for (const [x, y, z, w, h, d] of [
    [312, 105, 168, 6, 170, 46],
    [312, 150, -120, 6, 70, 22],
  ]) {
    const g = new THREE.BoxGeometry(w, h, d);
    const b = new THREE.Mesh(g, m);
    b.position.set(x, y, z);
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(g), e);
    l.position.copy(b.position);
    facade.add(b, l);
  }
  facade.visible = false;
  scene.add(facade);
}
const draft = new DraftingWorld();

const content = new ContentTexture(renderer);
ledShared.tContent.value = content.texture;
draft.setContent(content.texture);
stadium.existingScreen.material = new THREE.MeshBasicMaterial({ map: content.texture, toneMapped: false });

const camA = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 20000);
const camB = new THREE.PerspectiveCamera(56, 8 / 9, 0.05, 20000);

let { w: W, h: H } = layout();
const dpr = renderer.getPixelRatio();
renderer.setSize(W, H, false);
const post = new Post(renderer, scene, camA, camB, { quality, width: W * dpr, height: H * dpr });
post.setSize(W, H);
const hud = new Hud(document.getElementById('hud'));

const ctx = {
  renderer,
  world: { scene, stadium, north, south, ribbons, facade },
  draft,
  env,
  content,
  post,
  hud,
  camA,
  camB,
  quality,
  live: { skin: null, skinFrom: null, skinT: 0 },
  cutPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 70),
};
const { tl, S } = buildTimeline(ctx);

window.addEventListener('resize', () => {
  ({ w: W, h: H } = layout());
  renderer.setSize(W, H, false);
  post.setSize(W, H);
});

// ---- manual clock
let t = Number(params.get('t') || 0);
let playing = !RECORD && !params.has('paused');
let last = performance.now();
const audio = new CrowdAudio();

function renderAt(time) {
  t = Math.min(DURATION, Math.max(0, time));
  tl.seek(t, false);
  frame(ctx, S, t);
  post.render(1 / 60);
}

// dev bar
const dev = {
  time: document.getElementById('dev-time'),
  scene: document.getElementById('dev-scene'),
  skin: document.getElementById('dev-skin'),
  q: document.getElementById('dev-q'),
  fps: document.getElementById('dev-fps'),
};
let fpsAcc = 0, fpsN = 0, fpsT = performance.now();

function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (playing) {
    t += dt;
    if (t >= DURATION) {
      t = DURATION;
      playing = false;
    }
  }
  renderAt(t);
  audio.update(t, playing);
  fpsAcc += dt;
  fpsN++;
  if (now - fpsT > 500) {
    dev.fps.textContent = `${Math.round(fpsN / fpsAcc)} fps`;
    fpsAcc = 0;
    fpsN = 0;
    fpsT = now;
  }
  const sc = sceneAt(t);
  dev.time.textContent = `${t.toFixed(2)} s`;
  dev.scene.textContent = `Scene ${sc.id} · ${sc.name}`;
  dev.skin.textContent = ctx.live.skin ? `skin: option ${ctx.live.skin} (live)` : 'skin: timeline';
  dev.q.textContent = `quality: ${quality}`;
  requestAnimationFrame(loop);
}

// ---- controls
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    playing = !playing;
    audio.resume();
    if (t >= DURATION) t = 0;
    e.preventDefault();
  } else if (e.code === 'ArrowRight') t = Math.min(DURATION, t + 5);
  else if (e.code === 'ArrowLeft') t = Math.max(0, t - 5);
  else if (e.code === 'KeyR') {
    t = 0;
    playing = true;
    audio.resume();
  } else if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    const opt = Number(e.code.slice(-1));
    ctx.live.skinFrom = ctx.live.skin || 1;
    ctx.live.skin = opt;
    ctx.live.skinT = performance.now() / 1000;
  } else if (e.code === 'Digit0') ctx.live.skin = null;
  else if (e.code === 'KeyQ') {
    quality = quality === 'high' ? 'low' : 'high';
    try {
      store && store.setItem('lff-quality', quality);
    } catch {
      /* storage unavailable */
    }
    applyQuality();
  } else if (e.code === 'KeyH') document.body.classList.toggle('nodev');
});

// Quality: strip density (pitch), MSAA, AO samples, shadows, pixel ratio.
function applyQuality() {
  ctx.quality = quality;
  ledShared.uPitch.value = quality === 'high' ? 1.0 : 2.0;
  post.composer.multisampling = quality === 'high' ? 4 : 0;
  post.ao.configuration.aoSamples = quality === 'high' ? 16 : 8;
  post.ao.configuration.halfRes = quality !== 'high';
  renderer.shadowMap.enabled = quality === 'high';
  if (!RECORD) renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
  renderer.setSize(W, H, false);
  post.setSize(W, H);
  north.rebuildStrips?.();
}
applyQuality();

// ---- start
await document.fonts.load('800 100px "Hanken Grotesk"');
await document.fonts.load('300 100px "Hanken Grotesk"');
await document.fonts.ready;

if (RECORD) {
  // Render, then wait two animation frames so the compositor presents this frame before
  // the recorder captures it (otherwise the capture can show the previous frame).
  window.__renderAt = (time) =>
    new Promise((resolve) => {
      renderAt(time);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
    });
  window.__duration = DURATION;
  // QA: render time t from an explicit camera, without the HUD (scripts/qa-overlays.mjs)
  window.__renderQA = (time, pos, look, fov, near = 0.05) =>
    new Promise((resolve) => {
      document.getElementById('hud').style.visibility = 'hidden';
      renderAt(time);
      camA.position.set(...pos);
      camA.lookAt(...look);
      camA.fov = fov;
      camA.near = near; // a near-plane cutaway, like the p63 section render
      camA.aspect = 16 / 9;
      camA.updateProjectionMatrix();
      camA.updateMatrixWorld();
      renderer.shadowMap.needsUpdate = true;
      post.render(1 / 60);
      camA.near = 0.05;
      camA.updateProjectionMatrix();
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
    });
  window.__raw = (time) => {
    renderAt(time);
    renderer.setRenderTarget(null);
    renderer.render(scene, camA);
  };
  window.__debug = () => ({ camA: camA.position.toArray().map((v) => +v.toFixed(1)), fov: camA.fov, aspect: camA.aspect, camB: camB.position.toArray().map((v) => +v.toFixed(1)) });
  window.__ready = true;
  renderAt(t);
} else {
  requestAnimationFrame(loop);
}
