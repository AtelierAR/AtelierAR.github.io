import * as THREE from 'three';
import { FONT } from '../palette.js';
import { ringVerts, RING } from './rings.js';
import { CUT } from './materials.js';

// The field is 360 ft x 160 ft including end zones. No official marks are
// supplied in reference/brand/, so the end zones carry the word EAGLES in a
// neutral heavy grotesk and the midfield logo position is left empty.
export const LOGO_SLOT = null; // drop an approved midfield mark URL here when supplied

const W = 2304, H = 1024; // 6.4 px/ft

function fieldCanvas(mode) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const sx = W / 360, sz = H / 160;
  const plan = mode === 'plan';
  // turf
  for (let i = 0; i < 20; i++) {
    g.fillStyle = plan ? (i % 2 ? '#3E9C62' : '#47A86B') : (i % 2 ? '#EEF0F1' : '#F2F3F4');
    g.fillRect((30 + i * 15) * sx, 0, 15 * sx + 1, H);
  }
  // end zones
  const ez = plan ? '#123C40' : '#E9ECEE';
  g.fillStyle = ez;
  g.fillRect(0, 0, 30 * sx, H);
  g.fillRect(330 * sx, 0, 30 * sx, H);
  // lines
  g.strokeStyle = plan ? 'rgba(255,255,255,0.92)' : 'rgba(150,160,166,0.55)';
  g.lineWidth = 2.2;
  for (let yd = 0; yd <= 100; yd += 5) {
    const x = (30 + yd * 3) * sx;
    g.beginPath(); g.moveTo(x, 6 * sz); g.lineTo(x, H - 6 * sz); g.stroke();
  }
  g.lineWidth = 6;
  g.strokeRect(3, 3, W - 6, H - 6);
  // hash marks
  g.lineWidth = 2;
  for (let yd = 1; yd < 100; yd++) {
    const x = (30 + yd * 3) * sx;
    for (const z of [6, 60.75, 99.25, 154]) {
      g.beginPath(); g.moveTo(x, (z - 1) * sz); g.lineTo(x, (z + 1) * sz); g.stroke();
    }
  }
  // numbers
  g.fillStyle = plan ? 'rgba(255,255,255,0.9)' : 'rgba(150,160,166,0.6)';
  g.font = `700 ${Math.round(6 * sz)}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let yd = 10; yd <= 90; yd += 10) {
    const n = String(yd > 50 ? 100 - yd : yd);
    const x = (30 + yd * 3) * sx;
    g.save(); g.translate(x, 30 * sz); g.rotate(Math.PI); g.fillText(n, 0, 0); g.restore();
    g.fillText(n, x, H - 30 * sz);
  }
  // EAGLES — reads bottom-to-top in the north end zone, top-to-bottom in the south (as p37)
  g.fillStyle = plan ? '#FFFFFF' : 'rgba(170,178,183,0.9)';
  g.font = `900 ${Math.round(17 * sz)}px ${FONT}`;
  for (const [x, rot] of [[15 * sx, -Math.PI / 2], [345 * sx, Math.PI / 2]]) {
    g.save(); g.translate(x, H / 2); g.rotate(rot);
    if (g.letterSpacing !== undefined) g.letterSpacing = `${Math.round(1.2 * sz)}px`;
    g.fillText('EAGLES', 0, 2);
    g.restore();
  }
  // LOGO_SLOT: intentionally blank.
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function goalpost() {
  const grp = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#F4F5F6', roughness: 0.6, clippingPlanes: [CUT] });
  const cyl = (r, h) => new THREE.CylinderGeometry(r, r, h, 10);
  const base = new THREE.Mesh(cyl(0.6, 10), m); base.position.set(-6, 5, 0); grp.add(base);
  const neck = new THREE.Mesh(cyl(0.45, 6), m); neck.rotation.z = Math.PI / 2; neck.position.set(-3, 10, 0); grp.add(neck);
  const bar = new THREE.Mesh(cyl(0.35, 18.5), m); bar.rotation.x = Math.PI / 2; bar.position.set(0, 10, 0); grp.add(bar);
  for (const z of [-9.25, 9.25]) { const u = new THREE.Mesh(cyl(0.3, 35), m); u.position.set(0, 27.5, z); grp.add(u); }
  grp.traverse((o) => { o.castShadow = true; });
  return grp;
}

export function buildField() {
  const group = new THREE.Group();
  group.name = 'field';
  const geo = new THREE.PlaneGeometry(360, 160);
  geo.rotateX(-Math.PI / 2);
  const clayMat = new THREE.MeshStandardMaterial({ map: fieldCanvas('clay'), roughness: 0.95, clippingPlanes: [CUT] });
  const planMat = new THREE.MeshBasicMaterial({ map: fieldCanvas('plan'), transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  const clay = new THREE.Mesh(geo, clayMat); clay.receiveShadow = true; clay.position.y = 0.05;
  const plan = new THREE.Mesh(geo, planMat); plan.position.y = 0.12; plan.renderOrder = 30;
  group.add(clay, plan);

  // apron to the existing field wall (p37 light surround)
  const shape = new THREE.Shape(ringVerts(RING('LB_in')).map(([x, z]) => new THREE.Vector2(x, z)));
  const ap = new THREE.ShapeGeometry(shape);
  ap.rotateX(Math.PI / 2);
  const apronMat = new THREE.MeshStandardMaterial({ color: '#E7E9E8', roughness: 1, side: THREE.DoubleSide, clippingPlanes: [CUT] });
  const apron = new THREE.Mesh(ap, apronMat);
  apron.receiveShadow = true;
  group.add(apron);

  const posts = [goalpost(), goalpost()];
  posts[0].position.set(-180, 0, 0); posts[0].rotation.y = 0;
  posts[1].position.set(180, 0, 0); posts[1].rotation.y = Math.PI;
  group.add(...posts);

  return { group, clay, clayMat, plan, apron, posts, planMat, apronMat };
}
