// Site: clay ground, the Studio MLA site plan (p74) draped beneath the model, white
// stylized trees (p26-29), a crowd on the plaza (scene 4 mirror, scene 7) and the two
// ticketing canopies (p76).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FT, PAL, TICKETING } from './data.js';
import { rng } from './textures.js';
import { MAT } from './materials.js';

export function buildSite(siteplanMeta) {
  const root = new THREE.Group();
  root.name = 'Site';

  // ground
  const groundMat = new THREE.MeshStandardMaterial({ color: '#EDEEF1', roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(4200, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  ground.name = 'ground';
  root.add(ground);

  // site plan drape (p74): image left = deck north, image up = deck east
  const m = siteplanMeta;
  const s = m.ftPerPx;
  const [cu, cv] = m.fieldCenterPx;
  const corner = (u, v) => [-(v - cv) * s * FT, 0.03, (u - cu) * s * FT];
  const g = new THREE.BufferGeometry();
  const P = [corner(0, 0), corner(0, m.h), corner(m.w, m.h), corner(0, 0), corner(m.w, m.h), corner(m.w, 0)];
  const UV = [[0, 1], [0, 0], [1, 0], [0, 1], [1, 0], [1, 1]];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV.flat(), 2));
  g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) { // keep it facing up
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  }
  const planTex = new THREE.TextureLoader().load(import.meta.env.BASE_URL + 'assets/siteplan.jpg');
  planTex.colorSpace = THREE.SRGBColorSpace;
  planTex.anisotropy = 8;
  const planMat = new THREE.MeshStandardMaterial({ map: planTex, roughness: 1, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  planMat.polygonOffset = true; planMat.polygonOffsetFactor = -2; planMat.polygonOffsetUnits = -2;
  const plan = new THREE.Mesh(g, planMat);
  plan.receiveShadow = true;
  plan.renderOrder = 1;
  plan.name = 'siteplan';
  root.add(plan);

  const trees = buildTrees();
  root.add(trees);
  const crowd = buildCrowd();
  root.add(crowd.mesh);
  const ticketing = buildTicketing();
  root.add(ticketing.group);

  // trees grow in/out (scene 6 -> 7) by scaling their instances
  const base = [];
  for (let i = 0; i < trees.count; i++) { const m = new THREE.Matrix4(); trees.getMatrixAt(i, m); base.push(m); }
  let treeK = 1;
  const setTrees = (k) => {
    if (Math.abs(k - treeK) < 1e-4) return;
    treeK = k;
    trees.visible = k > 0.001;
    const s = new THREE.Matrix4(), t = new THREE.Matrix4();
    base.forEach((m, i) => {
      const e = Math.min(1, Math.max(0, k * 1.6 - (i % 7) * 0.09)); // staggered growth
      s.makeScale(e, e, e);
      t.copy(m).multiply(s);
      trees.setMatrixAt(i, t);
    });
    trees.instanceMatrix.needsUpdate = true;
  };

  return { root, ground, groundMat, plan, planMat, trees, crowd, ticketing, setTrees };
}

// ------------------------------------------------------------------ trees
function treeGeometry(r) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.6 * FT, 0.9 * FT, 12 * FT, 6);
  trunk.translate(0, 6 * FT, 0);
  parts.push(trunk.toNonIndexed());
  const blobs = [[0, 22, 0, 9], [5, 19, 3, 7], [-5, 19, -2, 7.5], [2, 25, -5, 6.5], [-3, 26, 4, 6], [6, 23, -4, 5.5], [-6, 22, 5, 6], [0, 29, 0, 5]];
  for (const [x, y, z, rad] of blobs) {
    const sph = new THREE.IcosahedronGeometry(rad * FT * (0.9 + r() * 0.25), 1);
    sph.translate(x * FT, y * FT, z * FT);
    parts.push(sph.toNonIndexed());
  }
  for (const p of parts) for (const k of Object.keys(p.attributes)) if (!['position', 'normal'].includes(k)) p.deleteAttribute(k);
  return mergeGeometries(parts);
}

export const TREE_SPOTS = (() => {
  const r = rng(42);
  const pts = [];
  const line = (x0, z0, x1, z1, step, jitter = 6) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / step);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t + (r() - 0.5) * jitter, z0 + (z1 - z0) * t + (r() - 0.5) * jitter]);
    }
  };
  const grove = (cx, cz, n, rad) => { for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad; pts.push([cx + Math.cos(a) * d, cz + Math.sin(a) * d]); } };
  // plaza edges (p74/p76): Pattison Ave diagonal and the promenade allées
  line(360, -980, -520, -720, 34);
  line(300, -900, 300, -600, 40);
  line(-520, -720, -560, 420, 38, 4);
  line(-520, 560, 420, 600, 40);
  line(560, -520, 560, 480, 46);
  // groves on the plaza and at the corners (p26: trees flanking the plaza view)
  grove(420, -560, 7, 55);
  grove(-430, -600, 8, 60);
  grove(140, -760, 5, 40);
  grove(-200, -700, 5, 40);
  grove(-470, -60, 6, 45);
  grove(460, 120, 5, 40);
  grove(-120, 590, 6, 50);
  grove(150, 600, 5, 45);
  // keep the grand stair axis and building footprint clear
  return pts.filter(([x, z]) => !(Math.abs(x) < 130 && z > -900 && z < -460) && !(Math.abs(x) < 480 && Math.abs(z) < 485));
})();

function buildTrees() {
  const r = rng(9);
  const geo = treeGeometry(r);
  const mat = new THREE.MeshStandardMaterial({ color: '#F6F7F9', roughness: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, TREE_SPOTS.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  TREE_SPOTS.forEach(([x, z], i) => {
    const sc = 0.85 + r() * 0.4;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2);
    m.compose(new THREE.Vector3(x * FT, 0, z * FT), q, new THREE.Vector3(sc, sc, sc));
    mesh.setMatrixAt(i, m);
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'trees';
  return mesh;
}

// ------------------------------------------------------------------ crowd
function buildCrowd() {
  const r = rng(77);
  const N = 2600;
  const geo = new THREE.CapsuleGeometry(0.9 * FT, 3.6 * FT, 2, 6);
  geo.translate(0, 2.7 * FT, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  const palette = [PAL.eagles, PAL.eagles, PAL.midnight, '#F4F4F2', '#F4F4F2', PAL.silver, '#3A3E42', '#8B7A66', PAL.glassTeal, '#C9CCD0'];
  const people = [];
  const gates = [[0, -548], [-250, -556], [250, -480], [-420, 40], [470, -100], [0, 520]];
  for (let i = 0; i < N; i++) {
    let x, z, y = 0;
    const zone = r();
    if (zone < 0.2) { // open-air main concourse under the canopy (y = 30 ft)
      y = 30;
      const side = r();
      if (side < 0.7) { x = (r() < 0.5 ? -1 : 1) * (318 + r() * 66); z = (r() - 0.5) * 820; }
      else { x = (r() - 0.5) * 560; z = (r() < 0.5 ? -1 : 1) * (412 + r() * 40); }
      people.push({ x, z, y, dx: 0, dz: r() < 0.5 ? -1 : 1, len: 60 + r() * 60, speed: 1.5 + r(), ph: r() * 60, s: 0.9 + r() * 0.2 });
      mesh.setColorAt(i, new THREE.Color(palette[(r() * palette.length) | 0]));
      continue;
    }
    if (zone < 0.66) { x = (r() - 0.5) * 760; z = -490 - r() * 470; } // north plaza
    else if (zone < 0.78) { x = -470 - r() * 110; z = -420 + r() * 820; } // west
    else if (zone < 0.9) { x = 440 + r() * 90; z = -420 + r() * 700; } // east
    else { x = (r() - 0.5) * 600; z = 500 + r() * 120; } // south
    let gi = 0, best = 1e9;
    gates.forEach(([gx, gz], k) => { const d = Math.hypot(gx - x, gz - z); if (d < best) { best = d; gi = k; } });
    const [gx, gz] = gates[gi];
    const L = Math.hypot(gx - x, gz - z) || 1;
    people.push({ x, z, y, dx: (gx - x) / L, dz: (gz - z) / L, len: L, speed: 3.6 + r() * 1.6, ph: r() * L, s: 0.9 + r() * 0.2 });
    mesh.setColorAt(i, new THREE.Color(palette[(r() * palette.length) | 0]));
  }
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = 'crowd';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const update = (t, appear = 1) => {
    for (let i = 0; i < N; i++) {
      const p = people[i];
      // walk toward the gate, loop back once there (deterministic in t)
      const d = (p.ph + p.speed * t) % (p.len * 0.9);
      v.set((p.x + p.dx * d) * FT, p.y * FT, (p.z + p.dz * d) * FT);
      const k = appear * p.s;
      sc.set(k, k, k);
      m4.compose(v, q, sc);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0, 0);
  return { mesh, update };
}

// ------------------------------------------------------------------ ticketing canopies
function scalePath(path, length) {
  let L = 0;
  for (let i = 1; i < path.length; i++) L += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  const k = length / L;
  const [ax, az] = path[0];
  return path.map(([x, z]) => [ax + (x - ax) * k, az + (z - az) * k]);
}

function buildTicketing() {
  const group = new THREE.Group();
  group.name = 'Ticketing';
  const items = [];
  for (const tc of TICKETING) {
    const pts = scalePath(tc.path, tc.length);
    const slabs = [], posts = [], line = [];
    const W = 20, H = 15, step = 6;
    let run = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
      const L = Math.hypot(x1 - x0, z1 - z0);
      const ang = Math.atan2(x1 - x0, z1 - z0);
      const n = Math.ceil(L / step);
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const cx = x0 + (x1 - x0) * (t0 + t1) / 2, cz = z0 + (z1 - z0) * (t0 + t1) / 2;
        const sl = new THREE.BoxGeometry(W * FT, 1.2 * FT, (L / n + 0.3) * FT);
        sl.rotateY(ang);
        sl.translate(cx * FT, H * FT, cz * FT);
        slabs.push({ g: sl.toNonIndexed(), at: run + L * (t0 + t1) / 2 });
        if (k % 5 === 0) {
          const po = new THREE.CylinderGeometry(0.5 * FT, 0.5 * FT, H * FT, 6);
          po.translate(cx * FT, (H / 2) * FT, cz * FT);
          posts.push({ g: po.toNonIndexed(), at: run + L * t0 });
        }
      }
      // dimension string offset 34 ft to the outside of the path
      const nx = Math.cos(ang), nz = -Math.sin(ang);
      line.push([[x0 + nx * 34, z0 + nz * 34], [x1 + nx * 34, z1 + nz * 34], run, run + L]);
      run += L;
    }
    const all = [...slabs, ...posts].sort((a, b) => a.at - b.at);
    for (const s of all) { for (const k of Object.keys(s.g.attributes)) if (!['position', 'normal'].includes(k)) s.g.deleteAttribute(k); }
    const geo = mergeGeometries(all.map((s) => s.g));
    const counts = []; let acc = 0;
    for (const s of all) { acc += s.g.attributes.position.count; counts.push([s.at, acc]); }
    const mesh = new THREE.Mesh(geo, MAT.materials.steel);
    mesh.castShadow = true; mesh.receiveShadow = true;
    geo.setDrawRange(0, 0);
    group.add(mesh);
    // dimension line (3D, drawn progressively) with end ticks
    const dpos = [];
    for (const [[ax, az], [bx, bz]] of line) dpos.push(ax * FT, 2 * FT, az * FT, bx * FT, 2 * FT, bz * FT);
    const first = line[0], last = line[line.length - 1];
    const tick = (x, z, ang) => { const tx = Math.cos(ang) * 14, tz = -Math.sin(ang) * 14; dpos.push((x - tx) * FT, 2 * FT, (z - tz) * FT, (x + tx) * FT, 2 * FT, (z + tz) * FT); };
    const a0 = Math.atan2(first[1][0] - first[0][0], first[1][1] - first[0][1]);
    const a1 = Math.atan2(last[1][0] - last[0][0], last[1][1] - last[0][1]);
    tick(first[0][0], first[0][1], a0); tick(last[1][0], last[1][1], a1);
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dpos, 3));
    const dim = new THREE.LineSegments(dg, new THREE.LineBasicMaterial({ color: PAL.midnight, transparent: true, opacity: 0, depthTest: false }));
    dim.renderOrder = 5;
    group.add(dim);
    // label anchor = mid-length point of the dimension string
    let midAt = run / 2, anchor = null;
    for (const [[ax, az], [bx, bz], r0, r1] of line) if (midAt >= r0 && midAt <= r1) {
      const t = (midAt - r0) / (r1 - r0);
      anchor = new THREE.Vector3((ax + (bx - ax) * t) * FT, 2 * FT, (az + (bz - az) * t) * FT);
    }
    const item = {
      tc, mesh, dim, anchor, total: run,
      setProgress(p) {
        const at = p * run;
        let n = 0;
        for (const [a, c] of counts) { if (a <= at) n = c; else break; }
        geo.setDrawRange(0, n);
        mesh.visible = n > 0;
        const segs = line.length;
        let shown = 0;
        line.forEach(([, , r0, r1], i) => { if (at >= r1) shown = i + 1; else if (at > r0) shown = i + 1; });
        dg.setDrawRange(0, p >= 1 ? (segs + 2) * 2 : shown * 2);
      },
    };
    item.setProgress(0);
    items.push(item);
  }
  return { group, items };
}
