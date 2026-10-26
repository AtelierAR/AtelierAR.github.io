// Scene 3 (0:26-0:42) — How it's built. Exploded-axonometric build-ups, one per assembly
// (p23-25), each assembling layer by layer in ~2.2 s with BOD callouts typed beside it.
// Wall assemblies are authored in feet: wall plane z = 0, exterior toward -z (camera side).
import * as THREE from 'three';
import { ASSEMBLIES, COPY, FT } from '../data.js';
import { Builder, KEYS } from '../kit/builder.js';
import { MAT } from '../materials.js';
import { orbit, lerp, ALL_CATS } from './common.js';
import { smooth } from '../director.js';

// local (non-category) materials for the hidden layers of each build-up
function localMaterials() {
  const add = (key, mat) => { MAT.materials[key] = mat; KEYS[key] = [key, 'clay']; };
  add('insul', new THREE.MeshStandardMaterial({ color: '#CFD6C9', roughness: 0.95 }));
  add('sheath', new THREE.MeshStandardMaterial({ color: '#B9B3A6', roughness: 0.9 }));
  add('stud', new THREE.MeshStandardMaterial({ color: '#A9AFB3', roughness: 0.45, metalness: 0.75 }));
  add('paint', new THREE.MeshStandardMaterial({ color: '#5B6266', roughness: 0.5, metalness: 0.4 }));
  add('membrane', new THREE.MeshStandardMaterial({ color: '#8E9599', roughness: 0.7 }));
  add('pvLocal', new THREE.MeshStandardMaterial({ map: MAT.tex.pv.map, roughness: 0.3, metalness: 0.1 }));
  add('reveal', new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.6 }));
  add('mirrorLocal', new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.04, metalness: 1, envMapIntensity: 1.2 }));
}

// One layer = merged meshes per material, positioned by an explode offset.
function layer(build) {
  const b = new Builder();
  build(b);
  const g = new THREE.Group();
  b.build(g, { edgeAngle: 30 });
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

const studs = (b, z0, z1, x0 = -5, x1 = 5, h = 12) => {
  for (let x = x0; x <= x1 + 0.01; x += 16 / 12) b.minmax('stud', x - 0.07, 0.2, z0, x + 0.07, h - 0.2, z1);
  b.minmax('stud', x0 - 0.1, 0, z0, x1 + 0.1, 0.2, z1);
  b.minmax('stud', x0 - 0.1, h - 0.2, z0, x1 + 0.1, h, z1);
};
const cyl = (b, key, a, c, r) => {
  const A = new THREE.Vector3(...a).multiplyScalar(FT), C = new THREE.Vector3(...c).multiplyScalar(FT);
  const g = new THREE.CylinderGeometry(r * FT, r * FT, A.distanceTo(C), 8);
  g.translate(0, A.distanceTo(C) / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), C.clone().sub(A).normalize()));
  g.translate(A.x, A.y, A.z);
  b.add(key, g);
};

// Each entry: list of [buildFn, explode offset (ft) at rest, fly-in direction]
const BUILDS = {
  mesh: [
    [(b) => { // painted backup steel
      for (const x of [-4.2, 4.2]) b.minmax('paint', x - 0.25, 0, 1.2, x + 0.25, 12, 1.7);
      for (const y of [1, 11]) b.minmax('paint', -4.6, y - 0.2, 1.25, 4.6, y + 0.2, 1.65);
    }, [0, 0, 0]],
    [(b) => { // tension system: brackets + vertical tension rods
      for (const x of [-4.2, 4.2]) for (const y of [1, 11]) b.minmax('stud', x - 0.3, y - 0.3, 0.2, x + 0.3, y + 0.3, 1.2);
      for (let x = -3.6; x <= 3.61; x += 1.2) cyl(b, 'stud', [x, 0.6, 0.35], [x, 11.4, 0.35], 0.05);
    }, [0, 0, -1.6]],
    [(b) => { // aluminium perimeter frame
      b.minmax('frame', -4.6, 0.4, -0.1, 4.6, 0.75, 0.3); b.minmax('frame', -4.6, 11.25, -0.1, 4.6, 11.6, 0.3);
      b.minmax('frame', -4.6, 0.4, -0.1, -4.25, 11.6, 0.3); b.minmax('frame', 4.25, 0.4, -0.1, 4.6, 11.6, 0.3);
    }, [0, 0, -3.2]],
    [(b) => { b.minmax('mesh', -4.3, 0.7, 0.0, 4.3, 11.3, 0.12); }, [0, 0, -4.8]],
  ],
  masonry: [
    [(b) => studs(b, 1.6, 2.1), [0, 0, 0]],
    [(b) => b.minmax('sheath', -5, 0, 1.45, 5, 12, 1.55), [0, 0, -1.4]],
    [(b) => b.minmax('insul', -5, 0, 0.8, 5, 12, 1.4), [0, 0, -2.8]],
    [(b) => { for (let x = -4; x <= 4; x += 2) for (let y = 1; y < 12; y += 1.33) b.minmax('stud', x - 0.1, y - 0.03, 0.3, x + 0.1, y + 0.03, 0.8); }, [0, 0, -4.2]],
    [(b) => { b.minmax('masonry', -5, 0, -0.05, 5, 12, 0.3); }, [0, 0, -5.6]],
  ],
  metal: [
    [(b) => studs(b, 1.6, 2.1), [0, 0, 0]],
    [(b) => { b.minmax('sheath', -5, 0, 1.45, 5, 12, 1.55); b.minmax('insul', -5, 0, 0.9, 5, 12, 1.45); }, [0, 0, -1.5]],
    [(b) => { // extruded mounting system: horizontal rails + clips
      for (const y of [0.6, 4.3, 8, 11.6]) b.minmax('frame', -5, y - 0.12, 0.45, 5, y + 0.12, 0.9);
      for (const x of [-2.5, 2.5]) for (const y of [0.6, 4.3, 8, 11.6]) b.minmax('frame', x - 0.2, y - 0.25, 0.2, x + 0.2, y + 0.25, 0.45);
    }, [0, 0, -3.0]],
    [(b) => { // .125" plates, 4' x 5.5' with shadow reveals
      for (const [x0, x1] of [[-5, -0.04], [0.04, 5]]) for (const [y0, y1] of [[0, 5.96], [6.04, 12]]) b.minmax('metal', x0, y0, 0.1, x1, y1, 0.2);
    }, [0, 0, -4.5]],
  ],
  glazing: [
    [(b) => { for (const x of [-2.5, 2.5]) b.minmax('paint', x - 0.3, 0, 1.4, x + 0.3, 12, 2.0); }, [0, 0, 0]],
    [(b) => { // unitized frames
      for (const x of [-5, 0, 5]) b.minmax('frame', x - 0.12, 0, 0.3, x + 0.12, 12, 0.9);
      for (const y of [0, 6, 12]) b.minmax('frame', -5, y - 0.12, 0.3, 5, y + 0.12, 0.9);
    }, [0, 0, -1.6]],
    [(b) => { for (const x0 of [-4.88, 0.12]) for (const y0 of [0.12, 6.12]) b.minmax('glass', x0, y0, 0.5, x0 + 4.76, y0 + 5.76, 0.62); }, [0, 0, -3.0]],
    [(b) => { for (const x of [-5, 0, 5]) b.minmax('frame', x - 0.1, 0, -0.9, x + 0.1, 12, 0.3); }, [0, 0, -4.4]],
  ],
  fins: [
    [(b) => { // structural column (steel), fin runs along -z (6-8 ft deep)
      b.minmax('paint', -0.35, 0, -6.5, 0.35, 12, 0.5);
      b.minmax('paint', -0.8, 0, -6.6, 0.8, 12, -6.3); b.minmax('paint', -0.8, 0, 0.2, 0.8, 12, 0.5);
    }, [0, 0, 0]],
    [(b) => b.minmax('fins', -1.0, 0, -7.0, -0.9, 12, 0.6), [-2.4, 0, 0]],
    [(b) => b.minmax('fins', 0.9, 0, -7.0, 1.0, 12, 0.6), [2.4, 0, 0]],
    [(b) => { b.minmax('fins', -1.0, 0, -7.6, 1.0, 12, -7.0); for (const y of [3.95, 7.95]) b.minmax('reveal', -1.05, y, -7.65, 1.05, y + 0.1, 0.6); }, [0, 0, -2.4]],
  ],
  roof: [
    [(b) => { // space frame chords + diagonals
      for (const z of [-4, 0, 4]) cyl(b, 'stud', [-5, 0.3, z], [5, 0.3, z], 0.18);
      for (const z of [-4, 0, 4]) cyl(b, 'stud', [-5, 2.3, z], [5, 2.3, z], 0.15);
      for (let x = -4; x <= 4; x += 2) for (const z of [-4, 0, 4]) cyl(b, 'stud', [x, 0.3, z], [x + 1, 2.3, z], 0.1);
    }, [0, 0, 0]],
    [(b) => { for (let z = -4.8; z < 4.8; z += 0.6) b.minmax('stud', -5, 2.5, z, 5, 2.75, z + 0.3); b.minmax('stud', -5, 2.45, -5, 5, 2.5, 5); }, [0, 1.2, 0]],
    [(b) => b.minmax('insul', -5, 2.8, -5, 5, 3.5, 5), [0, 2.4, 0]],
    [(b) => b.minmax('membrane', -5, 3.55, -5, 5, 3.65, 5), [0, 3.6, 0]],
    [(b) => { // underside: aluminium soffit panels + 316 SS mirror plate
      for (let z = -5; z < 0; z += 1) b.minmax('soffit', -5, -0.3, z + 0.02, 5, -0.2, z + 0.98);
      b.minmax('mirrorLocal', -5, -0.3, 0.02, 5, -0.2, 5);
    }, [0, -2.4, 0]],
  ],
  pv: [
    [(b) => { // galvanized sub-frame and channels
      for (const z of [-3.5, 0, 3.5]) b.minmax('galv', -5, 0, z - 0.15, 5, 0.4, z + 0.15);
      for (const x of [-4, -1.3, 1.3, 4]) b.minmax('galv', x - 0.12, 0.4, -4.5, x + 0.12, 0.7, 4.5);
    }, [0, 0, 0]],
    [(b) => { // panels, polar white, tilted to the canopy slope
      for (const x0 of [-5, -2.5, 0, 2.5]) for (const z0 of [-4.5, 0.1]) {
        const g = new THREE.BoxGeometry(2.4 * FT, 0.12 * FT, 4.3 * FT);
        g.rotateX(0.14);
        g.translate((x0 + 1.25) * FT, 1.15 * FT, (z0 + 2.15) * FT);
        b.add('pvLocal', g, { keepUV: false });
      }
    }, [0, 2.6, 0]],
  ],
};

export async function build(ctx) {
  const { overlay: O, master: tl, director, engine, stadium, site } = ctx;
  const T0 = 26, T1 = 42, SLOT = 2.2, FIRST = 26.45;
  localMaterials();

  const studio = new THREE.Group();
  studio.name = 'Studio';
  studio.visible = false;
  engine.scene.add(studio);

  const groups = ASSEMBLIES.map((a) => {
    const g = new THREE.Group();
    g.name = 'asm:' + a.key;
    g.visible = false;
    const layers = BUILDS[a.key].map(([fn, off]) => {
      const L = layer(fn);
      L.userData.rest = new THREE.Vector3(...off).multiplyScalar(FT);
      L.position.copy(L.userData.rest);
      g.add(L);
      return L;
    });
    // roof + PV are horizontal assemblies: lift them to read as an exploded axon
    if (a.key === 'roof' || a.key === 'pv') g.position.y = 3.5 * FT;
    studio.add(g);
    return { a, g, layers };
  });

  // ---- overlay: section title, index, callout card
  const sec = O.el('div', 'ov sec', O.root, `${COPY.s3Title}<small>Basis of design · p23–25</small>`);
  const card = O.el('div', 'ov callout');
  const cards = groups.map(({ a }, i) => {
    const c = O.el('div', 'ov', card);
    c.style.left = '0'; c.style.top = '0'; c.style.width = '600px';
    O.el('div', 'k', c, `Assembly ${String(i + 1).padStart(2, '0')} / 07 · p${a.page}`);
    O.el('div', 'h', c, a.title + ':');
    O.el('div', 's', c, a.sub);
    const rule = O.el('div', 'rule', c);
    const ul = O.el('ul', '', c);
    const lis = a.short.map(() => O.el('li', '', ul));
    const bod = O.el('div', 'bod', c);
    return { c, rule, typers: a.short.map((s, k) => O.typer(lis[k], s)), bod: O.typer(bod, a.bod), lis };
  });

  // ---- white flash covering the cut to and from the studio
  const flash = O.el('div', 'ov fade-white');
  flash.style.opacity = 0;
  tl.to(flash, { opacity: 1, duration: 0.35, ease: 'power1.in' }, T0 - 0.3);
  tl.set([stadium, site.trees], { visible: false }, T0 + 0.05);
  tl.set(studio, { visible: true }, T0 + 0.05);
  tl.to(flash, { opacity: 0, duration: 0.45, ease: 'power1.out' }, T0 + 0.1);
  tl.to(ctx.state, { studio: 1, dof: 1, duration: 0.01 }, T0 + 0.05);
  tl.set(ctx.state, { sunAz: 140, sunEl: 42 }, T0 + 0.05);
  for (const c of ALL_CATS) tl.set(MAT.state[c], { mix: c === 'clay' ? 0 : 1, fade: 1 }, T0 + 0.05);

  tl.fromTo(sec, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 }, T0 + 0.2);
  tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3 }, FIRST);

  groups.forEach(({ g, layers }, i) => {
    const t = FIRST + i * SLOT;
    tl.set(g, { visible: true }, t);
    layers.forEach((L, k) => {
      const r = L.userData.rest;
      const from = { x: r.x * 1.6 + 2.5, y: r.y + 4.5, z: r.z * 1.8 - 2.5 };
      tl.set(L, { visible: false }, 0);
      tl.set(L, { visible: true }, t + k * 0.24);
      tl.fromTo(L.position, from, { x: r.x, y: r.y, z: r.z, duration: 0.75, ease: 'power3.out' }, t + k * 0.24);
    });
    const C = cards[i];
    tl.set(C.c, { opacity: 0 }, 0);
    tl.fromTo(C.c, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, t + 0.05);
    tl.fromTo(C.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.4 }, t + 0.2);
    C.typers.forEach((ty, k) => tl.fromTo(ty, { p: 0 }, { p: 1, duration: 0.45, ease: 'none' }, t + 0.3 + k * 0.4));
    tl.fromTo(C.bod, { p: 0 }, { p: 1, duration: 0.9, ease: 'none' }, t + 0.7);
    if (i < groups.length - 1) {
      tl.to(C.c, { opacity: 0, duration: 0.2 }, t + SLOT - 0.2);
      tl.to(g.position, { x: -14 * FT, duration: 0.3, ease: 'power2.in' }, t + SLOT - 0.25);
      tl.set(g, { visible: false }, t + SLOT + 0.05);
    }
  });

  // out to scene 4
  tl.to(flash, { opacity: 1, duration: 0.3, ease: 'power1.in' }, T1 - 0.3);
  tl.to([sec, card], { opacity: 0, duration: 0.25 }, T1 - 0.3);
  tl.set(studio, { visible: false }, T1);
  tl.set([stadium, site.trees], { visible: true }, T1);
  tl.to(ctx.state, { studio: 0, dof: 0, duration: 0.01 }, T1);
  tl.to(flash, { opacity: 0, duration: 0.5, ease: 'power1.out' }, T1 + 0.05);

  // tighter shadow frustum in the studio
  const sc = engine.lights.sun.shadow.camera;
  ctx.onFrame((T, c) => {
    const inStudio = c.state.studio > 0.5;
    const r = inStudio ? 9 : 230;
    if (sc.right !== r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.updateProjectionMatrix(); c.shadowKey.push('frustum' + r); }
    if (inStudio) {
      for (const { g, layers } of groups) if (g.visible) {
        c.shadowKey.push(g.position.x.toFixed(2));
        for (const L of layers) c.shadowKey.push(L.visible ? L.position.x.toFixed(2) + L.position.y.toFixed(2) + L.position.z.toFixed(2) : '-');
      }
    }
  });

  // camera: slow drift around the build-up, model framed left of the callout card
  director.add(T0, T1, (u) => {
    const k = smooth(u);
    return orbit(lerp(38, 24, k), 10.2, 4.0, [0.0, 1.8, -0.5], 30, { shiftX: -0.16, shiftY: 0.0 });
  }, 's3');
}
