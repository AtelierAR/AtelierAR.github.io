// Scene 2 world: a midnight-green drafting field where the face is drawn from its numbers,
// extruded into the north volume, unfolded as a box net with its face areas, folded back,
// and joined by the south volume. Local volume frame → drafting world: (x, y, −z), so the
// field face looks at the camera (+Z).
import * as THREE from 'three';
import { COLORS } from '../data.js';
import { faceLayout } from '../geometry/face.js';
import { FACE_LOOPS, volumeVertices } from '../geometry/volume.js';
import { VOLUME_PARAMS } from '../geometry/volumeParams.js';
import { ledShared } from '../materials/led.js';

const toDraft = (p, off = 0) => new THREE.Vector3(p[0] + off, p[1], -p[2]);
const FRONT_OF = { bkw: 'bfw', bke: 'bfe', tkw: 'tfw', tke: 'tfe' };
// net hinges: face → [parent, edge]
const HINGES = {
  top: ['front', ['tfw', 'tfe']],
  bottom: ['front', ['bfw', 'bfe']],
  east: ['front', ['bfe', 'tfe']],
  west: ['front', ['bfw', 'tfw']],
  back: ['top', ['tkw', 'tke']],
};

function polyLine(points, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(points.length * 3), 3));
  const l = new THREE.Line(g, mat);
  l.userData.full = points;
  l.frustumCulled = false;
  return l;
}
// draw-on: show the first p (0..1) of the polyline's length
function drawOn(line, p) {
  const pts = line.userData.full;
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const target = lens[lens.length - 1] * Math.max(0, Math.min(1, p));
  const arr = line.geometry.attributes.position.array;
  let n = 0;
  for (let i = 0; i < pts.length; i++) {
    if (lens[i] <= target) {
      arr.set([pts[i].x, pts[i].y, pts[i].z], n * 3);
      n++;
    } else {
      const t = (target - lens[i - 1]) / (lens[i] - lens[i - 1]);
      const q = pts[i - 1].clone().lerp(pts[i], t);
      arr.set([q.x, q.y, q.z], n * 3);
      n++;
      break;
    }
  }
  line.geometry.setDrawRange(0, n);
  line.geometry.attributes.position.needsUpdate = true;
  line.visible = n > 1;
}

class DraftVolume {
  constructor(key, offsetX, lineMat, fillMat) {
    this.key = key;
    this.local = volumeVertices(VOLUME_PARAMS[key]);
    this.offsetX = offsetX;
    this.group = new THREE.Group();
    this.faces = {};
    this.pivots = {};
    const V = (n) => toDraft(this.local[n], offsetX);
    const centroid = Object.keys(this.local).reduce((s, n) => s.add(V(n)), new THREE.Vector3()).multiplyScalar(1 / 8);
    this.centroid = centroid;
    // outward normals of the final shape
    const normals = {};
    for (const [name, loop] of Object.entries(FACE_LOOPS)) {
      const p = loop.map(V);
      const c = p.reduce((s, q) => s.add(q.clone()), new THREE.Vector3()).multiplyScalar(0.25);
      const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0])).normalize();
      if (n.dot(c.clone().sub(centroid)) < 0) n.negate();
      normals[name] = n;
    }
    this.normals = normals;
    // pivots (hinged hierarchy) — front is the root
    const root = new THREE.Group();
    this.group.add(root);
    this.pivots.front = root;
    for (const name of ['top', 'bottom', 'east', 'west', 'back']) {
      const [parent, [e0, e1]] = HINGES[name];
      const P = V(e0), Q = V(e1);
      const axis = Q.clone().sub(P).normalize();
      const nF = normals[name], nP = normals[parent];
      const angle = Math.atan2(new THREE.Vector3().crossVectors(nF, nP).dot(axis), nF.dot(nP));
      const pivot = new THREE.Group();
      pivot.userData = { origin: P, axis, angle };
      this.pivots[name] = pivot;
    }
    // nest: back under top
    for (const name of ['top', 'bottom', 'east', 'west']) {
      const pv = this.pivots[name];
      pv.position.copy(pv.userData.origin);
      root.add(pv);
    }
    const back = this.pivots.back;
    back.position.copy(back.userData.origin.clone().sub(this.pivots.top.userData.origin));
    this.pivots.top.add(back);

    for (const [name, loop] of Object.entries(FACE_LOOPS)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const mesh = new THREE.Mesh(g, fillMat.clone());
      const edge = new THREE.LineLoop(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3)), lineMat);
      mesh.frustumCulled = edge.frustumCulled = false;
      const holder = new THREE.Group();
      holder.add(mesh, edge);
      const pivot = this.pivots[name];
      // world-space origin of this pivot (before rotations) so geometry is placed relative to it
      const originWorld = name === 'front' ? new THREE.Vector3() : this.pivots[name].userData.origin;
      holder.position.copy(originWorld.clone().negate());
      pivot.add(holder);
      this.faces[name] = { mesh, edge, loop, originWorld };
    }
  }

  // extrusion k (0..1: depth grows from the field face), unfold u (0..1)
  update(k, u) {
    const V = (n) => {
      const p = toDraft(this.local[n], this.offsetX);
      if (FRONT_OF[n]) return toDraft(this.local[FRONT_OF[n]], this.offsetX).lerp(p, k);
      return p;
    };
    for (const [name, f] of Object.entries(this.faces)) {
      const pts = f.loop.map(V);
      const a = f.mesh.geometry.attributes.position.array;
      const b = f.edge.geometry.attributes.position.array;
      pts.forEach((p, i) => {
        a.set([p.x, p.y, p.z], i * 3);
        b.set([p.x, p.y, p.z], i * 3);
      });
      f.mesh.geometry.attributes.position.needsUpdate = true;
      f.edge.geometry.attributes.position.needsUpdate = true;
      f.mesh.geometry.computeVertexNormals();
      f.mesh.visible = f.edge.visible = name === 'front' || k > 0.001;
    }
    for (const name of ['top', 'bottom', 'east', 'west', 'back']) {
      const pv = this.pivots[name];
      pv.quaternion.setFromAxisAngle(pv.userData.axis, pv.userData.angle * u);
    }
  }

  faceCenterWorld(name) {
    const f = this.faces[name];
    const pos = f.mesh.geometry.attributes.position;
    const c = new THREE.Vector3();
    for (let i = 0; i < 4; i++) c.add(new THREE.Vector3().fromBufferAttribute(pos, i));
    c.multiplyScalar(0.25);
    f.mesh.updateWorldMatrix(true, false);
    return c.applyMatrix4(f.mesh.matrixWorld);
  }

  vertexWorld(n) {
    return toDraft(this.local[n], this.offsetX);
  }
}

export class DraftingWorld {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.midnight).multiplyScalar(0.55);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2);
    dl.position.set(300, 500, 400);
    this.scene.add(dl);

    // drafting grid (10' minor / 50' major)
    const pos = [], posMaj = [];
    for (let x = -600; x <= 900; x += 10) (x % 50 ? pos : posMaj).push(x, -40, 0, x, 260, 0);
    for (let y = -40; y <= 260; y += 10) (y % 50 ? pos : posMaj).push(-600, y, 0, 900, y, 0);
    const mk = (p, o) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: o, depthWrite: false }));
    };
    this.grid = new THREE.Group();
    this.grid.add(mk(pos, 0.035), mk(posMaj, 0.07));
    this.grid.position.z = -260;
    this.scene.add(this.grid);

    // the field face, drawn from its numbers (on the plane z = 0.4, in front of the volume)
    const L = faceLayout();
    this.layout = L;
    this.white = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const rectPts = (r, z = 0.6) => [
      new THREE.Vector3(r.x0, r.y0, z), new THREE.Vector3(r.x1, r.y0, z), new THREE.Vector3(r.x1, r.y1, z), new THREE.Vector3(r.x0, r.y1, z), new THREE.Vector3(r.x0, r.y0, z),
    ];
    this.canvasLine = polyLine(rectPts(L.canvas), this.white);
    this.wingLLine = polyLine([new THREE.Vector3(L.canvas.x0, L.canvas.y1, 0.6), new THREE.Vector3(L.wingL.x0, L.wingL.y1, 0.6), new THREE.Vector3(L.wingL.x0, L.wingL.y0, 0.6), new THREE.Vector3(L.canvas.x0, L.canvas.y0, 0.6)], this.white);
    this.wingRLine = polyLine([new THREE.Vector3(L.canvas.x1, L.canvas.y1, 0.6), new THREE.Vector3(L.wingR.x1, L.wingR.y1, 0.6), new THREE.Vector3(L.wingR.x1, L.wingR.y0, 0.6), new THREE.Vector3(L.canvas.x1, L.canvas.y0, 0.6)], this.white);
    this.bandLine = polyLine([new THREE.Vector3(L.band.x0, L.band.y1, 0.6), new THREE.Vector3(L.band.x0, L.band.y0, 0.6), new THREE.Vector3(L.band.x1, L.band.y0, 0.6), new THREE.Vector3(L.band.x1, L.band.y1, 0.6)], this.white);
    this.faceLines = new THREE.Group();
    this.faceLines.add(this.canvasLine, this.wingLLine, this.wingRLine, this.bandLine);
    // the field face leans toward the field like the volume's front plane (p51 section)
    this.faceGroup = new THREE.Group();
    this.faceGroup.rotation.x = Math.atan(VOLUME_PARAMS.north.a);
    this.faceGroup.add(this.faceLines);
    this.scene.add(this.faceGroup);

    // fills: the canvas plays the content (traditional), wings/band show clear-LED bars
    const fillCanvas = new THREE.MeshBasicMaterial({ map: null, transparent: true, opacity: 0, color: new THREE.Color(1.2, 1.2, 1.2), depthWrite: false });
    this.canvasFill = new THREE.Mesh(new THREE.PlaneGeometry(L.canvas.x1 - L.canvas.x0, L.canvas.y1 - L.canvas.y0), fillCanvas);
    this.canvasFill.position.set(0, (L.canvas.y0 + L.canvas.y1) / 2, 0.3);
    const barTex = (() => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 4;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(65,182,175,0.0)';
      g.fillRect(0, 0, 64, 4);
      g.fillStyle = 'rgba(120,230,220,0.9)';
      g.fillRect(19, 0, 26, 4);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    })();
    const mkClear = (w, h) => {
      const t = barTex.clone();
      t.repeat.set(w / 2.5, 1);
      t.needsUpdate = true;
      return new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false });
    };
    this.wingLFill = new THREE.Mesh(new THREE.PlaneGeometry(25, L.wingL.y1 - L.wingL.y0), mkClear(25, 92.25));
    this.wingLFill.position.set((L.wingL.x0 + L.wingL.x1) / 2, (L.wingL.y0 + L.wingL.y1) / 2, 0.3);
    this.wingRFill = new THREE.Mesh(new THREE.PlaneGeometry(25, L.wingR.y1 - L.wingR.y0), mkClear(25, 92.25));
    this.wingRFill.position.set((L.wingR.x0 + L.wingR.x1) / 2, (L.wingR.y0 + L.wingR.y1) / 2, 0.3);
    this.bandFill = new THREE.Mesh(new THREE.PlaneGeometry(214, 17.25), mkClear(214, 17.25));
    this.bandFill.position.set(0, 17.25 / 2, 0.3);
    this.fills = [this.canvasFill, this.wingLFill, this.wingRFill, this.bandFill];
    this.faceGroup.add(...this.fills);

    // volumes
    const glassFill = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.glassTeal), transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
    this.edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#BFF5EF'), transparent: true, opacity: 1 });
    this.north = new DraftVolume('north', 0, this.edgeMat, glassFill);
    this.south = new DraftVolume('south', 330, this.edgeMat, glassFill);
    this.scene.add(this.north.group, this.south.group);
  }

  setContent(tex) {
    this.canvasFill.material.map = tex;
    this.canvasFill.material.needsUpdate = true;
  }

  // s: state.draft
  update(s) {
    drawOn(this.canvasLine, s.canvasLine);
    drawOn(this.wingLLine, s.wingLine);
    drawOn(this.wingRLine, s.wingLine);
    drawOn(this.bandLine, s.bandLine);
    this.white.opacity = s.faceLinesO;
    this.canvasFill.material.opacity = s.canvasFill;
    this.wingLFill.material.opacity = this.wingRFill.material.opacity = s.wingFill;
    this.bandFill.material.opacity = s.bandFill;
    for (const f of this.fills) f.visible = f.material.opacity > 0.001;
    this.faceLines.visible = s.faceLinesO > 0.001;
    this.north.group.visible = s.northO > 0.001;
    this.south.group.visible = s.southO > 0.001;
    this.north.update(s.northK, s.unfold);
    this.south.update(s.southK, 0);
    for (const v of [this.north, this.south])
      for (const f of Object.values(v.faces)) f.mesh.material.opacity = 0.42 * (v === this.north ? s.northO : s.southO);
    this.edgeMat.opacity = Math.max(s.northO, s.southO);
    this.grid.visible = s.gridO > 0.001;
    this.grid.children.forEach((c, i) => (c.material.opacity = (i ? 0.07 : 0.035) * s.gridO));
  }
}

export { ledShared };
