import * as THREE from 'three';
import { REVEAL } from '../data.js';
import { C } from '../palette.js';
import { RIB_BOWL, FIELD_HALF, p26 } from '../ref.js';
import { to, EASE, clamp01 } from '../core/timeline.js';
import { layer, el, textBlock, typeOn, hide, show, scrim } from '../core/overlay.js';
import { clayMaterial, withEdges, glassMaterial, stainlessMaterial, digitalMaterial } from '../core/materials.js';
import { perimeter, surfaces } from './s2_ambition.js';
import { buildTiles } from './s4_nest.js';

// Scene 5 — assembly and reveal. A simplified massing of the renovated stadium read off the p26
// Plaza View (0.6 ft per page unit, see REFERENCE_NOTES.md): two fin-clad towers flanking a keystone
// video board over the grand stair, masonry bases, horizontal glazing bands, and sweeping
// triangular canopy wings with striated tops and mirror soffits rising toward the corners.
// The five material tiles fly in and the layers build in p26 order, each labelled like p26.

const BOWL_Z = -560; // bowl centre behind the plaza facade

// Box from extents, with its origin at the base centre so it can grow upward.
function box(x0, x1, y0, y1, z0, z1, mat, grow = 'y') {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate(0, (y1 - y0) / 2, 0);
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2);
  m.castShadow = m.receiveShadow = true;
  m.userData.grow = grow;
  return m;
}

function brickFor(mat, w, h) {
  const m = mat.clone();
  m.map = mat.map.clone();
  m.normalMap = mat.normalMap.clone();
  m.map.repeat.set(w / 3.9, h / 4.3);
  m.normalMap.repeat.copy(m.map.repeat);
  m.map.needsUpdate = m.normalMap.needsUpdate = true;
  m.color = new THREE.Color('#d9cfc9'); // keep it in the clay family: muted dark iron-spot
  return m;
}

// A canopy wing: a flat convex slab (points fanned from the first), clay top with p28-style
// banding parallel to the leading edge, mirror-finish soffit with ribs radiating from the low
// inner corner (p26).
function wing(points, top, soffit, bands = 16) {
  const P = points.map((p) => new THREE.Vector3(...p));
  const o = P[0].clone();
  const th = 5;
  const T = P.map((p) => p.clone().sub(o));
  const B = T.map((p) => p.clone().add(new THREE.Vector3(0, -th, 0)));
  const pos = [];
  const push = (...v) => v.forEach((p) => pos.push(p.x, p.y, p.z));
  for (let i = 1; i < T.length - 1; i++) push(T[0], T[i + 1], T[i]);
  const nTop = pos.length / 3;
  for (let i = 1; i < B.length - 1; i++) push(B[0], B[i], B[i + 1]);
  const nBot = pos.length / 3 - nTop;
  for (let i = 0; i < T.length; i++) {
    const j = (i + 1) % T.length;
    push(T[i], T[j], B[j], T[i], B[j], B[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.addGroup(0, nTop, 0);
  g.addGroup(nTop, nBot, 1);
  g.addGroup(nTop + nBot, pos.length / 3 - nTop - nBot, 0);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, [top, soffit]);
  m.position.copy(o);
  m.castShadow = m.receiveShadow = true;
  m.userData.grow = 'all';
  const lines = (arr, opacity) => {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    m.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity })));
  };
  // leading edge = points[1] → points[2]; bands step from it toward the back corner(s)
  const back = T.length > 3 ? T[3] : T[0];
  const band = [];
  for (let i = 1; i < bands; i++) {
    const f = i / bands;
    const p = T[1].clone().lerp(T[0], f);
    const q = T[2].clone().lerp(back, f);
    band.push(p.x, p.y + 0.4, p.z, q.x, q.y + 0.4, q.z);
  }
  lines(band, 0.5);
  const rib = [];
  for (let i = 1; i < 12; i++) {
    const q = B[1].clone().lerp(B[2], i / 12);
    rib.push(B[0].x, B[0].y - 0.3, B[0].z, q.x, q.y - 0.3, q.z);
  }
  lines(rib, 0.45);
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.4 })));
  return m;
}

function tree(x, z, s, mat) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * s, 1 * s, 14 * s, 6), mat);
  trunk.position.y = 7 * s;
  g.add(trunk);
  const r = (n) => Math.sin(n * 12.9898 + x * 0.1) * 0.5 + 0.5;
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry((7 + 4 * r(i)) * s, 1), mat);
    b.position.set((r(i + 1) - 0.5) * 16 * s, (18 + r(i + 2) * 8) * s, (r(i + 3) - 0.5) * 16 * s);
    b.castShadow = true;
    g.add(b);
  }
  g.position.set(x, 0, z);
  return g;
}

export function build(ctx, S) {
  const { camera, rig, post } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  const L = layer('reveal');

  const clay = clayMaterial();
  const clayLight = clayMaterial('#f6f6f8');
  const steel = ctx.materials.steel.clone();
  steel.color = new THREE.Color('#b8bcc0');
  const glass = glassMaterial(0.5);
  const finMat = new THREE.MeshStandardMaterial({ color: '#eef4f3', roughness: 0.22, metalness: 0.45, envMapIntensity: 1.2 });
  const mirror = stainlessMaterial();
  const board = digitalMaterial({ cols: 64, rows: 36, size: 512 });
  board.emissiveMap.repeat.set(1, 1);

  // --- environment: p26 sky, white plaza, warm low sun ----------------------------------------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(18000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#7b8399') }, hor: { value: new THREE.Color('#dde0e8') } },
      vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top, hor; varying vec3 p; void main(){ float h = clamp(p.y, 0.0, 1.0); gl_FragColor = vec4(mix(hor, top, pow(h, 0.45)), 1.0); }',
    }),
  );
  sky.renderOrder = -300;
  root.add(sky);

  // ground with an opening for the bowl
  const per = perimeter(72, FIELD_HALF);
  const shape = new THREE.Shape();
  shape.moveTo(-12000, -12000);
  shape.lineTo(12000, -12000);
  shape.lineTo(12000, 12000);
  shape.lineTo(-12000, 12000);
  const hole = new THREE.Path();
  per.forEach((p, i) => {
    const x = p.x + p.nx * 130;
    const y = -(p.z + p.nz * 130 + BOWL_Z);
    i ? hole.lineTo(x, y) : hole.moveTo(x, y);
  });
  shape.holes.push(hole);
  const ground = new THREE.Mesh(new THREE.ShapeGeometry(shape), clayMaterial(C.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const hemi = new THREE.HemisphereLight('#8d96ad', '#e3e6ec', 1.15);
  const sun = new THREE.DirectionalLight('#ffd7ad', 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1100, right: 1100, top: 1100, bottom: -1100, near: 10, far: 6000 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, 0, -300);
  sun.target = sunTarget;
  root.add(hemi, sun, sunTarget);

  // --- simplified massing (clay ghost, present from the first frame) --------------------------
  const ghost = new THREE.Group();
  root.add(ghost);
  const bowl = new THREE.Mesh(surfaces(per, RIB_BOWL, () => true), clay);
  bowl.material = clay.clone();
  bowl.material.side = THREE.DoubleSide;
  bowl.position.z = BOWL_Z;
  bowl.castShadow = bowl.receiveShadow = true;
  ghost.add(withEdges(bowl));
  // seating tiers: hairline rings along the lower and upper rakes so the bowl reads from the air
  {
    const seg = [];
    const ring = (u, y) => {
      for (let k = 0; k < per.length; k++) {
        const p = per[k];
        const q = per[(k + 1) % per.length];
        seg.push(p.x + p.nx * u, y, p.z + p.nz * u, q.x + q.nx * u, y, q.z + q.nz * u);
      }
    };
    const rake = (a, b, rows) => {
      for (let i = 1; i < rows; i++) {
        const f = i / rows;
        ring(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + 0.3);
      }
    };
    rake(RIB_BOWL[0], RIB_BOWL[1], 14);
    rake(RIB_BOWL[3], RIB_BOWL[4], 12);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const tiers = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.28 }));
    tiers.position.z = BOWL_Z;
    ghost.add(tiers);
  }
  const field = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_HALF.x * 2, FIELD_HALF.z * 2), clayMaterial('#dfe5e1'));
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, -12, BOWL_Z);
  ghost.add(field);
  const X = (px) => p26([px, 0])[0];
  // facade block behind the board and both tower cores
  ghost.add(withEdges(box(X(605), X(1470), 0, 151, -110, -14, clay)));
  ghost.add(withEdges(box(X(452), X(603), 0, 280, -96, -4, clay)));
  ghost.add(withEdges(box(X(1502), X(1653), 0, 212, -96, -4, clay)));
  ghost.add(withEdges(box(X(40), X(450), 0, 112, -120, -20, clay)));
  ghost.add(withEdges(box(X(1590), X(1800), 0, 108, -130, -30, clay)));
  const trees = new THREE.Group();
  [
    [-520, 90, 1.3],
    [-455, 150, 1.1],
    [-405, 70, 1.2],
    [-610, 160, 1.0],
    [480, 100, 1.2],
    [560, 150, 1.1],
    [640, 80, 1.3],
    [-700, 60, 1.0],
  ].forEach(([x, z, s]) => trees.add(tree(x, z, s * 1.6, clayLight)));
  ghost.add(trees);

  // --- layers (p26 build order) --------------------------------------------------------------
  const layers = {};
  const add = (id, ...meshes) => {
    if (!layers[id]) layers[id] = new THREE.Group();
    meshes.forEach((m) => layers[id].add(m));
    root.add(layers[id]);
  };
  // masonry bases, y 680–750 on p26
  const brick = ctx.materials.masonry;
  [
    [40, 450, 42, -70, -2],
    [690, 750, 42, -70, -2],
    [1240, 1340, 42, -60, -2],
    [1590, 1800, 84, -80, -2],
  ].forEach(([a, b, h, z0, z1]) => add('masonry', withEdges(box(X(a), X(b), 0, h, z0, z1, brickFor(brick, X(b) - X(a), h)))));
  // grand stair under the board
  for (let i = 0; i < 9; i++) add('masonry', withEdges(box(X(860) + i * 2, X(1070) - i * 2, 0, 4 + i * 4, 56 - i * 10, 66 - i * 10, clay)));
  // steel frame: slab edges at each concourse, columns, entry canopy
  [42, 81, 105, 128, 151].forEach((y) => {
    add('steel', box(X(605), X(770), y - 1.5, y + 1.5, -96, 2, steel, 'x'));
    add('steel', box(X(1160), X(1470), y - 1.5, y + 1.5, -96, 2, steel, 'x'));
  });
  for (let x = 610; x <= 1465; x += 52) if (x < 770 || x > 1160) add('steel', box(X(x) - 1, X(x) + 1, 0, 151, 0, 3, steel));
  add('steel', box(X(1240), X(1590), 54, 59, -10, 46, steel, 'x'));
  for (let x = 1260; x <= 1580; x += 64) add('steel', box(X(x) - 0.8, X(x) + 0.8, 0, 54, 40, 42, steel));
  add('steel', box(X(900) - 2, X(900) + 2, 0, 62, 14, 18, steel), box(X(1030) - 2, X(1030) + 2, 0, 62, 14, 18, steel));
  // glazing bands (three levels), low glazing, tower curtain walls
  [
    [605, 770, 42, 151, -8],
    [1160, 1470, 42, 151, -8],
    [470, 690, 0, 42, -30],
    [1340, 1590, 0, 54, -36],
  ].forEach(([a, b, y0, y1, z]) => add('glazing', box(X(a), X(b), y0, y1, z - 1, z, glass)));
  add('glazing', box(X(450), X(605), 0, 283, -98, -2, glass), box(X(1500), X(1655), 0, 214, -98, -2, glass));
  // tower mullion grid (p26 left tower face)
  for (let y = 18; y < 283; y += 18) add('glazing', box(X(450), X(548), y, y + 0.8, -1.5, 0, clayLight, 'x'));
  for (let x = 450; x < 548; x += 24) add('glazing', box(X(x), X(x) + 0.8, 0, 283, -1.5, 0, clayLight));
  // vertical fins: right third of the left tower, the right fin cluster (fin depth 6–8')
  for (let i = 0; i < 7; i++) add('fins', withEdges(box(X(550) + i * 5.6, X(550) + i * 5.6 + 1.6, 0, 283, -4, 4, finMat)));
  for (let i = 0; i < 16; i++) {
    const top = 186 + 28 * Math.sin(i * 0.55) + (i % 3) * 6;
    add('fins', withEdges(box(X(1500) + i * 5.8, X(1500) + i * 5.8 + 1.6, 84, top, -4, 4, finMat)));
  }
  for (let i = 0; i < 12; i++) add('fins', withEdges(box(X(40) + 20 + i * 9, X(40) + 21.6 + i * 9, 42, 112, -24, -18, finMat)));
  // the keystone video board (p26: top 768–1163 @ y 432, bottom 778–1150 @ y 648)
  {
    const [x0, y0] = p26([778, 648]);
    const [x1] = p26([1150, 648]);
    const [x2, y1] = p26([1163, 432]);
    const [x3] = p26([768, 432]);
    const sh = new THREE.Shape([new THREE.Vector2(x0, 0), new THREE.Vector2(x1, 0), new THREE.Vector2(x2, y1 - y0), new THREE.Vector2(x3, y1 - y0)]);
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 12, bevelEnabled: false }), clay);
    frame.position.set(0, y0, 10);
    frame.castShadow = true;
    frame.userData.grow = 'y';
    const faceG = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(x0 + 3, 3), new THREE.Vector2(x1 - 3, 3), new THREE.Vector2(x2 - 3, y1 - y0 - 3), new THREE.Vector2(x3 + 3, y1 - y0 - 3)]));
    // normalise UVs to the face
    const uv = faceG.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - x3) / (x2 - x3), uv.getY(i) / (y1 - y0));
    const face = new THREE.Mesh(faceG, board);
    face.position.z = 12.3;
    frame.add(face);
    add('board', withEdges(frame));
  }
  // reflective soffit + canopy wings (rising toward the corners), and the far-left low roof
  const wingTop = clay.clone();
  wingTop.side = THREE.DoubleSide;
  const wingSoffit = mirror.clone();
  wingSoffit.side = THREE.DoubleSide;
  const W = (pts) => wing(pts, wingTop, wingSoffit);
  const mirrorZ = (p) => [p[0], p[1], 2 * BOWL_Z - p[2]];
  // p26: the right wing's soffit reads as a big triangle — low inner corner by the board (page
  // 1246,493) and a high, level leading edge at y 335 from x 1412 out to the tip at x 1980 — and
  // the slab carries on back over the bowl rim. The left wing is the same gesture, lower and
  // shorter (tip 275,440; inner corner 710,500). Points: inner, leading edge ×2, back.
  const wings = [
    [[...p26([1246, 493]), -30], [...p26([1412, 335]), 40], [...p26([1980, 335]), 70], [440, 205, -520]],
    [[...p26([710, 500]), -30], [...p26([610, 440]), 30], [...p26([275, 440]), 50], [-360, 176, -480]],
  ];
  wings.forEach((w) => add('soffit', W(w)));
  wings.forEach((w) => add('soffit', W(w.map(mirrorZ))));
  {
    const low = box(X(25), X(450), 116, 121, -120, 34, [clay, clay, clay, mirror, clay, clay], 'x');
    add('soffit', withEdges(low));
  }

  // grow helpers
  Object.values(layers).forEach((g) =>
    g.children.forEach((m, i) => {
      m.userData.baseScale = m.scale.clone();
      m.userData.order = i / Math.max(1, g.children.length - 1);
    }),
  );

  // --- timeline ---------------------------------------------------------------------------------
  const ORDER = REVEAL.layers.map((l) => l.id);
  const LT = Object.fromEntries(ORDER.map((id, i) => [id, S.start + 1.4 + i * 1.15]));
  const lp = Object.fromEntries(ORDER.map((id) => [id, 0]));
  const lpObj = lp;
  ORDER.forEach((id) => to(lpObj, LT[id], id === 'soffit' ? 1.7 : 1.15, { [id]: 1 }, 'power3.out'));

  // tiles: masonry, steel, glass (glazing), digital (board), reflective (soffit)
  const tileMap = [
    ['masonry', 'masonry'],
    ['steel', 'steel'],
    ['glass', 'glazing'],
    ['digital', 'board'],
    ['reflective', 'soffit'],
  ];
  const tiles = buildTiles(ctx.materials);
  const flights = tileMap.map(([tid, lid], i) => {
    const g = tiles[tid];
    root.add(g);
    const s = { k: 0 };
    to(s, LT[lid] - 1.15, 1.15, { k: 1 }, EASE.camera);
    return { g, s, lid, i };
  });

  // camera: plaza eye level (p26) → slow push → crane to a 3/4 aerial framing both wings
  to(rig, S.start - 0.01, 0.01, { x: 21, y: 64, z: 1400, tx: 21, ty: 110, tz: 0, fov: 27, roll: 0 }, 'none');
  to(rig, S.start + 0.2, 7.4, { x: 21, y: 70, z: 1290, tx: 21, ty: 112, tz: 0, fov: 27 }, 'power1.inOut');
  to(rig, S.start + 7.6, 4.6, { x: 1300, y: 900, z: 1350, tx: -250, ty: -40, tz: -420, fov: 33 }, EASE.camera);

  const sunS = { a: 0 };
  to(sunS, S.start, S.end - S.start, { a: 1 }, 'power1.inOut');

  // --- labels with leader lines (p26 grammar) ---------------------------------------------
  const A = (px, y, z = 6) => new THREE.Vector3(p26([px, 0])[0], y, z);
  const LABELS = {
    masonry: [
      [A(381, 22), 'bottom'],
      [A(732, 22), 'bottom'],
      [A(1249, 22), 'bottom'],
      [A(1655, 40), 'bottom'],
    ],
    steel: [[A(1320, 105, 3), 'top']],
    glazing: [
      [A(725, 128, -8), 'top'],
      [A(1215, 128, -8), 'top'],
      [A(569, 24, -30), 'bottom'],
      [A(1433, 30, -36), 'bottom'],
    ],
    fins: [
      [A(577, 250, 4), 'top'],
      [A(1634, 190, 4), 'top'],
    ],
    board: [[A(988, 150, 22), 'top']],
    soffit: [
      [A(368, 160, -20), 'top'],
      [A(1441, 205, 0), 'top'],
    ],
  };
  const labels = [];
  REVEAL.layers.forEach(({ id, label }) => {
    (LABELS[id] || []).forEach(([anchor, row], j) => {
      // p26: light labels on the sky, dark grey labels on the white plaza
      const dark = row === 'bottom';
      const txt = el('div', 'abs', L, {
        fontSize: '24px',
        fontWeight: dark ? '400' : '300',
        color: dark ? '#3a4448' : '#f3f5f7',
        transform: 'translateX(-50%)',
        textShadow: dark ? 'none' : '0 1px 10px rgba(40,46,60,0.35)',
      });
      txt.textContent = label;
      const line = el('div', 'abs', L, { width: '1px', background: dark ? 'rgba(58,68,72,0.7)' : 'rgba(246,248,250,0.85)' });
      const at = LT[id] + 0.5 + j * 0.08;
      show(txt, at, 0.6, { y: row === 'top' ? -10 : 10 });
      show(line, at, 0.5);
      hide(txt, S.start + 8.6, 0.5);
      hide(line, S.start + 8.6, 0.5);
      labels.push({ txt, line, anchor, row });
    });
  });

  // --- end card ---------------------------------------------------------------------------------
  const endSc = scrim(L, { left: '0', top: '640px', width: '1920px', height: '440px', background: 'linear-gradient(0deg, rgba(6,36,40,0.78), rgba(6,36,40,0))' });
  show(endSc, 75.8, 1.0, {}, 'power2.out');
  const endT = textBlock(L, REVEAL.endTitle, { left: '96px', top: '812px', fontSize: '112px', fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1' });
  typeOn(endT, 76.2, { duration: 1.0, per: 0.05, rise: 26 });
  const endL = textBlock(L, REVEAL.endLine, { left: '100px', top: '944px', fontSize: '38px', fontWeight: '300', color: '#e3f1ee' });
  typeOn(endL, 76.4, { duration: 0.8, per: 0.014, rise: 12 });
  to(ctx.fade, 80.4, 0.6, { v: 1 }, 'power2.inOut');

  // --- per frame ----------------------------------------------------------------------------
  const fog = new THREE.Fog('#dde0e8', 3000, 16000);
  const v = new THREE.Vector3();
  const from = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  const centroid = {};
  Object.entries(layers).forEach(([id, g]) => {
    const b = new THREE.Box3().setFromObject(g);
    centroid[id] = b.getCenter(new THREE.Vector3());
    centroid[id].z = Math.max(centroid[id].z, 0) + 20;
  });

  function update(t) {
    post.ao.enabled = true;
    post.ao.configuration.aoRadius = 26;
    post.dofPass.enabled = true;
    post.dof.cocMaterial.worldFocusDistance = camera.position.distanceTo(v.set(0, 110, -60));
    post.dof.cocMaterial.worldFocusRange = 1400;
    post.dof.bokehScale = 1.1;
    ctx.scene.fog = fog;

    const a = -1.05 + 0.9 * sunS.a;
    sun.position.set(Math.cos(a) * 2600, 520 + 260 * sunS.a, Math.sin(a) * 2600 + 600);
    sun.color.set('#ffd2a1').lerp(new THREE.Color('#ffe3c4'), sunS.a);
    board.userData.draw(t, 'wave', 1);

    for (const [id, g] of Object.entries(layers)) {
      const p = lp[id];
      g.visible = p > 0.001;
      g.children.forEach((m) => {
        const k = easeOut(clamp01(p * 1.6 - m.userData.order * 0.6));
        const s = Math.max(0.001, k);
        const b = m.userData.baseScale;
        if (m.userData.grow === 'x') m.scale.set(b.x * s, b.y, b.z);
        else if (m.userData.grow === 'all') m.scale.set(b.x * s, b.y * s, b.z * s);
        else m.scale.set(b.x, b.y * s, b.z);
      });
    }
    // tiles: start in a row in front of the lens, fly into their layer and shrink into it
    for (const f of flights) {
      const k = f.s.k;
      f.g.visible = k > 0.001 && k < 0.999;
      if (!f.g.visible) continue;
      from.set((f.i - 2) * 6.2, -4.5, -48).applyMatrix4(camera.matrixWorld);
      tgt.copy(centroid[f.lid]);
      f.g.position.lerpVectors(from, tgt, k);
      f.g.position.y += Math.sin(k * Math.PI) * 60;
      const size = THREE.MathUtils.lerp(4.4, 46, k) * (1 - Math.pow(k, 6));
      f.g.scale.setScalar(Math.max(0.01, size));
      f.g.quaternion.copy(camera.quaternion);
      f.g.rotateY(k * 2.4);
    }
    // leader labels follow their anchors on screen
    for (const l of labels) {
      v.copy(l.anchor).project(camera);
      const x = (v.x * 0.5 + 0.5) * 1920;
      const y = (-v.y * 0.5 + 0.5) * 1080;
      l.txt.style.left = `${x}px`;
      if (l.row === 'top') {
        l.txt.style.top = '186px';
        l.line.style.left = `${x}px`;
        l.line.style.top = '222px';
        l.line.style.height = `${Math.max(0, y - 222)}px`;
      } else {
        l.txt.style.top = '902px';
        l.line.style.left = `${x}px`;
        l.line.style.top = `${y}px`;
        l.line.style.height = `${Math.max(0, 896 - y)}px`;
      }
    }
  }

  // camera poses for side-by-side checks against the deck renderings (qa/)
  ctx.stills = {
    p26: { pos: [21, 64, 1400], target: [21, 110, 0], fov: 27 }, // Plaza View
    p29: { pos: [760, 22, 560], target: [180, 150, -200], fov: 44 }, // GA West Entry: corner view under the rising wing
  };

  return { root, layer: L, window: [S.start, S.end], update };
}

const easeOut = (x) => 1 - Math.pow(1 - x, 3);
