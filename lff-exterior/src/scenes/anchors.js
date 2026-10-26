// Leader-line anchors fitted to the deck: for every label on p26-29 we know its x on the
// page (PDF text layer). From the matched arrival camera we render a material-ID pass, look
// straight down (sky labels) or up (ground labels) from that x for the first pixel of the
// labelled material, and raycast that pixel to get the 3D anchor. Leaders therefore come out
// vertical and land on the right material, as on the page. Falls back to data `at`.
import * as THREE from 'three';
import { FT, WIDTH, HEIGHT } from '../data.js';

export const LABEL_CAT = {
  'Reflective Soffit': ['reflective'], Soffit: ['soffit'], 'Video Board': ['board'], 'Metal Panel': ['metal'],
  'Mesh/Grate': ['mesh'], Glazing: ['glazing'], Masonry: ['masonry'], Fins: ['fins'],
};
const IDS = ['clay', 'masonry', 'fins', 'glazing', 'metal', 'mesh', 'soffit', 'reflective', 'roof', 'pv', 'board', 'steel'];

export function fitAnchors(ctx, arrival, pose, { scale = 0.25 } = {}) {
  const { engine, stadium, site } = ctx;
  const { renderer, scene } = engine;
  const W = Math.round(WIDTH * scale), H = Math.round(HEIGHT * scale);
  const cam = new THREE.PerspectiveCamera(pose.fov, WIDTH / HEIGHT, 1, 9000);
  cam.position.copy(pose.pos);
  cam.lookAt(pose.target);
  if (pose.shiftX || pose.shiftY) cam.setViewOffset(WIDTH, HEIGHT, -(pose.shiftX || 0) * WIDTH, -(pose.shiftY || 0) * HEIGHT, WIDTH, HEIGHT);
  cam.updateMatrixWorld();

  // ID materials (one flat colour per category) — swap, render, restore
  const idMat = IDS.map((c, i) => new THREE.MeshBasicMaterial({ color: new THREE.Color((i + 1) / 255, 0, 0), side: THREE.DoubleSide }));
  const swapped = [], hidden = [];
  scene.traverse((o) => {
    if (o.isMesh && o.userData.cat && !o.isInstancedMesh) { swapped.push([o, o.material]); o.material = idMat[IDS.indexOf(o.userData.cat)]; }
    else if ((o.isLineSegments || o.isInstancedMesh || o === engine.sky || o === site.ground || o === site.plan) && o.visible) { hidden.push(o); o.visible = false; }
  });
  const rt = new THREE.WebGLRenderTarget(W, H);
  const bg = scene.background, fog = scene.fog;
  scene.background = new THREE.Color(0, 0, 0); scene.fog = null;
  const prevTarget = renderer.getRenderTarget();
  const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(rt);
  renderer.render(scene, cam);
  const px = new Uint8Array(W * H * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
  renderer.setRenderTarget(prevTarget);
  renderer.shadowMap.enabled = sm;
  scene.background = bg; scene.fog = fog;
  for (const [o, m] of swapped) o.material = m;
  for (const o of hidden) o.visible = true;
  rt.dispose();
  idMat.forEach((m) => m.dispose());

  const catAt = (x, y) => { // y from top
    const i = ((H - 1 - y) * W + x) * 4;
    const id = px[i] - 1;
    return id >= 0 && id < IDS.length ? IDS[id] : null;
  };
  const meshesOf = (cats) => { const out = []; stadium.traverse((o) => { if (o.isMesh && cats.includes(o.userData.cat)) out.push(o); }); return out; };
  const ray = new THREE.Raycaster();
  const results = [];
  for (const L of arrival.labels) {
    const cats = LABEL_CAT[L.text];
    let hit = null;
    if (cats && L.x !== undefined) {
      const x0 = Math.round(L.x * scale);
      // search the label's column first, then fan out sideways
      outer: for (let d = 0; d <= W; d++) for (const s of d ? [-1, 1] : [1]) {
        const x = x0 + s * d;
        if (x < 1 || x >= W - 1) { if (x0 - d < 1 && x0 + d >= W - 1) break outer; continue; }
        const ys = L.band === 'sky' ? [...Array(H).keys()] : [...Array(H).keys()].reverse();
        for (const y of ys) {
          const c = catAt(x, y);
          if (!c) continue;
          if (!cats.includes(c)) continue; // the leader passes over other elements, as on the page
          // step a few pixels inside the element so the leader ends on it, not its edge
          const yIn = Math.min(H - 1, Math.max(0, y + (L.band === 'sky' ? 3 : -3)));
          const yy = catAt(x, yIn) === c ? yIn : y;
          ray.setFromCamera(new THREE.Vector2(((x + 0.5) / W) * 2 - 1, -(((yy + 0.5) / H) * 2 - 1)), cam);
          const h = ray.intersectObjects(meshesOf(cats), false)[0];
          if (h) { hit = h.point.clone(); break outer; }
        }
      }
    }
    results.push({ ...L, anchor: hit || new THREE.Vector3(...L.at).multiplyScalar(FT), fitted: !!hit });
  }
  return results;
}
