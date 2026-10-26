import * as THREE from 'three';
import { DRIVERS } from '../data.js';
import { C } from '../palette.js';
import { P6_STADIUM } from '../ref.js';
import { to, EASE } from '../core/timeline.js';
import { layer, el, textBlock, typeOn, wordsIn, show, hide, scrim, wrapBalanced } from '../core/overlay.js';
import { fromTo } from '../core/timeline.js';
import { plate, placeOnScreen, fieldPlate, backdrop, COVER_GLSL, PLATE_VERT } from '../core/plates.js';

// Scene 3 — design drivers. Three rhythmic full-frame cards, each with its own motion grammar:
// torn-paper parallax (p5), lines converging on the stadium (p6), condensed type slamming in (p7).

export function build(ctx, S) {
  const { camera, tex, rig } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  const cam = ctx.cam;
  const T1 = S.start; // grit
  const T2 = S.start + 4.4; // hyper local
  const T3 = S.start + 8.8; // give more
  const L = layer('drivers');

  const black = fieldPlate('#000000', '#06100f', -170);
  cam.add(black);
  const st = { black: 0, grit: 0, gritOut: 0, local: 0, reveal: 0, rim: 0, pulse: 0, localZoom: 1, localOut: 0, give: 0, giveOut: 0 };
  to(st, T1 - 0.15, 0.35, { black: 1 }, 'power2.out');

  // camera keeps breathing behind the cards so the move never stops
  to(rig, S.start + 0.8, S.end - S.start - 0.8, { x: 380, z: 560, fov: 42 }, 'power1.inOut');

  // --- 1 · Generational Grit (p5) -----------------------------------------------------------
  const quads = [
    { key: 'p05_sign', r: [0, 27, 667, 576], from: [-760, 0], drift: [18, -6], rot: -0.012, depth: 0.6 },
    { key: 'p05_fan', r: [669, 27, 1251, 576], from: [0, -640], drift: [-26, 8], rot: 0.006, depth: 1.0 },
    { key: 'p05_train', r: [0, 605, 667, 475], from: [0, 620], drift: [24, 10], rot: 0.01, depth: 0.8 },
    { key: 'p05_cityhall', r: [669, 605, 1251, 475], from: [900, 0], drift: [-14, -10], rot: -0.007, depth: 0.45 },
  ].map((q, i) => {
    const m = plate(tex[q.key], { torn: 1, seed: i * 7.3, halftone: 0.3, duotone: 0.28, dark: '#031518', light: '#d3e2e2', contrast: 1.06, order: -150 + i });
    cam.add(m);
    const s = { k: 0, d: 0 };
    to(s, T1 + 0.05 + i * 0.18, 1.0, { k: 1 }, EASE.type);
    to(s, T1 + 0.5, 4.0, { d: 1 }, 'power1.inOut');
    return { ...q, m, s };
  });
  const grit = textBlock(L, DRIVERS.grit, { left: '0', width: '1920px', textAlign: 'center', top: '528px', fontSize: '52px', fontWeight: '900', letterSpacing: '0.005em' });
  const gritScrim = scrim(L, { left: '560px', top: '470px', width: '800px', height: '170px', background: 'radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0))' });
  show(gritScrim, T1 + 0.9, 0.6);
  fromTo(grit, T1 + 1.0, 0.9, { opacity: 0, scale: 1.35, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)' }, EASE.type);
  grit.chars.forEach((c) => (c.style.opacity = '1'));
  hide(grit, T2 - 0.45, 0.4);
  hide(gritScrim, T2 - 0.45, 0.4);
  to(st, T2 - 0.5, 0.5, { gritOut: 1 }, 'power2.in');

  // --- 2 · Hyper Local (p6) -----------------------------------------------------------------
  const aerial = plate(tex.p06_aerial, { duotone: 0.72, dark: '#02171a', light: '#86b5b4', brightness: 0.62, contrast: 1.1, vignette: 0.8, order: -140 });
  aerial.userData.u.focus.value.set(P6_STADIUM.u, 1 - P6_STADIUM.v);
  cam.add(aerial);
  const linesMat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex.p06_map_lines },
      imageAspect: { value: tex.p06_map_lines.image.width / tex.p06_map_lines.image.height },
      planeAspect: { value: 16 / 9 },
      zoom: { value: 1 },
      focus: { value: new THREE.Vector2(P6_STADIUM.u, 1 - P6_STADIUM.v) },
      pan: { value: new THREE.Vector2() },
      reveal: { value: 0 },
      rim: { value: 0 },
      pulse: { value: 0 },
      opacity: { value: 0 },
      teal: { value: new THREE.Color(C.glass) },
      river: { value: new THREE.Color(C.river) },
    },
    vertexShader: PLATE_VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float imageAspect, planeAspect, zoom, reveal, rim, pulse, opacity;
      uniform vec2 focus, pan; uniform vec3 teal, river; varying vec2 vUv;
      ${COVER_GLSL}
      void main() {
        vec2 uv = coverUv(vUv, imageAspect, planeAspect, zoom, focus, pan);
        vec3 m = texture2D(map, uv).rgb;
        // distance to the stadium, aspect-correct, normalised so the farthest corner of the city ≈ 1
        vec2 d = (uv - focus) * vec2(imageAspect, 1.0);
        float r = length(d) / 1.15;
        // boundaries arrive from the city edge and converge on South Philadelphia
        float showB = smoothstep(1.0 - reveal, 1.0 - reveal + 0.05, r) * step(0.001, reveal);
        float showR = smoothstep(1.0 - rim, 1.0 - rim + 0.08, r) * step(0.001, rim);
        vec3 col = vec3(0.0); float a = 0.0;
        a += m.b * 0.45 * showR; col += river * m.b * 0.45 * showR;
        a += m.r * 0.9 * showB; col += teal * m.r * 0.9 * showB;
        a += m.g * showR; col += mix(teal, vec3(0.92, 1.0, 0.98), 0.55) * m.g * showR;
        // the stadium pulses once
        float ring = abs(length(d) - pulse * 0.16);
        float pr = (1.0 - smoothstep(0.0, 0.004, ring)) * (1.0 - pulse) * step(0.001, pulse);
        float dotS = 1.0 - smoothstep(0.004, 0.0065, length(d));
        col += vec3(0.9, 1.0, 0.97) * (pr * 1.4 + dotS * rim);
        a += pr + dotS * rim;
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * opacity);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  backdrop(linesMat);
  const mapLines = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), linesMat);
  mapLines.renderOrder = -139;
  mapLines.frustumCulled = false;
  mapLines.userData.u = linesMat.uniforms;
  linesMat.uniforms.res = { value: new THREE.Vector2(1920, 1080) };
  cam.add(mapLines);
  to(st, T2 - 0.4, 0.6, { local: 1 }, 'power2.out');
  to(st, T2, 4.4, { localZoom: 1.09 }, 'power1.inOut');
  to(st, T2 + 0.4, 1.4, { rim: 1 }, EASE.move);
  to(st, T2 + 0.8, 2.4, { reveal: 1 }, EASE.move);
  to(st, T2 + 3.1, 1.0, { pulse: 1 }, 'power2.out');
  to(st, T3 - 0.45, 0.45, { localOut: 1 }, 'power2.in');

  // p6 title band
  const band = el('div', 'abs', L, { left: '0', top: '0', width: '1920px', height: '190px', background: C.mapBand, opacity: '0' });
  fromTo(band, T2 - 0.1, 0.8, { opacity: 1, y: -190 }, { y: 0 }, EASE.type);
  const local = textBlock(band, DRIVERS.local, { left: '0', width: '1820px', textAlign: 'center', top: '22px', fontFamily: 'var(--cond)', fontSize: '150px', lineHeight: '1', fontWeight: '700', color: C.mapTitle, letterSpacing: '0.005em' });
  fromTo(local, T2 + 0.25, 0.8, { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1 }, EASE.type);
  local.chars.forEach((c) => (c.style.opacity = '1'));
  hide(band, T3 - 0.45, 0.4);

  // --- 3 · Give More Than You Take (p7) ------------------------------------------------------
  const giveBg = fieldPlate('#020f11', '#0d4249', -130);
  cam.add(giveBg);
  const skyline = plate(tex.p07_skyline, { duotone: 0.9, dark: '#021215', light: '#8ab7b4', brightness: 0.95, opacity: 0, order: -129 });
  cam.add(skyline);
  to(st, T3 - 0.4, 0.6, { give: 1 }, 'power2.out');
  to(st, S.end - 0.35, 0.4, { giveOut: 1 }, 'power2.in');
  const sk = { pan: 0 };
  to(sk, T3, 5.2, { pan: 1 }, 'power1.inOut');
  const skyScrim = scrim(L, { left: '0', top: '560px', width: '1920px', height: '220px', background: 'linear-gradient(180deg, rgba(4,30,34,1), rgba(4,30,34,0))' });
  show(skyScrim, T3 - 0.4, 0.6);

  const G = DRIVERS.give;
  const eyebrow = textBlock(L, G.eyebrow, { left: '0', width: '1920px', textAlign: 'center', top: '30px', fontSize: '26px', fontWeight: '500', letterSpacing: '0.42em', color: '#dfe7e7' });
  typeOn(eyebrow, T3 + 0.05, { per: 0.02 });
  const slam = (txt, top, size, at) => {
    const b = textBlock(L, txt, { left: '0', width: '1920px', textAlign: 'center', top: `${top}px`, fontFamily: 'var(--cond)', fontWeight: '600', fontSize: `${size}px`, lineHeight: '1', letterSpacing: '0.012em' });
    b.chars.forEach((c) => (c.style.opacity = '1'));
    fromTo(b, at, 0.7, { opacity: 0, scale: 1.45, y: -10 }, { opacity: 1, scale: 1, y: 0 }, EASE.type);
    return b;
  };
  const g1 = slam(G.headline[0], 66, 196, T3 + 0.3);
  const g2 = slam(G.headline[1], 262, 124, T3 + 0.7);
  const sub = textBlock(L, G.sub.join(' ').toUpperCase(), { left: '0', width: '1920px', textAlign: 'center', top: '392px', fontSize: '25px', fontWeight: '500', letterSpacing: '0.2em', color: '#dfe7e7' });
  wordsIn(sub, T3 + 1.15, { per: 0.08 });
  const pillars = G.pillars.map((p, i) => {
    const top = [70, 240, 382][i];
    const box = el('div', 'abs', L, { left: '56px', top: `${top}px` });
    el('div', '', box, { position: 'absolute', left: '0', top: '17px', width: '42px', height: '1px', background: 'rgba(255,255,255,0.7)' });
    el('div', '', box, { position: 'absolute', left: '62px', top: '0', fontFamily: 'var(--cond)', fontWeight: '600', fontSize: '26px', letterSpacing: '0.1em' }).textContent = p.title;
    const body = el('div', '', box, { position: 'absolute', left: '62px', top: '40px', fontSize: '22px', lineHeight: '30px', fontWeight: '400', color: '#d9e2e2' });
    body.innerHTML = wrapBalanced(p.body, 30).join('<br>');
    show(box, T3 + 1.3 + i * 0.2, 0.8, { x: -24 });
    return box;
  });
  // pillar bodies (≤ 8 words) are legible from ≈ 33.4 s; they hold to 36.75 s (≥ 3.2 s)
  [eyebrow, g1, g2, sub, skyScrim, ...pillars].forEach((e) => hide(e, S.end - 0.25, 0.25));

  function update(t) {
    placeOnScreen(black, camera, { dist: 70 });
    black.userData.u.opacity.value = st.black;
    for (const q of quads) {
      const [x, y, w, h] = q.r;
      const k = q.s.k;
      const e = 1 - k;
      const dx = q.from[0] * e + q.drift[0] * q.s.d * q.depth * 2;
      const dy = q.from[1] * e + q.drift[1] * q.s.d * q.depth * 2;
      placeOnScreen(q.m, camera, { x: x - 10 + dx, y: y - 10 + dy, w: w + 20, h: h + 20, dist: 40 - q.depth * 10 });
      q.m.rotation.z = q.rot * (0.4 + e);
      q.m.userData.u.opacity.value = Math.min(1, k * 1.6) * (1 - st.gritOut);
      q.m.userData.u.zoom.value = 1.04 + 0.03 * q.s.d * q.depth;
      q.m.visible = t < T2 + 0.2;
    }
    placeOnScreen(aerial, camera, { dist: 30 });
    placeOnScreen(mapLines, camera, { dist: 29 });
    aerial.userData.u.opacity.value = st.local * (1 - st.localOut);
    aerial.userData.u.zoom.value = st.localZoom;
    Object.assign(linesMat.uniforms, {});
    linesMat.uniforms.zoom.value = st.localZoom;
    linesMat.uniforms.reveal.value = st.reveal;
    linesMat.uniforms.rim.value = st.rim;
    linesMat.uniforms.pulse.value = st.pulse;
    linesMat.uniforms.opacity.value = st.local * (1 - st.localOut);
    aerial.visible = mapLines.visible = t > T2 - 0.5 && t < T3 + 0.1;

    placeOnScreen(giveBg, camera, { dist: 25 });
    placeOnScreen(skyline, camera, { x: 0, y: 600, w: 1920, h: 480, dist: 24 });
    giveBg.userData.u.opacity.value = st.give * (1 - st.giveOut);
    skyline.userData.u.opacity.value = 0.62 * st.give * (1 - st.giveOut);
    skyline.userData.u.pan.value.set(-0.02 + 0.04 * sk.pan, 0);
    skyline.userData.u.zoom.value = 1.06;
    giveBg.visible = skyline.visible = t > T3 - 0.5;
  }

  return { root, layer: L, window: [S.start - 0.2, S.end + 0.1], update };
}
