import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  DepthOfFieldEffect,
  SMAAEffect,
  VignetteEffect,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { master } from './core/timeline.js';
import { setLineResolution } from './core/lines.js';
import { environment } from './core/materials.js';
import { SCENES, DURATION, FPS } from './data.js';
import * as energy from './scenes/s1_energy.js';
import * as ambition from './scenes/s2_ambition.js';
import * as drivers from './scenes/s3_drivers.js';
import * as nest from './scenes/s4_nest.js';
import * as reveal from './scenes/s5_reveal.js';

const params = new URLSearchParams(location.search);
const RECORD = params.has('record');
const START = parseFloat(params.get('t') || '0');
// QA stills: ?still=p26 renders the finished massing from the deck's Plaza View camera
const STILL = params.get('still');

const stage = document.getElementById('stage');
const canvasEl = document.getElementById('gl');
const grainEl = document.getElementById('grain');
const fadeEl = document.getElementById('fade');

// --- renderer -------------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas: canvasEl,
  antialias: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: RECORD,
  stencil: false,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor('#000000', 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(12, 16 / 9, 5, 40000);
scene.add(camera);
camera.layers.enable(1); // layer 1 = camera-attached plates (kept out of mirror passes)
scene.environment = environment(renderer);

// One camera for the whole film. Scenes tween this rig on the master timeline.
const rig = { x: 0, y: 0, z: 3000, tx: 0, ty: 0, tz: 0, fov: 12, roll: 0 };
function applyRig() {
  camera.fov = rig.fov;
  camera.position.set(rig.x, rig.y, rig.z);
  camera.up.set(Math.sin(rig.roll), Math.cos(rig.roll), 0);
  camera.lookAt(rig.tx, rig.ty, rig.tz);
  camera.updateProjectionMatrix();
}

// --- post -----------------------------------------------------------------------------------
const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
composer.addPass(new RenderPass(scene, camera));
const ao = new N8AOPostPass(scene, camera, 1920, 1080);
ao.configuration.aoRadius = 24;
ao.configuration.distanceFalloff = 1.2;
ao.configuration.intensity = 2.2;
ao.configuration.halfRes = true;
ao.configuration.gammaCorrection = false;
ao.setQualityMode('Medium');
composer.addPass(ao);
const dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 900, worldFocusRange: 900, bokehScale: 1.6 });
const dofPass = new EffectPass(camera, dof);
dofPass.enabled = false;
composer.addPass(dofPass);
const bloom = new BloomEffect({ luminanceThreshold: 0.82, luminanceSmoothing: 0.18, intensity: 0.55, mipmapBlur: true, radius: 0.6 });
const vignette = new VignetteEffect({ darkness: 0.38, offset: 0.32 });
const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
composer.addPass(new EffectPass(camera, bloom, tone, vignette, new SMAAEffect()));

const post = { ao, dof, dofPass, bloom, vignette };

// --- sizing ---------------------------------------------------------------------------------
let pixelRatio = 1;
function resize() {
  const s = RECORD ? 1 : Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
  pixelRatio = RECORD ? devicePixelRatio : Math.min(2, Math.max(0.5, s * devicePixelRatio));
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(1920, 1080, false);
  composer.setSize(1920, 1080, false);
  setLineResolution(1920 * pixelRatio, 1080 * pixelRatio, pixelRatio);
}
addEventListener('resize', resize);
resize();

// --- film grain (deterministic, above both WebGL and type) ----------------------------------
const grainTiles = [];
{
  let s = 99;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 8; k++) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 150;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    grainTiles.push(`url(${c.toDataURL()})`);
  }
}
function grain(frame) {
  grainEl.style.backgroundImage = grainTiles[frame % grainTiles.length];
  grainEl.style.backgroundPosition = `${(frame * 97) % 256}px ${(frame * 57) % 256}px`;
}

// --- assets ---------------------------------------------------------------------------------
const loader = new THREE.TextureLoader();
const REF = [
  'p04_crowd.jpg',
  'p05_sign.jpg',
  'p05_fan.jpg',
  'p05_train.jpg',
  'p05_cityhall.jpg',
  'p06_aerial.jpg',
  'p06_map_lines.png',
  'p07_skyline.jpg',
  'p09_bg.jpg',
  'p10_past.jpg',
  'p10_contemporary.jpg',
  'p10_future.jpg',
  'p10_faithful.jpg',
];
async function loadAssets() {
  const tex = {};
  await Promise.all(
    REF.map(
      (f) =>
        new Promise((res, rej) =>
          loader.load(
            `ref/${f}`,
            (t) => {
              t.colorSpace = f.endsWith('lines.png') ? THREE.NoColorSpace : THREE.SRGBColorSpace;
              t.anisotropy = 8;
              tex[f.replace(/\.(jpg|png)$/, '')] = t;
              res();
            },
            undefined,
            rej,
          ),
        ),
    ),
  );
  // Official marks only if the team supplied them (reference/brand → public/brand).
  tex.logo = await new Promise((res) => loader.load('brand/logo.png', (t) => ((t.colorSpace = THREE.SRGBColorSpace), res(t)), undefined, () => res(null)));
  return tex;
}

// --- clock ----------------------------------------------------------------------------------
const clock = { t: START, playing: !RECORD, frame: Math.round(START * FPS) };
let modules = [];

function setTime(t) {
  clock.t = Math.min(DURATION, Math.max(0, t));
  master.time(clock.t, true);
}

function render(dt = 1 / FPS) {
  const t = clock.t;
  applyRig();
  post.ao.enabled = false; // scenes with solid geometry switch it on
  scene.fog = null;
  post.dofPass.enabled = false;
  if (ctxRef.section) ctxRef.section.visible = false; // owned by scenes 1–2 inside their windows
  for (const m of modules) {
    const on = t >= m.window[0] && t < m.window[1];
    const rw = m.rootWindow ?? m.window;
    if (m.root) m.root.visible = t >= rw[0] && t < rw[1];
    m.cam.visible = t >= rw[0] && t < rw[1];
    if (m.layer) m.layer.style.display = on ? 'block' : 'none';
    if (on) m.update(t, dt);
  }
  if (STILL && ctxRef.stills?.[STILL]) {
    const p = ctxRef.stills[STILL];
    camera.position.set(...p.pos);
    camera.fov = p.fov;
    camera.lookAt(...p.target);
    camera.updateProjectionMatrix();
    document.getElementById('overlay').style.visibility = 'hidden';
    fadeState.v = 0;
  }
  fadeEl.style.opacity = String(fadeState.v);
  // plates ride on layer 1 so reflector cameras never see them
  camera.traverse((o) => o.isMesh && o.userData.u && o.layers.set(1));
  grain(clock.frame);
  composer.render(dt);
}
const fadeState = { v: 0 };
let ctxRef = {};

async function boot() {
  const tex = await loadAssets();
  await document.fonts.ready;
  await Promise.all(['300', '400', '500', '600', '700', '900'].map((w) => document.fonts.load(`${w} 40px "Hanken Grotesk"`)));
  await Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 40px "Oswald"`)));
  const ctx = { THREE, scene, camera, rig, renderer, tex, post, fade: fadeState };
  ctxRef = ctx;
  modules = [energy, ambition, drivers, nest, reveal].map((m, i) => {
    const s = SCENES[i];
    // each scene's camera-attached plates live in their own group so they switch off with it
    ctx.cam = new THREE.Group();
    camera.add(ctx.cam);
    const built = m.build(ctx, s);
    return { window: built.window ?? [s.start, s.end], cam: ctx.cam, ...built };
  });
  // compile everything once so no frame stalls on a shader compile
  modules.forEach((m) => m.root && (m.root.visible = true));
  renderer.compile(scene, camera);
  setTime(clock.t);
  render();
  window.__nest.ready = true;
  if (!RECORD) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches && !params.has('motion')) storyboard();
    else loop();
  }
}

let lastNow = 0;
function loop(now = performance.now()) {
  const dt = Math.min(1 / 20, (now - lastNow) / 1000 || 1 / FPS);
  lastNow = now;
  if (clock.playing) {
    setTime(clock.t + dt);
    clock.frame++;
    if (clock.t >= DURATION) clock.playing = false;
  }
  render(dt);
  requestAnimationFrame(loop);
}

// --- controls -------------------------------------------------------------------------------
addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    clock.playing = !clock.playing;
    if (clock.t >= DURATION) setTime(0);
  } else if (e.code === 'ArrowRight') {
    const next = SCENES.find((s) => s.start > clock.t + 0.01);
    setTime(next ? next.start : DURATION);
  } else if (e.code === 'ArrowLeft') {
    const cur = [...SCENES].reverse().find((s) => s.start <= clock.t);
    const idx = SCENES.indexOf(cur);
    setTime(clock.t - cur.start < 0.75 && idx > 0 ? SCENES[idx - 1].start : cur.start);
  } else if (e.code === 'KeyR') {
    setTime(0);
    clock.playing = true;
  } else return;
  e.preventDefault();
});

// --- static storyboard for prefers-reduced-motion -------------------------------------------
async function storyboard() {
  const sb = document.getElementById('storyboard');
  sb.hidden = false;
  stage.style.visibility = 'hidden';
  sb.innerHTML = '<h1>THE NEST — storyboard</h1>';
  const btn = document.createElement('button');
  btn.textContent = 'Play the animation';
  btn.onclick = () => {
    sb.hidden = true;
    stage.style.visibility = 'visible';
    setTime(0);
    clock.playing = true;
    loop();
  };
  sb.appendChild(btn);
  const frames = [
    [5, 'House of Energy · Higher Amplitude'],
    [11.8, 'The bowl is the waveform (p34 long section)'],
    [21, 'A Generational Transformation'],
    [25.5, 'Generational Grit.'],
    [30, 'Hyper Local'],
    [35, 'Give More Than You Take'],
    [40, 'The Nest'],
    [50, 'Material language'],
    [58, 'Our Architecture'],
    [63, 'Our Identity'],
    [72, 'Assembly'],
    [78.5, 'The Eagles are Philly, and Philly is the Eagles.'],
  ];
  for (const [t, caption] of frames) {
    setTime(t);
    render();
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = renderer.domElement.toDataURL('image/jpeg', 0.85);
    img.alt = caption;
    const cap = document.createElement('figcaption');
    cap.textContent = `${t.toFixed(1)} s — ${caption}`;
    fig.append(img, cap);
    sb.appendChild(fig);
  }
}

// --- record API (used by scripts/record.mjs) ------------------------------------------------
window.__nest = {
  ready: false,
  fps: FPS,
  duration: DURATION,
  frames: Math.round(DURATION * FPS),
  scenes: SCENES,
  // Render exactly frame i (t = i / 60). Resolves after the browser has painted it.
  async frame(i) {
    clock.frame = i;
    setTime(i / FPS);
    render(1 / FPS);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  },
  seek(t) {
    setTime(t);
    render();
  },
};

boot();
