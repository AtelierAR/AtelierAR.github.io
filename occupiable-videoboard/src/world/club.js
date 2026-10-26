// The video board club inside the north volume (p97–99): deep coffered ceiling beams,
// floor-to-ceiling curtain wall to the bowl set behind the LED veil, low curved lounge
// chairs, bar-height counters at the glass and stylised white figures.
// Built in the volume's local frame (x east, y up, z away from the field) and placed with a
// mirrored transform. No capacities or partners are implied.
import * as THREE from 'three';
import { FLOORS } from '../data.js';
import { PLACEMENT, sectionAt } from './volumes.js';

const CLAY = new THREE.Color('#F1F2F4');

export function buildClub(volume, quality = 'high') {
  const pl = PLACEMENT[volume.key];
  const group = new THREE.Group();
  group.name = 'club';
  group.position.copy(pl.origin);
  if (pl.flipZ) group.scale.z = -1;

  const floorY = FLOORS.find((f) => f.key === 'club').y; // 12
  const ceilY = FLOORS.find((f) => f.key === 'upperSuite').y - 1.5; // underside of the next plate
  const H = ceilY - floorY;
  const a = volume.params.a;
  const skinZ = (y) => -a * y; // field face plane in local coords
  const wallZ = 8; // curtain wall set 8' behind the LED veil

  const clay = new THREE.MeshStandardMaterial({ color: CLAY, roughness: 0.82 });
  const clayDark = new THREE.MeshStandardMaterial({ color: new THREE.Color('#D9DDE1'), roughness: 0.85 });
  const fabric = new THREE.MeshStandardMaterial({ color: new THREE.Color('#E6E8EB'), roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: new THREE.Color('#A5ACAF'), roughness: 0.4, metalness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#CFE7E4'),
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const figureMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFFFFF'), roughness: 0.6, emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.05 });

  const add = (geo, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = quality === 'high';
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  const sec = sectionAt(volume.local, floorY + 1, 1.5);
  const xMax = Math.max(...sec.map((p) => p[0])) - 2;
  const zBack = Math.max(...sec.map((p) => p[1])) - 4;

  // ---- curtain wall: mullions on a 5' module, transom, open central bay (doors open)
  const opening = 9;
  const mull = new THREE.BoxGeometry(0.35, H, 0.6);
  for (let x = -xMax; x <= xMax; x += 5) {
    if (Math.abs(x) < opening) continue;
    add(mull, metal, x, floorY + H / 2, wallZ);
  }
  const transomL = new THREE.BoxGeometry(xMax - opening, 0.3, 0.5);
  for (const s of [-1, 1]) {
    add(transomL, metal, s * (opening + (xMax - opening) / 2), floorY + 9, wallZ);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(xMax - opening, H), glass);
    pane.position.set(s * (opening + (xMax - opening) / 2), floorY + H / 2, wallZ);
    pane.renderOrder = 5;
    group.add(pane);
  }
  // door leaves slid aside in the open bay
  const leaf = new THREE.BoxGeometry(0.3, H - 0.6, 4.5);
  for (const s of [-1, 1]) add(leaf, metal, s * (opening + 0.4), floorY + H / 2, wallZ + 2.4);
  // structural columns in the glazing line (p98)
  const col = new THREE.BoxGeometry(2.6, H, 2.6);
  for (const x of [-60, -24, 24, 60]) add(col, clay, x, floorY + H / 2, wallZ + 1.6);

  // ---- deep coffered ceiling: perimeter beam + grid of deep beams
  const beamD = 3.4;
  add(new THREE.BoxGeometry(2 * xMax, beamD + 1.2, 3), clay, 0, ceilY - (beamD + 1.2) / 2, wallZ + 1.5);
  for (let z = wallZ + 14; z < zBack; z += 18) add(new THREE.BoxGeometry(2 * xMax, beamD, 2.2), clay, 0, ceilY - beamD / 2, z);
  for (let x = -xMax + 6; x <= xMax - 6; x += 24)
    add(new THREE.BoxGeometry(2.2, beamD, zBack - wallZ), clay, x, ceilY - beamD / 2, wallZ + (zBack - wallZ) / 2);
  // ceiling soffit panel (so the coffers read)
  add(new THREE.BoxGeometry(2 * xMax, 0.4, zBack - wallZ), clayDark, 0, ceilY - 0.2, wallZ + (zBack - wallZ) / 2);
  // terrace soffit between the veil and the glass
  add(new THREE.BoxGeometry(2 * xMax, 0.4, wallZ - skinZ(ceilY) - 1), clayDark, 0, ceilY - 0.2, (wallZ + skinZ(ceilY)) / 2 + 0.5);

  // ---- bar-height counters at the glass + stools
  const counterGeo = new THREE.BoxGeometry(1, 3.5, 1.6);
  const stoolSeat = new THREE.CylinderGeometry(0.75, 0.75, 0.25, 16);
  const stoolLeg = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
  const counters = [[-88, -50], [-42, -14], [14, 42], [50, 88]];
  for (const [x0, x1] of counters) {
    const c = add(counterGeo, clay, (x0 + x1) / 2, floorY + 1.75, wallZ + 2.4);
    c.scale.x = x1 - x0;
    for (let x = x0 + 2; x < x1 - 1; x += 3.2) {
      add(stoolSeat, fabric, x, floorY + 2.75, wallZ + 4.3);
      add(stoolLeg, metal, x, floorY + 1.3, wallZ + 4.3);
    }
  }

  // ---- low curved lounge chairs, sofas, low tables (p98–99)
  const chairShell = new THREE.CylinderGeometry(1.7, 1.7, 2.5, 28, 1, true, -Math.PI * 0.62, Math.PI * 1.24);
  const chairSeat = new THREE.CylinderGeometry(1.55, 1.55, 1.25, 28);
  const sofaBase = new THREE.BoxGeometry(7, 1.4, 2.8);
  const sofaBack = new THREE.BoxGeometry(7, 1.3, 0.7);
  const tableTop = new THREE.BoxGeometry(4.2, 0.25, 2.4);
  const tableBase = new THREE.BoxGeometry(1.4, 1.0, 0.9);
  const shellMat = fabric.clone();
  shellMat.side = THREE.DoubleSide;
  const chair = (x, z, ry) => {
    const g = new THREE.Group();
    const s = new THREE.Mesh(chairShell, shellMat);
    s.position.y = 1.25;
    const seat = new THREE.Mesh(chairSeat, fabric);
    seat.position.y = 0.62;
    g.add(s, seat);
    g.position.set(x, floorY, z);
    g.rotation.y = ry;
    g.traverse((m) => (m.castShadow = m.receiveShadow = true));
    group.add(g);
  };
  const cluster = (x, z, rot = 0) => {
    add(tableTop, clay, x, floorY + 1.15, z, rot);
    add(tableBase, clay, x, floorY + 0.5, z, rot);
    const sb = add(sofaBase, fabric, x, floorY + 0.7, z + 3.8, rot);
    sb.position.set(x + Math.sin(rot) * 3.8, floorY + 0.7, z + Math.cos(rot) * 3.8);
    const bk = add(sofaBack, fabric, x, floorY + 2.0, z, rot);
    bk.position.set(x + Math.sin(rot) * 4.9, floorY + 2.0, z + Math.cos(rot) * 4.9);
    chair(x - 4.4 * Math.cos(rot), z + 4.4 * Math.sin(rot) - 2.2, rot + Math.PI * 0.5 + 0.4);
    chair(x + 4.4 * Math.cos(rot), z - 4.4 * Math.sin(rot) - 2.2, rot - Math.PI * 0.5 - 0.4);
  };
  for (const [x, z, r] of [
    [-62, 24, 0.15], [-30, 30, -0.1], [30, 30, 0.1], [62, 24, -0.15],
    [-74, 46, 0.3], [-40, 52, 0], [40, 52, 0], [74, 46, -0.3],
    [-12, 60, 0.05], [12, 64, -0.05],
  ])
    cluster(x, z, r);
  // back-of-house bar along the rear
  add(new THREE.BoxGeometry(60, 3.6, 3), clay, 0, floorY + 1.8, zBack - 6);
  add(new THREE.BoxGeometry(60, 9, 1), clayDark, 0, floorY + 4.5, zBack - 1.5);

  // ---- stylised white figures (no faces, no features)
  const figures = [];
  const body = new THREE.CapsuleGeometry(0.62, 2.9, 4, 10);
  const head = new THREE.SphereGeometry(0.42, 14, 10);
  const arm = new THREE.CapsuleGeometry(0.16, 2.0, 3, 6).translate(0, -1.15, 0);
  const figure = (x, z, ry, h = 1) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(body, figureMat);
    b.position.y = 2.1 * h;
    b.scale.setScalar(h);
    const hd = new THREE.Mesh(head, figureMat);
    hd.position.y = 4.55 * h;
    hd.scale.setScalar(h);
    const arms = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.72 * h, 3.75 * h, 0);
      const am = new THREE.Mesh(arm, figureMat);
      am.scale.setScalar(h);
      pivot.add(am);
      pivot.userData.side = s;
      arms.push(pivot);
      g.add(pivot);
    }
    g.add(b, hd);
    g.position.set(x, floorY, z);
    g.rotation.y = ry;
    g.traverse((m) => (m.castShadow = true));
    group.add(g);
    figures.push({ g, arms, phase: (x * 13.1 + z * 7.7) % 6.28 });
    return g;
  };
  // facing the field (local −z); ry = π turns the figure's +z toward −z
  for (const [x, z, h] of [
    [-80, 5.2, 1.0], [-72, 6.4, 0.96], [-46, 5.0, 1.02], [-34, 6.0, 0.95], [-21, 5.3, 1.0],
    [-4, 4.0, 1.03], [3, 5.5, 0.97], [19, 5.0, 1.0], [28, 6.2, 0.94], [44, 5.4, 1.01],
    [56, 6.0, 0.97], [70, 5.1, 1.0], [83, 6.3, 0.95],
    [-55, 16, 0.98], [-20, 18, 1.0], [8, 20, 0.96], [36, 17, 1.02], [66, 15, 0.97],
    [-46, 34, 1.0], [52, 38, 0.98], [-6, 44, 1.0],
  ])
    figure(x, z, Math.PI + (((x * 7) % 5) - 2.5) * 0.05, h);

  // figures on the upper floors and SRO terraces (seen in the section)
  for (const f of FLOORS) {
    if (f.key === 'club') continue;
    const s2 = sectionAt(volume.local, f.y + 1, 2);
    if (s2.length < 3) continue;
    const zMin = f.plate ? 10 : 34;
    const zMax = Math.max(...s2.map((p) => p[1])) - 6;
    if (zMax < zMin + 4) continue;
    const xm = Math.max(...s2.map((p) => p[0])) - 10;
    for (let i = 0; i < 9; i++) {
      const x = -xm + ((i + 0.5) / 9) * 2 * xm + Math.sin(i * 12.9 + f.y) * 3;
      const z = zMin + 3 + Math.abs(Math.sin(i * 4.1 + f.y)) * Math.min(18, zMax - zMin - 3);
      const fg = figure(x, z, Math.PI, 0.97);
      fg.position.y = f.y;
    }
    // a strip of counters / seating blocks per floor
    for (let x = -xm + 6; x < xm - 6; x += 22) add(new THREE.BoxGeometry(9, 2.6, 3), clay, x, f.y + 1.3, zMin + 22);
  }

  // interior light (warm white) for the club
  const lights = [];
  for (const x of [-45, 0, 45]) {
    const l = new THREE.PointLight(new THREE.Color('#FFF4E6'), 0, 140, 1.6);
    l.position.set(x, ceilY - 5, 30);
    group.add(l);
    lights.push(l);
  }

  return { group, figures, lights, floorY, ceilY, wallZ, opening };
}
