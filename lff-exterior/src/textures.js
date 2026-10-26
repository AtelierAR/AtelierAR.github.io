// Procedural texture generators (canvas). Every map tiles in world metres: kit geometry
// carries UVs in metres and each texture's `repeat` is set to 1 / tileSize.
import * as THREE from 'three';
import { SWATCH, FT } from './data.js';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (c) => new THREE.Color(c);
const css = (c, k = 1) => {
  const col = hex(c).multiplyScalar(k);
  return `rgb(${Math.min(255, col.r * 255) | 0},${Math.min(255, col.g * 255) | 0},${Math.min(255, col.b * 255) | 0})`;
};

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, tileM, { color = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (Array.isArray(tileM)) t.repeat.set(1 / tileM[0], 1 / tileM[1]);
  else t.repeat.set(1 / tileM, 1 / tileM);
  t.anisotropy = aniso;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

// Height canvas -> tangent-space normal map
function normalFromHeight(hc, strength = 2) {
  const w = hc.width, h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, g] = canvas(w, h);
  const out = g.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const n = new THREE.Vector3(-dx, dy, 1).normalize();
      const i = (y * w + x) * 4;
      out.data[i] = (n.x * 0.5 + 0.5) * 255;
      out.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      out.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}

// ---------------------------------------------------------------------------------------
// Iron-spot brick, stack bond. Unit 3 5/8" x 11 5/8" + 3/8" joints = 4" x 12" module (p23).
// Tile = 4 ft wide x 4 ft tall = 4 bricks x 12 courses.
// ---------------------------------------------------------------------------------------
export function brick() {
  const S = 1024, cols = 4, rows = 12;
  const bw = S / cols, bh = S / rows, j = Math.max(2, Math.round(S * (0.375 / 48)));
  const [c, g] = canvas(S);
  const [hc, hg] = canvas(S);
  const [rc, rg] = canvas(S);
  const r = rng(7);
  g.fillStyle = css(SWATCH.masonry.joint); g.fillRect(0, 0, S, S);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
  rg.fillStyle = '#e0e0e0'; rg.fillRect(0, 0, S, S);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const k = 0.78 + r() * 0.38;
      const x0 = x * bw + j / 2, y0 = y * bh + j / 2, w = bw - j, h = bh - j;
      g.fillStyle = css(SWATCH.masonry.base, k); g.fillRect(x0, y0, w, h);
      // iron-spot speckle + subtle flashing toward one end
      const grd = g.createLinearGradient(x0, 0, x0 + w, 0);
      grd.addColorStop(0, 'rgba(20,14,10,0.0)'); grd.addColorStop(1, `rgba(20,14,10,${0.18 * r()})`);
      g.fillStyle = grd; g.fillRect(x0, y0, w, h);
      for (let s = 0; s < 70; s++) {
        const sx = x0 + r() * w, sy = y0 + r() * h, sr = 0.6 + r() * 1.8;
        g.fillStyle = r() < 0.93 ? css(SWATCH.masonry.speck, 0.8 + r() * 0.4) : 'rgba(120,100,84,0.5)';
        g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
      }
      hg.fillStyle = '#ddd'; hg.fillRect(x0, y0, w, h);
      rg.fillStyle = `rgb(${190 + r() * 40 | 0},0,0)`; rg.fillRect(x0, y0, w, h);
    }
  }
  const tile = 4 * FT; // 4 bricks of 12" = 4 ft
  return {
    map: tex(c, tile),
    normalMap: tex(normalFromHeight(hc, 3), tile, { color: false }),
    roughnessMap: tex(rc, tile, { color: false }),
    canvas: c,
  };
}

// ---------------------------------------------------------------------------------------
// Blackened aluminium plate, floating assembly: 4 ft x 10 ft plates, 3/4" shadow reveals.
// ---------------------------------------------------------------------------------------
export function metalPanel() {
  const S = 512, pw = S, ph = S; // tile 8 ft x 20 ft = 2 x 2 plates
  const [c, g] = canvas(S);
  const [hc, hg] = canvas(S);
  const r = rng(11);
  g.fillStyle = '#0c0b0a'; g.fillRect(0, 0, S, S);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
  const j = 4;
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    const k = 0.9 + r() * 0.2;
    g.fillStyle = css(SWATCH.metal.base, k); g.fillRect(x * pw / 2 + j, y * ph / 2 + j, pw / 2 - 2 * j, ph / 2 - 2 * j);
    hg.fillStyle = '#fff'; hg.fillRect(x * pw / 2 + j, y * ph / 2 + j, pw / 2 - 2 * j, ph / 2 - 2 * j);
  }
  return {
    map: tex(c, [8 * FT, 20 * FT]),
    normalMap: tex(normalFromHeight(hc, 1.5), [8 * FT, 20 * FT], { color: false }),
    canvas: c,
  };
}

// ---------------------------------------------------------------------------------------
// ACM fin wrap: dark bronze-grey with horizontal reveal joints every 10 ft.
// ---------------------------------------------------------------------------------------
export function finSkin() {
  const S = 256;
  const [c, g] = canvas(S);
  const [hc, hg] = canvas(S);
  const grd = g.createLinearGradient(0, 0, 0, S);
  grd.addColorStop(0, css(SWATCH.fins.base, 1.05)); grd.addColorStop(1, css(SWATCH.fins.base, 0.95));
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  g.fillStyle = '#141210'; g.fillRect(0, 0, S, 3);
  hg.fillStyle = '#fff'; hg.fillRect(0, 0, S, S); hg.fillStyle = '#000'; hg.fillRect(0, 0, S, 3);
  return {
    map: tex(c, [10 * FT, 10 * FT]),
    normalMap: tex(normalFromHeight(hc, 1.5), [10 * FT, 10 * FT], { color: false }),
    canvas: c,
  };
}

// ---------------------------------------------------------------------------------------
// Unitized curtain wall: 5 ft modules, 15 ft floor-to-floor, cool grey-green glass.
// Emissive map = warm interior glow for dusk (random lit / unlit panes).
// ---------------------------------------------------------------------------------------
export function curtainWall() {
  const S = 512;
  const [c, g] = canvas(S);
  const [ec, eg] = canvas(S);
  const [rc, rg] = canvas(S);
  const r = rng(5);
  const mods = 4, floors = 2; // tile 20 ft x 30 ft
  const mw = S / mods, mh = S / floors;
  for (let y = 0; y < floors; y++) for (let x = 0; x < mods; x++) {
    const k = 0.85 + r() * 0.3;
    const grd = g.createLinearGradient(0, y * mh, 0, (y + 1) * mh);
    grd.addColorStop(0, css(SWATCH.glazing.base, 1.25 * k)); grd.addColorStop(1, css(SWATCH.glazing.base, 0.85 * k));
    g.fillStyle = grd; g.fillRect(x * mw, y * mh, mw, mh);
    const lit = r();
    eg.fillStyle = lit > 0.25 ? `rgb(${236 + r() * 19 | 0},${196 + r() * 30 | 0},${146 + r() * 34 | 0})` : '#120c06';
    eg.fillRect(x * mw, y * mh, mw, mh);
    rg.fillStyle = '#0a0a0a'; rg.fillRect(x * mw, y * mh, mw, mh);
  }
  // mullions + transom + slab spandrel
  g.fillStyle = '#1c2224'; eg.fillStyle = '#000'; rg.fillStyle = '#7a7a7a';
  for (let x = 0; x <= mods; x++) { g.fillRect(x * mw - 3, 0, 6, S); eg.fillRect(x * mw - 3, 0, 6, S); rg.fillRect(x * mw - 3, 0, 6, S); }
  for (let y = 0; y <= floors; y++) {
    g.fillRect(0, y * mh - 10, S, 20); eg.fillRect(0, y * mh - 10, S, 20); rg.fillRect(0, y * mh - 10, S, 20);
  }
  return {
    map: tex(c, [20 * FT, 30 * FT]),
    emissiveMap: tex(ec, [20 * FT, 30 * FT]),
    roughnessMap: tex(rc, [20 * FT, 30 * FT], { color: false }),
    canvas: c,
  };
}

// ---------------------------------------------------------------------------------------
// Tensioned aluminium mesh: alpha-tested weave on a 1 ft repeat, framed every 10 ft.
// ---------------------------------------------------------------------------------------
export function meshScreen() {
  const S = 256;
  const [c, g] = canvas(S);
  const [ac, ag] = canvas(S);
  g.fillStyle = css(SWATCH.mesh.base); g.fillRect(0, 0, S, S);
  ag.fillStyle = '#000'; ag.fillRect(0, 0, S, S);
  ag.fillStyle = '#fff';
  const n = 10; // 10 rods per 10 ft tile -> wide-aperture tensioned grate
  for (let i = 0; i < n; i++) {
    ag.fillRect(0, (i / n) * S, S, S / n * 0.42); // flat horizontal rods
  }
  for (let i = 0; i < 20; i++) ag.fillRect((i / 20) * S, 0, 3, S); // cables
  ag.fillRect(0, 0, 10, S); // frame
  ag.fillRect(0, 0, S, 8);
  // shading on the rods
  for (let i = 0; i < n; i++) {
    const grd = g.createLinearGradient(0, (i / n) * S, 0, (i / n) * S + S / n * 0.42);
    grd.addColorStop(0, css(SWATCH.mesh.base, 1.6)); grd.addColorStop(1, css(SWATCH.mesh.base, 0.7));
    g.fillStyle = grd; g.fillRect(0, (i / n) * S, S, S / n * 0.42);
  }
  return { map: tex(c, 10 * FT), alphaMap: tex(ac, 10 * FT, { color: false }), canvas: c };
}

// ---------------------------------------------------------------------------------------
// Brushed aluminium soffit planks (2 ft) and the 316 stainless mirror plate joints.
// ---------------------------------------------------------------------------------------
export function soffitPlanks() {
  const S = 256;
  const [c, g] = canvas(S);
  const [rc, rg] = canvas(S);
  const r = rng(3);
  for (let y = 0; y < S; y++) {
    const k = 0.92 + r() * 0.12;
    g.fillStyle = css(SWATCH.soffit.base, k); g.fillRect(0, y, S, 1);
    rg.fillStyle = `rgb(0,${(0.3 + r() * 0.12) * 255 | 0},0)`; rg.fillRect(0, y, S, 1);
  }
  for (let i = 0; i < 4; i++) { g.fillStyle = '#55595c'; g.fillRect(0, (i / 4) * S, S, 3); }
  return { map: tex(c, [8 * FT, 8 * FT]), roughnessMap: tex(rc, [8 * FT, 8 * FT], { color: false }), canvas: c };
}

export function mirrorJoints() {
  const S = 512;
  const [c, g] = canvas(S);
  const [rc, rg] = canvas(S);
  g.fillStyle = css(SWATCH.reflective.base); g.fillRect(0, 0, S, S);
  rg.fillStyle = 'rgb(0,10,0)'; rg.fillRect(0, 0, S, S);
  // plate joints - the striations visible on p28/p29 (~ every 24 ft)
  g.fillStyle = '#2a2d30'; g.fillRect(0, 0, S, 5);
  rg.fillStyle = 'rgb(0,200,0)'; rg.fillRect(0, 0, S, 5);
  g.fillStyle = '#7d8286'; g.fillRect(0, S / 2, S, 2);
  return { map: tex(c, [24 * FT, 24 * FT]), roughnessMap: tex(rc, [24 * FT, 24 * FT], { color: false }), canvas: c };
}

export function pvPanel() {
  const S = 256;
  const [c, g] = canvas(S, S * 2);
  g.fillStyle = css(SWATCH.pv.base); g.fillRect(0, 0, S, S * 2);
  g.strokeStyle = css(SWATCH.pv.cell); g.lineWidth = 2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo((i / 6) * S, 0); g.lineTo((i / 6) * S, S * 2); g.stroke(); }
  for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(0, (i / 10) * S * 2); g.lineTo(S, (i / 10) * S * 2); g.stroke(); }
  g.strokeStyle = '#f7f7f5'; g.lineWidth = 8; g.strokeRect(0, 0, S, S * 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { map: t, canvas: c };
}

export function pvc() {
  const S = 256;
  const [c, g] = canvas(S);
  g.fillStyle = css(SWATCH.roof.base); g.fillRect(0, 0, S, S);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 4; i++) g.fillRect(0, (i / 4) * S, S, 2);
  return { map: tex(c, 40 * FT), canvas: c };
}

// Stadium seating rows for the clay bowl (subtle tread lines).
export function seating() {
  const S = 128;
  const [c, g] = canvas(S);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#c9ccd2';
  for (let i = 0; i < 4; i++) g.fillRect(0, (i / 4) * S, S, 6);
  return { map: tex(c, [12 * FT, 12 * FT]), canvas: c };
}

// Swatch canvas used in DOM (facade bar segments are drawn with the real textures).
export function swatchDataURL(srcCanvas, w = 400, h = 60, scale = 1) {
  const [c, g] = canvas(w, h);
  const pat = g.createPattern(srcCanvas, 'repeat');
  g.save(); g.scale(scale, scale); g.fillStyle = pat; g.fillRect(0, 0, w / scale, h / scale); g.restore();
  return c.toDataURL('image/png');
}

// Facade-bar swatches: drawn from the same canvases the 3D materials use (scene 2).
export function barSwatch(key, tx, h = 34) {
  const w = 512;
  const [c, g] = canvas(w, h);
  g.filter = 'brightness(1.9) contrast(1.05)'; // read as lit material at bar scale
  const pat = (src, s) => { g.save(); g.scale(s, s); g.fillStyle = g.createPattern(src, 'repeat'); g.fillRect(0, 0, w / s, h / s); g.restore(); };
  switch (key) {
    case 'masonry': pat(tx.brick.canvas, 0.11); break;
    case 'metal': pat(tx.metal.canvas, 0.16); break;
    case 'glazing': pat(tx.cw.canvas, 0.2); break;
    case 'mesh': g.fillStyle = '#1d211f'; g.fillRect(0, 0, w, h); pat(tx.mesh.canvas, 0.35); break;
    case 'fins': {
      g.fillStyle = '#1a1816'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 12) {
        const grd = g.createLinearGradient(x, 0, x + 8, 0);
        grd.addColorStop(0, css(SWATCH.fins.base, 1.5)); grd.addColorStop(0.5, css(SWATCH.fins.base, 1.05)); grd.addColorStop(1, css(SWATCH.fins.base, 0.6));
        g.fillStyle = grd; g.fillRect(x, 0, 8, h);
      }
      break;
    }
    default: g.fillStyle = '#888'; g.fillRect(0, 0, w, h);
  }
  return c.toDataURL('image/png');
}
