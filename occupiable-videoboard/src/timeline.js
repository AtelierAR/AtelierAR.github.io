// Master timeline (≈90 s). GSAP 3 tweens a single state object on a paused timeline that is
// seeked from a manual clock; `frame()` maps that state onto the world, post stack and HUD.
// Scene times follow the storyboard; Scene 3 runs 0:24–0:38.5 so the three north options get
// their 3.5 s each plus the 4 s south beat, and Scene 4 is shortened to 0:38.5–0:46.
import * as THREE from 'three';
import gsap from 'gsap';
import { CamPath, setCam } from './camera.js';
import { FACE, NORTH, SOUTH, OPTIONS, RIBBONS, FLOORS, CALLOUTS, TOTAL_VIDEOBOARD_SF, FACADE_BOARDS_SF, WAVEFORM, fmt } from './data.js';
import { feetInches } from './geometry/face.js';
import { ledShared } from './materials/led.js';
import { energy, amplitude, crowd, TOUCHDOWN_T } from './audio/envelope.js';

export const DURATION = 90;
export const SCENES = [
  { id: 1, name: 'The billboard', t0: 0, t1: 8 },
  { id: 2, name: 'Drawing the board', t0: 8, t1: 24 },
  { id: 3, name: 'Three skins', t0: 24, t1: 38.5 },
  { id: 4, name: 'The network', t0: 38.5, t1: 46 },
  { id: 5, name: 'Through the pixels', t0: 46, t1: 66 },
  { id: 6, name: 'Touchdown', t0: 66, t1: 82 },
  { id: 7, name: 'Close', t0: 82, t1: 90 },
];
export const sceneAt = (t) => SCENES.find((s) => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1];

const SKIN = {
  1: [0, 0, 0], // all clear
  2: [1, 0, 0], // hybrid: traditional canvas, clear wings/band, clear remaining faces
  3: [1, 1, 1], // all traditional
};
export const skinVec = (opt) => SKIN[opt];

// skin option timing in Scene 3
const OPT_N = [
  { opt: 1, t: 24.0 },
  { opt: 2, t: 27.5 },
  { opt: 3, t: 31.0 },
];
const OPT_S = [
  { opt: 1, t: 34.5 },
  { opt: 2, t: 35.8 },
  { opt: 3, t: 37.1 },
];
const WIPE = 0.7;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const win = (t, a, b, f = 0.4) => smooth(a, a + f, t) * (1 - smooth(b - f, b, t));

export function buildTimeline(ctx) {
  const S = {
    world: 'stadium',
    night: 1,
    house: 0.12,
    dip: 0,
    c: { feather: 1, burst: 0, rest: 0, wave: 0, power: 1, flicker: 0, text: 0 },
    led: { emissive: 2.4, glass: 0, glassGlow: 0, flood: 0 },
    vis: { existing: 1, north: 0, south: 0, ribbons: 0, facade: 0, fly: 0 },
    split: 1,
    // Scene 2 drafting state
    draft: { canvasLine: 0, wingLine: 0, bandLine: 0, faceLinesO: 0, canvasFill: 0, wingFill: 0, bandFill: 0, northK: 0, southK: 0, unfold: 0, northO: 0, southO: 0, gridO: 0 },
    counter: { v: 0, o: 0 },
    ribbon: { on: 0, idle: 0 },
    card: { o: 0 },
    endO: 0,
  };
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut', immediateRender: false } });
  // chronological per-property helper: `from` is always the previous value of that property
  const last = new Map();
  const key = (o, p) => `${ctx.ids.get(o) ?? (ctx.ids.set(o, ctx.ids.size), ctx.ids.get(o))}.${p}`;
  const to = (obj, prop, value, at, dur = 0.5, ease = 'sine.inOut') => {
    const k = key(obj, prop);
    const from = last.has(k) ? last.get(k) : obj[prop];
    last.set(k, value);
    if (dur <= 0) tl.set(obj, { [prop]: value }, at);
    else tl.fromTo(obj, { [prop]: from }, { [prop]: value, duration: dur, ease }, at);
  };
  ctx.ids = new Map();

  // ---------------- Scene 1 — The billboard (0–8)
  to(S.c, 'flicker', 1, 2.9, 0.15, 'none');
  to(S.c, 'power', 0.35, 3.0, 0.5, 'steps(6)');
  to(S.c, 'power', 0, 3.8, 0.4, 'power2.in');
  to(S.c, 'flicker', 0, 4.2, 0.01, 'none');
  to(S, 'dip', 1, 7.55, 0.45, 'power1.in');

  // ---------------- Scene 2 — Drawing the board (8–24)
  to(S, 'world', 'draft', 8.0, 0);
  to(S.c, 'power', 1, 8.0, 0);
  to(S.vis, 'existing', 0, 8.0, 0);
  to(S, 'dip', 0, 8.0, 0.5, 'power1.out');
  to(S.draft, 'gridO', 1, 8.0, 0.8);
  to(S.draft, 'faceLinesO', 1, 8.4, 0);
  to(S.draft, 'canvasLine', 1, 8.6, 1.2, 'power2.inOut');
  to(S.draft, 'canvasFill', 0.85, 9.7, 0.7);
  to(S.counter, 'o', 1, 9.6, 0.4);
  to(S.counter, 'v', FACE.canvas.areaSF, 9.8, 0.8, 'power2.out');
  to(S.draft, 'wingLine', 1, 10.7, 0.9, 'power2.inOut');
  to(S.draft, 'wingFill', 0.75, 11.4, 0.6);
  to(S.draft, 'bandLine', 1, 12.2, 0.8, 'power2.inOut');
  to(S.draft, 'bandFill', 0.75, 12.8, 0.6);
  to(S.counter, 'v', FACE.areaSF, 12.9, 0.8, 'power2.out');
  // extrude 155' (north)
  to(S.draft, 'northO', 1, 13.7, 0.3);
  to(S.draft, 'northK', 1, 14.1, 1.7, 'power2.inOut');
  to(S.draft, 'canvasFill', 0, 14.0, 0.8);
  to(S.draft, 'wingFill', 0, 14.0, 0.8);
  to(S.draft, 'bandFill', 0, 14.0, 0.8);
  to(S.draft, 'faceLinesO', 0, 15.3, 0.5);
  // unfold as a box net, labelled; then fold back
  to(S.draft, 'unfold', 1, 16.5, 1.1, 'power2.inOut');
  to(S.counter, 'v', NORTH.totalSF, 17.0, 1.0, 'power2.out');
  to(S.draft, 'unfold', 0, 19.15, 0.8, 'power2.inOut');
  // south volume extrudes 109'
  to(S.draft, 'southO', 1, 19.7, 0.3);
  to(S.draft, 'southK', 1, 20.0, 1.2, 'power2.inOut');
  to(S.counter, 'v', NORTH.totalSF + SOUTH.totalSF, 20.6, 0.8, 'power2.out');
  // fly into the massing axon (p66)
  to(S, 'dip', 1, 21.4, 0.35, 'power1.in');
  to(S, 'world', 'stadium', 21.75, 0);
  to(S, 'night', 0, 21.75, 0);
  to(S, 'house', 1, 21.75, 0);
  to(S.led, 'glass', 1, 21.75, 0);
  to(S.led, 'glassGlow', 0.35, 21.75, 0);
  to(S.vis, 'north', 1, 21.75, 0);
  to(S.vis, 'south', 1, 21.75, 0);
  to(S.vis, 'facade', 1, 21.75, 0);
  to(S.vis, 'fly', 1, 21.75, 0);
  to(S, 'dip', 0, 21.75, 0.4, 'power1.out');
  to(S.vis, 'fly', 0, 21.8, 1.5, 'power3.out');
  to(S.counter, 'v', TOTAL_VIDEOBOARD_SF, 22.6, 0.9, 'power2.out');
  to(S, 'dip', 1, 23.75, 0.25, 'power1.in');

  // ---------------- Scene 3 — Three skins (24–38.5)
  to(S.led, 'glass', 0, 24.0, 0);
  to(S.led, 'glassGlow', 0, 24.0, 0);
  to(S.vis, 'facade', 0, 24.0, 0);
  to(S.counter, 'o', 0, 24.0, 0);
  to(S.led, 'emissive', 1.9, 24.0, 0);
  to(S, 'dip', 0, 24.0, 0.3, 'power1.out');
  to(S.card, 'o', 1, 24.2, 0.5);
  to(S, 'dip', 1, 34.3, 0.2, 'power1.in');
  to(S, 'dip', 0, 34.5, 0.25, 'power1.out');
  to(S.card, 'o', 0, 38.1, 0.35);

  // ---------------- Scene 4 — The network (38.5–46)
  to(S, 'dip', 1, 38.25, 0.25, 'power1.in');
  to(S.led, 'glass', 1, 38.5, 0);
  to(S.led, 'glassGlow', 0.6, 38.5, 0);
  to(S, 'dip', 0, 38.5, 0.3, 'power1.out');
  to(S.ribbon, 'on', 1, 38.5, 0);
  to(S, 'dip', 1, 45.75, 0.25, 'power1.in');

  // ---------------- Scene 5 — Through the pixels (46–66)
  to(S.led, 'glass', 0, 46.0, 0);
  to(S.led, 'glassGlow', 0, 46.0, 0);
  to(S.led, 'emissive', 2.1, 46.0, 0);
  to(S, 'dip', 0, 46.0, 0.35, 'power1.out');
  to(S.ribbon, 'idle', 1, 46.0, 0);
  to(S, 'dip', 1, 65.8, 0.2, 'power1.in');

  // ---------------- Scene 6 — Touchdown (66–82): night, split
  to(S, 'night', 1, 66.0, 0);
  to(S, 'house', 1, 66.0, 0);
  to(S.led, 'emissive', 2.6, 66.0, 0);
  to(S, 'split', 0.5, 66.0, 0);
  to(S, 'dip', 0, 66.0, 0.3, 'power1.out');
  to(S.c, 'burst', 1, TOUCHDOWN_T, 0.12, 'power2.out');
  to(S.c, 'feather', 0.3, TOUCHDOWN_T, 0.12, 'power2.out');
  to(S.c, 'text', 1, TOUCHDOWN_T + 0.05, 0.25, 'power2.out');
  to(S.c, 'text', 0, TOUCHDOWN_T + 3.6, 0.6);
  to(S.c, 'burst', 0.25, TOUCHDOWN_T + 5.0, 3.0);
  to(S.c, 'feather', 1, TOUCHDOWN_T + 5.0, 3.0);

  // ---------------- Scene 7 — Close (82–90)
  to(S, 'split', 1, 82.0, 1.4, 'power2.inOut');
  to(S.c, 'burst', 0, 82.0, 1.5);
  to(S.c, 'feather', 0.2, 83.0, 2.5);
  to(S.c, 'rest', 1, 83.0, 2.5);
  to(S, 'night', 0.42, 82.5, 5.0);
  to(S.led, 'glassGlow', 0.5, 84.0, 2.5);
  to(S.led, 'glass', 0.35, 84.0, 2.5);
  to(S.ribbon, 'idle', 0.4, 84.0, 2.0);
  to(S, 'endO', 1, 86.2, 0.9, 'power2.out');

  tl.set({}, {}, DURATION);
  return { tl, S };
}

// ------------------------------------------------------------------------------------
// Camera paths
// North volume field face: bottom (0, 62, −292) · top (0, 171, −283) · club floor y 74.
export const PATHS = {
  s1: new CamPath([
    { t: 0, pos: [0, 5.8, 172], look: [0, 92, -300], fov: 46 },
    { t: 8, pos: [0, 6.4, 140], look: [0, 96, -300], fov: 44 },
  ]),
  // Field-level frames solved by scripts/fit-cameras.mjs so the field face lands where
  // p70 / p71 draw it (see qa/).
  p70: [-72, 6, -5.75],
  p70look: [36.88, 53.84, -281.17],
  p70fov: 72.3,
  p71: [72.2, 6.5, 86],
  p71look: [-30.17, 109.63, 348.46],
  p71fov: 66,
  s4: new CamPath([
    { t: 38.5, pos: [760, 1040, 900], look: [0, 30, -20], fov: 32 },
    { t: 46, pos: [880, 980, 760], look: [0, 30, -40], fov: 31 },
  ]),
  s5: new CamPath(
    [
      { t: 46.0, pos: [0, 7, 10], look: [0, 112, -288], fov: 50 },
      { t: 49.5, pos: [0, 30, -110], look: [0, 100, -290], fov: 50 },
      { t: 52.5, pos: [0, 68, -228], look: [0, 82, -300], fov: 52 },
      { t: 54.6, pos: [0, 79.2, -279], look: [0, 79.5, -320], fov: 56 },
      { t: 55.8, pos: [0, 79.5, -294], look: [0, 79.5, -340], fov: 58 },
      { t: 57.2, pos: [0.5, 79.5, -306], look: [2, 79, -350], fov: 58 },
      { t: 58.6, pos: [-6, 79.5, -320], look: [-2, 72, -210], fov: 56 },
      { t: 60.4, pos: [18, 79.5, -317], look: [6, 66, -160], fov: 54 },
      { t: 61.6, pos: [78, 80.5, -322], look: [10, 82, -330], fov: 52 },
      { t: 62.6, pos: [140, 98, -332], look: [10, 100, -338], fov: 50 },
      { t: 63.6, pos: [144, 146, -336], look: [10, 122, -338], fov: 50 },
      { t: 64.5, pos: [136, 66, -330], look: [20, 46, -322], fov: 52 },
      { t: 65.3, pos: [52, 39.5, -326], look: [0, 30, -200], fov: 56 },
      { t: 66.0, pos: [0, 39.5, -328], look: [0, 14, -120], fov: 58 },
    ],
    { tension: 0.5 },
  ),
  s6out: new CamPath([
    { t: 66, pos: [250, 360, -1080], look: [-10, 70, -230], fov: 36 },
    { t: 82, pos: [170, 330, -1000], look: [-10, 70, -220], fov: 35 },
  ]),
  s6in: new CamPath([
    { t: 66, pos: [-3, 79.5, -318], look: [-1, 64, -150], fov: 58 },
    { t: 82, pos: [2, 79.5, -313], look: [1, 63, -150], fov: 56 },
  ]),
  s7: new CamPath([
    { t: 82, pos: [170, 330, -1000], look: [-10, 70, -220], fov: 35 },
    { t: 84.6, pos: [300, 190, -160], look: [0, 90, -292], fov: 44 },
    { t: 87.4, pos: [-73, 6, -2], look: [36.88, 53.84, -281.17], fov: 72.3 },
    { t: 90, pos: [-72, 6, -5.75], look: [36.88, 53.84, -281.17], fov: 72.3 },
  ]),
  // drafting cameras
  d: new CamPath(
    [
      { t: 8.0, pos: [0, 56, 760], look: [0, 56, 0], fov: 20 },
      { t: 13.6, pos: [0, 56, 740], look: [0, 56, 0], fov: 20 },
      { t: 15.8, pos: [470, 300, 560], look: [-10, 40, -70], fov: 23 },
      { t: 16.6, pos: [300, 160, 1100], look: [0, 60, -40], fov: 23 },
      { t: 17.6, pos: [0, 70, 1420], look: [0, 70, 0], fov: 22 },
      { t: 19.0, pos: [0, 70, 1440], look: [0, 70, 0], fov: 22 },
      { t: 20.0, pos: [700, 360, 820], look: [160, 40, -60], fov: 25 },
      { t: 21.75, pos: [760, 380, 760], look: [170, 40, -60], fov: 25 },
    ],
    { tension: 0.4 },
  ),
  s2axon: new CamPath([
    { t: 21.75, pos: [980, 420, 260], look: [0, 50, -60], fov: 34 },
    { t: 24.0, pos: [1000, 440, 180], look: [0, 50, -60], fov: 34 },
  ]),
};

// ------------------------------------------------------------------------------------
// Per-frame mapping from state → world. `ctx.live` carries Q&A overrides (skin keys).
const tmpV = new THREE.Vector3();

export function frame(ctx, S, t) {
  const { world, draft, hud, post, content, env, camA, camB } = ctx;
  const sc = sceneAt(t);
  const north = world.north, south = world.south;

  // ---- content programme
  const u = content.uniforms;
  u.uFeather.value = S.c.feather;
  u.uBurst.value = S.c.burst;
  u.uRest.value = S.c.rest;
  u.uWave.value = S.c.wave;
  u.uPower.value = S.c.power;
  u.uFlicker.value = S.c.flicker;
  u.uEnergy.value = energy(t);
  u.uText.value = S.c.text;
  content.setText(t > 66 && t < 82 ? [{ text: 'TOUCHDOWN', size: 230, weight: 800, tracking: 6 }] : []);
  content.render(t);

  // ---- environment
  env.set(S.night, S.house);
  world.stadium.existingBoard.visible = S.vis.existing > 0.5;
  world.stadium.existingScreen.material.color.setScalar(0.95 * S.c.power + 0.01);
  env.boardGlow.intensity = sc.id === 1 ? 140 * S.c.power : S.night > 0.5 ? 380 * (0.4 + energy(t)) : 0;
  env.boardGlow.position.set(0, 110, sc.id === 1 ? -300 : -270);

  // ---- LED shared
  ledShared.uEmissive.value = S.led.emissive * (1 + 0.25 * S.night);
  ledShared.uGlass.value = S.led.glass;
  ledShared.uGlassGlow.value = S.led.glassGlow;
  ledShared.uNight.value = S.night;
  ledShared.uFlood.value = sc.id === 6 ? Math.max(0, energy(t) - 0.35) * 1.4 : 0;

  // ---- skins (Scene 3 sequence, otherwise option 2 hybrid as the narrative default,
  //      overridden live by keys 1/2/3)
  let from = SKIN[1], to = SKIN[1], wipe = 1;
  const seq = t < 34.5 ? OPT_N : OPT_S;
  if (sc.id === 3) {
    let i = 0;
    while (i + 1 < seq.length && t >= seq[i + 1].t) i++;
    const cur = seq[i];
    from = i > 0 ? SKIN[seq[i - 1].opt] : SKIN[cur.opt];
    to = SKIN[cur.opt];
    wipe = i > 0 ? clamp01((t - cur.t) / WIPE) : 1;
    S._opt = cur.opt;
  } else {
    from = to = SKIN[1];
    S._opt = null;
  }
  if (ctx.live.skin) {
    const L = ctx.live;
    from = SKIN[L.skinFrom || L.skin];
    to = SKIN[L.skin];
    wipe = clamp01((performance.now() / 1000 - L.skinT) / WIPE);
  }
  ledShared.uSkinFrom.value.set(...from);
  ledShared.uSkinTo.value.set(...to);
  ledShared.uWipe.value = wipe;

  // ---- volumes visibility & fly-in (Scene 2 → p66 axon)
  north.group.visible = S.vis.north > 0.5 || sc.id >= 3;
  south.group.visible = S.vis.south > 0.5 || sc.id >= 3;
  if (sc.id <= 1) north.group.visible = south.group.visible = false;
  const fly = S.vis.fly;
  north.group.position.set(-180 * fly, 900 * fly, 520 * fly);
  south.group.position.set(-300 * fly, 1100 * fly, -380 * fly);
  north.group.rotation.y = 0.6 * fly;
  south.group.rotation.y = -0.5 * fly;
  world.facade.visible = S.vis.facade > 0.5;
  // interior shows only when it can be seen
  const interior = sc.id === 5 || sc.id === 6 || (sc.id === 3 && S._opt !== 3) || sc.id === 7;
  north.club.group.visible = interior;
  for (const l of north.club.lights) l.intensity = interior ? (S.night > 0.5 ? 140 : 380) : 0;
  north.plates.visible = sc.id !== 2 || t > 21.7;

  // ---- ribbons (Scene 4 chase, Scene 6 whip)
  world.ribbons.setAll((ru, r) => {
    // the network diagram (Scene 4) draws the 3' runs 3.5× taller so they read from the
    // aerial; labels carry the true linear feet
    r.mesh.scale.y = sc.id === 4 ? 3.5 : 1;
    ru.uBoost.value = sc.id === 4 ? 2.2 : 1;
    ru.uTime.value = t;
    ru.uIdle.value = sc.id >= 5 ? S.ribbon.idle : 0;
    ru.uOn.value = sc.id >= 4 ? 1 : 0;
    // chase: west runs 1–4 light south→north, then east 5–8 north→south
    const start = 39.0 + (r.n - 1) * 0.78;
    ru.uHead.value = sc.id === 4 ? clamp01((t - start) / 1.3) * 1.02 : sc.id >= 5 ? 1.02 : 0;
    ru.uEnergy.value = sc.id === 6 ? Math.max(0, energy(t) - 0.3) * 1.3 : 0;
    ru.uWhip.value = (t - TOUCHDOWN_T) * 0.9 + (r.side === 'east' ? 0.5 : 0);
  });

  // ---- section cut of the north volume (Scene 5, rising through the floors)
  const cut = sc.id === 5 && t > 60.2 && t < 65.9;
  north.setClipping(cut ? [ctx.cutPlane] : []);
  ctx.cutPlane.constant = 70; // keep x < 70 (east part of the skin removed)

  // ---- pass-through strips (Scene 5)
  const f = north.faces.front;
  let stripFade = 0;
  if (sc.id === 5 || sc.id === 6) {
    const dist = Math.abs(tmpV.copy(camA.position).sub(f.center).dot(f.n));
    stripFade = sc.id === 6 ? 1 : 1 - smooth(70, 120, dist);
  }
  north.strips.visible = stripFade > 0.001;
  north.stripMat.uniforms.uFade.value = stripFade;
  f.mesh.material.uniforms.uFade.value = 1 - stripFade;

  // ---- cameras
  let split = S.split;
  post.renderPass.split = split;
  ctx.scene3d = S.world === 'draft' ? draft.scene : world.scene;
  post.renderPass.scene = ctx.scene3d;
  post.ao.scene = ctx.scene3d;
  const aspectA = (16 / 9) * split;
  const aspectB = (16 / 9) * (1 - split);
  if (Math.abs(camA.aspect - aspectA) > 1e-5) {
    camA.aspect = aspectA;
    camA.updateProjectionMatrix();
  }
  if (split < 0.999 && Math.abs(camB.aspect - aspectB) > 1e-5) {
    camB.aspect = Math.max(0.05, aspectB);
    camB.updateProjectionMatrix();
  }

  if (sc.id === 1) PATHS.s1.sample(t, camA);
  else if (sc.id === 2) {
    if (S.world === 'draft') PATHS.d.sample(t, camA);
    else PATHS.s2axon.sample(t, camA);
  } else if (sc.id === 3) {
    const k = t < 34.5 ? (t - 24) / 10.5 : (t - 34.5) / 4;
    // a slow 6' dolly so the frame breathes while the skins change
    if (t < 34.5) setCam(camA, [PATHS.p70[0] + 1.5 * (k - 0.5), PATHS.p70[1], PATHS.p70[2] + 6 * (k - 0.5)], PATHS.p70look, PATHS.p70fov);
    else setCam(camA, [PATHS.p71[0] - 1.5 * (k - 0.5), PATHS.p71[1], PATHS.p71[2] - 5 * (k - 0.5)], PATHS.p71look, PATHS.p71fov);
  } else if (sc.id === 4) PATHS.s4.sample(t, camA);
  else if (sc.id === 5) PATHS.s5.sample(t, camA);
  else if (sc.id === 6) {
    PATHS.s6out.sample(t, camA);
    PATHS.s6in.sample(t, camB);
  } else {
    PATHS.s7.sample(t, camA);
    PATHS.s6in.sample(Math.min(t, 82), camB);
  }

  camA.updateMatrixWorld();
  camB.updateMatrixWorld();

  // ---- post
  const day = 1 - S.night;
  post.ao.enabled = S.world === 'stadium' && day > 0.5 && split > 0.999 && ctx.quality === 'high';
  post.ao.configuration.intensity = 2.0 * day;
  let bokeh = 0, ca = 0, focus = 200, range = 200;
  if (sc.id === 5) {
    const d = Math.abs(tmpV.copy(camA.position).sub(f.center).dot(f.n));
    const k = win(t, 51.5, 57.0, 1.6);
    bokeh = 2.4 * k;
    focus = Math.max(4, d);
    range = Math.max(6, d * 0.35);
    ca = 0.6 * win(t, 53.4, 56.6, 1.2);
  }
  post.setDOF(focus, range, bokeh);
  post.setCA(ca);
  post.bloom.intensity = 0.6 + 0.25 * S.night + (sc.id === 6 ? 0.45 * energy(t) : 0);

  // ---- figures: arms up with the crowd
  const e = sc.id === 6 ? clamp01((energy(t) - 0.35) * 1.6) : 0;
  for (const fg of north.club.figures) {
    const lift = clamp01(e * (0.8 + 0.2 * Math.sin(fg.phase)) - 0.05 * Math.sin(t * 6 + fg.phase));
    for (const arm of fg.arms) arm.rotation.z = arm.userData.side * (0.12 + lift * 2.75);
    fg.g.position.y = (fg.g.userData.baseY ??= fg.g.position.y) + (sc.id === 6 ? Math.max(0, Math.sin(t * 9 + fg.phase)) * 0.6 * e : 0);
  }

  // ---- plaza wash (p26) from the plaza-facing face during the touchdown
  env.plazaLight.intensity = S.night > 0.5 ? 1.6e5 * (0.25 + energy(t)) : 0;

  // ---- shadows: static sun, so re-render the shadow map only when the scene changes or
  //      the volumes are moving (fly-in)
  const shadowKey = `${sc.id}|${S.world}|${S.night > 0.95}|${S.vis.fly > 0.0005 ? t.toFixed(3) : ''}|${north.group.visible}`;
  if (shadowKey !== ctx.shadowKey) {
    ctx.renderer.shadowMap.needsUpdate = true;
    ctx.shadowKey = shadowKey;
  }

  // ---- drafting world
  if (S.world === 'draft') draft.update(S.draft);

  // ---- HUD
  hudFrame(ctx, S, t, sc);
}

// ------------------------------------------------------------------------------------
function hudFrame(ctx, S, t, sc) {
  const { hud, camA, camB, draft } = ctx;
  hud.begin();
  // full-frame dip
  hud.rect(0, 0, 1920, 1080, { fill: sc.id >= 2 && sc.id < 3 ? '#082a2f' : '#000', o: S.dip });

  // Scene 1 — statements (// PROPOSED COPY) and the p4 TODAY line as a sound cue
  if (sc.id === 1) {
    // PROPOSED COPY
    hud.show('s1a', 'statement', 'A screen you <b>watch.</b>', { o: win(t, 0.9, 3.5, 0.5), y: 760 });
    // PROPOSED COPY
    hud.show('s1b', 'statement', 'A building you <b>enter.</b>', { o: win(t, 4.6, 7.7, 0.5), y: 760 });
    const p = smooth(3.9, 6.6, t);
    const pts = WAVEFORM.today.map(([x, y]) => [140 + x * 2 * 1640, 600 - y * 52]);
    const cut = 140 + p * 1640;
    const vis = [];
    for (let i = 0; i < pts.length; i++) {
      if (pts[i][0] <= cut) vis.push(pts[i]);
      else {
        const a = pts[i - 1], b = pts[i];
        const k = (cut - a[0]) / (b[0] - a[0]);
        vis.push([cut, a[1] + (b[1] - a[1]) * k]);
        break;
      }
    }
    hud.polyline(vis, { stroke: '#E7ECEC', w: 3, dash: '12 10', o: win(t, 3.9, 7.6, 0.4) * 0.85 });
    hud.text(140, 560, 'TODAY', { size: 18, weight: 600, anchor: 'start', o: win(t, 4.1, 7.6, 0.4) * 0.8, tracking: 3 });
  }

  // Scene 2 — dimension strings, counters, face labels
  if (sc.id === 2) {
    const cam = camA;
    const L = draft.layout;
    const g = draft.faceGroup;
    g.updateWorldMatrix(true, false);
    const P = (x, y) => hud.project(new THREE.Vector3(x, y, 0.6).applyMatrix4(g.matrixWorld), cam);
    if (S.world === 'draft') {
      const dimO = 1 - smooth(13.8, 14.4, t);
      hud.dim(P(L.canvas.x0, L.canvas.y1), P(L.canvas.x1, L.canvas.y1), `${feetInches(164)}`, { off: 34, side: -1, p: smooth(9.3, 10.3, t), o: dimO });
      hud.dim(P(L.canvas.x0, L.canvas.y0), P(L.canvas.x0, L.canvas.y1), `${feetInches(92.25)}`, { off: 34, side: 1, p: smooth(9.5, 10.5, t), o: dimO * (1 - smooth(11.0, 11.4, t)) });
      hud.dim(P(L.wingL.x0, L.wingL.y1), P(L.wingL.x1, L.wingL.y1), `25'`, { off: 34, side: -1, p: smooth(11.0, 11.8, t), o: dimO });
      hud.dim(P(L.wingR.x0, L.wingR.y1), P(L.wingR.x1, L.wingR.y1), `25'`, { off: 34, side: -1, p: smooth(11.0, 11.8, t), o: dimO });
      hud.dim(P(L.wingL.x0, L.wingL.y1), P(L.wingR.x1, L.wingR.y1), `214'`, { off: 92, side: -1, p: smooth(11.4, 12.2, t), o: dimO });
      hud.dim(P(L.wingL.x0, L.canvas.y0), P(L.wingL.x0, L.canvas.y1), `${feetInches(92.25)}`, { off: 40, side: 1, p: smooth(11.3, 12.0, t), o: dimO });
      hud.dim(P(L.band.x0, L.band.y0), P(L.band.x0, L.band.y1), `${feetInches(17.25)}`, { off: 40, side: 1, p: smooth(12.6, 13.3, t), o: dimO });
      hud.dim(P(L.band.x1, L.band.y0), P(L.band.x1, L.band.y1 + 92.25), `${feetInches(109.5)}`, { off: 44, side: -1, p: smooth(12.8, 13.5, t), o: dimO });
      const c = P(0, (L.canvas.y0 + L.canvas.y1) / 2);
      if (c) hud.text(c.x, c.y, '16:9', { size: 34, weight: 300, o: smooth(9.8, 10.4, t) * dimO });
      // 155' along the top east edge as it extrudes
      const nv = draft.north;
      const a = hud.project(nv.vertexWorld('tfe'), cam), b = hud.project(nv.vertexWorld('tke'), cam);
      hud.dim(a, b, `155'`, { off: 36, side: 1, p: smooth(14.6, 15.8, t), o: win(t, 14.5, 16.4, 0.3) });
      // net labels (p67 values)
      const lo = win(t, 17.3, 19.2, 0.4);
      for (const k of ['front', 'back', 'top', 'bottom', 'east', 'west']) {
        const w = nv.faceCenterWorld(k);
        hud.show3d(`net-${k}`, 'facelabel', `${NORTH.faceNames[k]}<span class="v">${fmt(NORTH.faces[k])} SF</span>`, w, cam, { o: lo, center: true });
      }
      hud.show('net-title', 'kicker', 'North videoboard · face areas (p67)', { o: lo, x: 84, y: 120 });
      // south labels (p68)
      const so = win(t, 20.6, 21.6, 0.3);
      const sv = draft.south;
      for (const k of ['front', 'top', 'east']) {
        const w = sv.faceCenterWorld(k);
        hud.show3d(`snet-${k}`, 'facelabel', `${SOUTH.faceNames[k]}<span class="v">${fmt(SOUTH.faces[k])} SF</span>`, w, cam, { o: so, center: true });
      }
      const listS = ['back', 'bottom', 'west'].map((k) => `${SOUTH.faceNames[k]} ${fmt(SOUTH.faces[k])}`).join(' · ');
      hud.show('snet-list', 'kicker', `South videoboard (p68) · 109' deep · ${listS} SF`, { o: so, x: 84, y: 120 });
      const sa = hud.project(sv.vertexWorld('tfe'), cam), sb = hud.project(sv.vertexWorld('tke'), cam);
      hud.dim(sa, sb, `109'`, { off: 30, side: 1, p: smooth(20.2, 21.0, t), o: win(t, 20.1, 21.6, 0.3) });
    }
    // running SF counter
    const steps = [
      [8.6, 'Traditional LED canvas'],
      [12.8, 'Field face · + 8,304 SF clear LED'],
      [16.9, 'North volume (p67, p70)'],
      [20.5, '+ South volume (p68, p71)'],
      [22.5, '+ Facade boards (p66) · Total videoboard area'],
    ];
    let cap = steps[0][1];
    for (const [ts, c] of steps) if (t >= ts) cap = c;
    hud.show(
      'counter',
      'counter',
      `<span class="cap">${cap}</span><span class="num">${fmt(S.counter.v)}</span><span class="unit">SF</span>`,
      { o: S.counter.o, x: 84, y: 860 },
    );
    if (t > 21.75) hud.show('p66', 'kicker', 'Massing axon · after p66', { o: smooth(21.9, 22.3, t), x: 84, y: 120 });
    if (t > 23.0) hud.show('total-note', 'kicker', `of videoboard`, { o: smooth(23.0, 23.4, t), x: 84, y: 1010 });
  }

  // Scene 3 — option card (p70 / p71)
  if (sc.id === 3) {
    const board = t < 34.5 ? NORTH : SOUTH;
    const optHtml = OPTIONS.map(
      (o) =>
        `<div class="opt${S._opt === o.id ? '' : ' dim-opt'}"><div class="h">${o.title}</div>${o.lines(board).join('<br>')}</div>`,
    ).join('');
    hud.show(`card-${board.key}`, 'card', `<div class="t0">${board.key === 'north' ? 'North' : 'South'} video board options</div>${optHtml}`, { o: S.card.o });
    // dimension strings on the field face (p70 style)
    const vol = t < 34.5 ? ctx.world.north : ctx.world.south;
    const lp = (x, y) => {
      const fr = vol.faces.front;
      const o = vol.toWorld([0, 0, 0]);
      const up = vol.toWorld(vol.local.tfe).sub(vol.toWorld(vol.local.bfe)).normalize();
      return hud.project(o.clone().addScaledVector(fr.u, x).addScaledVector(up, y), camA);
    };
    const dO = win(t, sc.t0 + 0.4, 34.3, 0.4) + win(t, 34.6, 38.3, 0.4);
    hud.dim(lp(-107, 109.5), lp(-82, 109.5), `25'`, { off: 26, side: -1, p: 1, o: dO, size: 22 });
    hud.dim(lp(-82, 109.5), lp(82, 109.5), `164'`, { off: 26, side: -1, p: 1, o: dO, size: 22 });
    hud.dim(lp(82, 109.5), lp(107, 109.5), `25'`, { off: 26, side: -1, p: 1, o: dO, size: 22 });
    hud.dim(lp(-107, 17.25), lp(-107, 109.5), `${feetInches(92.25)}`, { off: 30, side: 1, p: 1, o: dO, size: 22 });
    hud.dim(lp(-107, 0), lp(-107, 17.25), `${feetInches(17.25)}`, { off: 30, side: 1, p: 1, o: dO, size: 22 });
  }

  // Scene 4 — ribbon legend + labels in order
  if (sc.id === 4) {
    const legend = RIBBONS.map((r) => {
      const on = smooth(39.0 + (r.n - 1) * 0.78, 39.3 + (r.n - 1) * 0.78, t);
      return `<div class="row" style="opacity:${(0.25 + 0.75 * on).toFixed(3)}"><span class="n">${r.n}</span>${r.name}: <b>${r.lf} LF</b></div>`;
    }).join('');
    // PROPOSED COPY
    const msg = `<div class="msg" style="opacity:${smooth(44.6, 45.2, t).toFixed(3)}">One continuous digital ring with two inhabitable hearts.</div>`;
    hud.show('ribbon-legend', 'ribbon-legend', `<div class="t0">Ribbon boards</div>${legend}${msg}`, { o: win(t, 38.6, 45.9, 0.4) });
    for (const r of ctx.world.ribbons.runs) {
      const on = smooth(39.4 + (r.n - 1) * 0.78, 39.8 + (r.n - 1) * 0.78, t);
      hud.show3d(`rl-${r.n}`, 'label3d dark', `<span class="tick"></span>${r.name}<span class="lf">${r.lf} LF</span>`, r.mid, camA, {
        o: on * win(t, 38.6, 45.9, 0.3),
        dx: r.side === 'west' ? -14 : 14,
        dy: (((r.n - 1) % 4) - 1.5) * 30,
        right: r.side === 'west',
      });
    }
  }

  // Scene 5 — club callout, floor labels, super vom callout
  if (sc.id === 5) {
    const co = win(t, 58.7, 61.2, 0.5);
    hud.show('club-callout', 'callout', CALLOUTS.club.map((s, i) => (i ? `<span class="sep">·</span>${s}` : `<b>${s}</b>`)).join(''), { o: co, x: 120, y: 900 });
    hud.show('club-src', 'kicker', 'Video board club — club level · p97–99', { o: co * 0.9, x: 120, y: 860 });
    const north = ctx.world.north;
    for (const lv of north.plateLevels) {
      const wy = lv.worldY;
      const camY = camA.position.y;
      const passing = sc.id === 5 && t > 61.4 && t < 64.2 ? smooth(wy - 40, wy - 8, camY) * (1 - smooth(64.0, 64.3, t)) : 0;
      const anchor = north.toWorld([70, lv.y, Math.min(60, Math.max(...lv.poly.map((p) => p[1])) - 10)]);
      hud.show3d(`floor-${lv.key}`, 'floorlabel', lv.label, anchor, camA, { o: passing, dx: 0 });
    }
    const vo = win(t, 64.9, 66.0, 0.3);
    hud.show('vom-callout', 'callout', CALLOUTS.superVom.map((s, i) => (i ? `<span class="sep">·</span>${s}` : `<b>${s}</b>`)).join(''), { o: vo, x: 120, y: 900 });
    hud.show('vom-src', 'kicker', 'p51 · p87', { o: vo * 0.9, x: 120, y: 860 });
  }

  // Scene 6 — split line, tags, waveform
  if (sc.id === 6 || (sc.id === 7 && S.split < 0.999)) {
    const x = 1920 * S.split;
    hud.rect(x - 1, 0, 2, 1080, { fill: '#fff', o: 1 });
    const to = sc.id === 6 ? win(t, 66.2, 81.8, 0.4) : 1 - smooth(82, 82.6, t);
    hud.show('tag-out', 'side-tag', 'Outside · the bowl', { o: to, x: 60, y: 54 });
    hud.show('tag-in', 'side-tag', 'Inside · video board club', { o: to, x: x + 60, y: 54 });
  }
  if (sc.id === 6 || (sc.id === 7 && t < 83.5)) {
    const wo = sc.id === 6 ? win(t, 66.3, 82, 0.5) : 1 - smooth(82.0, 83.0, t);
    drawWave(hud, t, wo);
  }

  // Scene 7 — end card (// PROPOSED COPY)
  if (sc.id === 7) {
    // PROPOSED COPY — "first occupiable videoboard in the NFL" is a claim that MUST be
    // verified by the HKS team before the presentation.
    hud.show(
      'endcard',
      'endcard',
      `The first <b>occupiable videoboard</b> in the NFL.<span class="src">Lincoln Financial Field · HKS · Concept Pricing Package · Oct 22, 2026</span>`,
      { o: S.endO, y: 820 },
    );
  }

  hud.end();
}

// The p4 waveform across the bottom: the dashed TODAY line, then the green RENOVATED BOWL
// zigzag whose amplitude jumps with the score; both breathe with the same crowd envelope.
function drawWave(hud, t, o) {
  if (o <= 0.001) return;
  const amp = amplitude(t);
  const e = crowd(t);
  const x0 = 120, x1 = 1800, yc = 990;
  const todayPts = WAVEFORM.today.map(([x, y]) => [x0 + x * (x1 - x0), yc - y * 34 * (0.7 + 0.6 * e)]);
  const renPts = WAVEFORM.renovated.map(([x, y]) => [x0 + x * (x1 - x0), yc - y * (10 + 56 * amp) * (0.85 + 0.3 * e)]);
  hud.polyline(todayPts, { stroke: '#E7ECEC', w: 3, dash: '12 10', o: o * 0.9 });
  hud.polyline(renPts, { stroke: amp > 0.05 ? '#3CCB5A' : '#9fb0b0', w: 3 + 2 * amp, o: o * (0.55 + 0.45 * amp) });
  const xs = x0 + WAVEFORM.renovated[0][0] * (x1 - x0);
  hud.line(xs, yc - 70, xs, yc + 70, { stroke: '#fff', w: 1.4, dash: '3 6', o: o * 0.7 });
  hud.text(x0, yc - 56, WAVEFORM.before, { size: 16, weight: 600, anchor: 'start', o: o * 0.85, tracking: 3 });
  hud.text(xs + 18, yc + 58, WAVEFORM.after, { size: 16, weight: 600, anchor: 'start', fill: '#3CCB5A', o: o * (0.4 + 0.6 * amp), tracking: 3 });
}
