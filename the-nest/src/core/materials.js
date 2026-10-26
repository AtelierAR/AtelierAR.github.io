import * as THREE from 'three';
import { C } from '../palette.js';

// Procedural PBR maps for the five "kit of parts" materials (p10 MATERIAL LANGUAGE) and the
// clay render style of p26–29. Everything is generated from seeded noise so frames are identical
// run to run.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Height (grey canvas) → tangent-space normal map.
function normalFromHeight(hc, strength = 2) {
  const w = hc.width;
  const h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h);
  const ctx = out.getContext('2d');
  const img = ctx.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (H(x - 1, y) - H(x + 1, y)) * strength;
      const dy = (H(x, y - 1) - H(x, y + 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((dx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / l) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return out;
}

function tex(c, { srgb = true, repeat = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

function speckle(ctx, w, h, r, n, color, alpha, size = 1.4) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * r();
    ctx.beginPath();
    ctx.arc(r() * w, r() * h, size * (0.4 + r()), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Endicott Dark Iron Spot "Utility" brick, 3 5/8" × 11 5/8", stack bond (material assemblies page).
export function masonryMaterial() {
  const r = rng(11);
  const W = 1024;
  const col = canvas(W);
  const hgt = canvas(W);
  const c = col.getContext('2d');
  const hc = hgt.getContext('2d');
  const joint = 7;
  const bw = 256; // 4 units across
  const bh = Math.round(bw / 3.2); // 1 : 3.2 face ratio
  c.fillStyle = '#2a2622'; // dark mortar
  c.fillRect(0, 0, W, W);
  hc.fillStyle = '#202020';
  hc.fillRect(0, 0, W, W);
  const tones = ['#4a2f25', '#5a382b', '#633e2f', '#523326', '#6b4635', '#3e2a22', '#5c3a2e'];
  for (let y = 0; y < W; y += bh)
    for (let x = 0; x < W; x += bw) {
      c.fillStyle = tones[Math.floor(r() * tones.length)];
      c.fillRect(x + joint / 2, y + joint / 2, bw - joint, bh - joint);
      // fired gradient and iron spots
      const g = c.createLinearGradient(x, y, x + bw, y + bh);
      g.addColorStop(0, 'rgba(255,220,190,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      c.fillStyle = g;
      c.fillRect(x + joint / 2, y + joint / 2, bw - joint, bh - joint);
      hc.fillStyle = `rgb(${200 + r() * 30},${200 + r() * 30},${200 + r() * 30})`;
      hc.fillRect(x + joint / 2, y + joint / 2, bw - joint, bh - joint);
    }
  speckle(c, W, W, r, 9000, '#1a1210', 0.8, 1.3);
  speckle(c, W, W, r, 2500, '#8a6a58', 0.35, 1.0);
  speckle(hc, W, W, r, 6000, '#909090', 0.5, 1.2);
  const normal = normalFromHeight(hgt, 3);
  return new THREE.MeshStandardMaterial({
    map: tex(col),
    normalMap: tex(normal, { srgb: false }),
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughness: 0.88,
    metalness: 0,
  });
}

// Blackened steel: mill scale, faint brushed streaks, oily sheen.
export function steelMaterial() {
  const r = rng(23);
  const W = 512;
  const col = canvas(W);
  const rough = canvas(W);
  const c = col.getContext('2d');
  const rc = rough.getContext('2d');
  // a metal's reflectance comes from its base colour, so blackened steel is a dark grey, not black
  c.fillStyle = '#5a6066';
  c.fillRect(0, 0, W, W);
  rc.fillStyle = '#707070';
  rc.fillRect(0, 0, W, W);
  for (let i = 0; i < 900; i++) {
    const y = r() * W;
    c.strokeStyle = r() > 0.5 ? 'rgba(90,96,100,0.10)' : 'rgba(0,0,0,0.16)';
    c.lineWidth = r() * 1.6;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y + (r() - 0.5) * 6);
    c.stroke();
    rc.strokeStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.08)`;
    rc.beginPath();
    rc.moveTo(0, y);
    rc.lineTo(W, y);
    rc.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const cx = r() * W;
    const cy = r() * W;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, 40 + r() * 90); // concentric, or it draws cones
    g.addColorStop(0, 'rgba(20,24,26,0.35)');
    g.addColorStop(1, 'rgba(20,24,26,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, W);
  }
  return new THREE.MeshStandardMaterial({
    map: tex(col),
    roughnessMap: tex(rough, { srgb: false }),
    color: '#c4c9cd',
    roughness: 0.4,
    metalness: 0.85,
    envMapIntensity: 1.4,
  });
}

export function glassMaterial(opacity = 0.5) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(C.glass).lerp(new THREE.Color('#dff3f1'), 0.25),
    roughness: 0.06,
    metalness: 0.35,
    transparent: true,
    opacity,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

export function mullionMaterial() {
  return new THREE.MeshStandardMaterial({ color: '#dfe3e6', roughness: 0.35, metalness: 0.6, envMapIntensity: 1.1 });
}

export function stainlessMaterial() {
  return new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: 0.05, metalness: 1, envMapIntensity: 1.25 });
}

// Digital: dark panel with a teal LED dot matrix. The emissive canvas is redrawn from t so the
// pattern animates deterministically.
export function digitalMaterial({ cols = 48, rows = 48, size = 512 } = {}) {
  const em = canvas(size);
  const t = tex(em);
  const m = new THREE.MeshStandardMaterial({
    color: C.led,
    roughness: 0.32,
    metalness: 0.4,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: t,
    emissiveIntensity: 1.6,
  });
  const ctx = em.getContext('2d');
  const r = rng(5);
  const phase = Array.from({ length: cols * rows }, () => r());
  m.userData.draw = (time, mode = 'wave', level = 1) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    const cw = size / cols;
    const ch = size / rows;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const u = i / cols;
        const v = j / rows;
        let b;
        if (mode === 'wave') b = 0.5 + 0.5 * Math.sin(u * 9 - v * 4 + time * 2.4 + phase[j * cols + i] * 2.2);
        else b = 0.5 + 0.5 * Math.sin(Math.hypot(u - 0.5, v - 0.5) * 18 - time * 3);
        b = Math.pow(b, 3) * level;
        if (b < 0.04) continue;
        const g = Math.round(150 + 80 * b);
        ctx.fillStyle = `rgba(${Math.round(40 * b)},${g},${Math.round(150 + 40 * b)},${Math.min(1, b + 0.15)})`;
        ctx.beginPath();
        ctx.arc(i * cw + cw / 2, j * ch + ch / 2, cw * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    t.needsUpdate = true;
  };
  m.userData.draw(0);
  return m;
}

export function clayMaterial(color = C.clay) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, envMapIntensity: 0.6 });
}

export const edgeMaterial = () => new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.35 });

// Clay mesh with hairline edges (EdgesGeometry at 20°, as specified).
export function withEdges(mesh, mat = edgeMaterial()) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), mat);
  e.raycast = () => {};
  mesh.add(e);
  mesh.userData.edges = e;
  return mesh;
}

// Environment for reflections: p26 sky gradient over a white plaza, a low warm sun, and a ring of
// darker city blocks so mirror surfaces have something to reflect.
// `sun: false` gives a studio variant (soft broad highlight, no sun disc) for close-up
// material tiles, where a hard sun reflection would bloom into a lens-flare look.
export function environment(renderer, { sun: withSun = true } = {}) {
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(100, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(C.skyTop) }, hor: { value: new THREE.Color(C.skyHorizon) }, gnd: { value: new THREE.Color('#e8e8ec') } },
      vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:
        'uniform vec3 top, hor, gnd; varying vec3 p; void main(){ float h = p.y; vec3 c = h > 0.0 ? mix(hor, top, pow(h, 0.6)) : mix(hor, gnd, pow(-h, 0.4)); gl_FragColor = vec4(c, 1.0); }',
    }),
  );
  scene.add(sky);
  const sun = withSun
    ? new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1dc').multiplyScalar(14) }))
    : new THREE.Mesh(new THREE.SphereGeometry(26, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#f3f1ec').multiplyScalar(1.0) }));
  sun.position.set(-60, withSun ? 18 : 40, 55);
  scene.add(sun);
  const r = rng(3);
  if (!withSun) {
    // studio: a few large soft panels around a neutral sphere give metals a readable gradient
    const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(0.8), side: THREE.DoubleSide });
    [[0, 30, 80, 90, 30], [-80, 20, -10, 40, 50], [75, -5, 20, 30, 60]].forEach(([x, y, z, w, h]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panel);
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      scene.add(m);
    });
  }
  const blockMat = new THREE.MeshBasicMaterial({ color: '#4b5560' });
  for (let i = 0; i < (withSun ? 46 : 0); i++) {
    const a = r() * Math.PI * 2;
    const h = 4 + r() * 22;
    const b = new THREE.Mesh(new THREE.BoxGeometry(4 + r() * 6, h, 4 + r() * 6), blockMat);
    b.position.set(Math.cos(a) * 70, h / 2 - 2, Math.sin(a) * 70);
    b.lookAt(0, h / 2, 0);
    scene.add(b);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  return rt.texture;
}
