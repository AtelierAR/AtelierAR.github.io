// Scene 6 (1:12-1:18) — every side. The four elevations (p30-33) draw as line art, stroked
// left to right, in a 2x2 grid; each then folds up into its face of the 3D building, which
// resolves as a single rotating model. Elevation planes are true scale (scale bars, 1.99 px/ft).
import * as THREE from 'three';
import { FT, PAL, COPY, WIDTH, HEIGHT } from '../data.js';
import { orbit, lerp, ALL_CATS } from './common.js';
import { smooth, smoother } from '../director.js';

const T0 = 72, T1 = 78;
// face: where each drawing folds to (feet). rotY turns the drawing to face outward.
const FACES = {
  n: { title: 'North', page: 30, rotY: Math.PI, pos: () => [0, 0, -700], cell: [490, 452] },
  e: { title: 'East', page: 31, rotY: Math.PI / 2, pos: () => [520, 0, 0], cell: [1430, 452] },
  s: { title: 'South', page: 32, rotY: 0, pos: () => [0, 0, 590], cell: [490, 742] },
  w: { title: 'West', page: 33, rotY: -Math.PI / 2, pos: () => [-560, 0, 0], cell: [1430, 742] },
};
const CELL_W = 860;

export async function build(ctx) {
  const { overlay: O, master: tl, director, engine, stadium, site, MAT, elevMeta } = ctx;
  const S = ctx.state;
  Object.assign(S, { elevDraw: 0, elevFold: 0, elevFade: 0 });
  const loader = new THREE.TextureLoader();
  const group = new THREE.Group();
  group.name = 'Elevations';
  group.visible = false;
  engine.scene.add(group);

  const planes = [];
  for (const key of ['n', 'e', 's', 'w']) {
    const m = elevMeta[key], F = FACES[key];
    const tex = loader.load(`${import.meta.env.BASE_URL}assets/elev_${key}.png`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const wFt = m.w / m.pxPerFt, hFt = m.h / m.pxPerFt;
    const groundFt = (m.h - m.groundY) / m.pxPerFt; // drawing ground line above the image bottom
    const centerFt = ((m.buildingX0 + m.buildingX1) / 2) / m.pxPerFt; // building centre from the left
    const geo = new THREE.PlaneGeometry(1, 1);
    // pivot = building centre on the ground line
    geo.translate(0.5 - centerFt / wFt, 0.5 - groundFt / hFt, 0);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: {
        map: { value: tex }, uProgress: { value: 0 }, uOpacity: { value: 1 },
        uColor: { value: new THREE.Color(PAL.edge) }, uGlow: { value: new THREE.Color(PAL.lineGreen) },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float uProgress, uOpacity; uniform vec3 uColor, uGlow; varying vec2 vUv;
        void main(){
          float a = texture2D(map, vUv).a;
          float rev = 1.0 - smoothstep(uProgress - 0.004, uProgress, vUv.x);
          float pen = smoothstep(uProgress - 0.05, uProgress, vUv.x) * rev;
          vec3 col = mix(uColor, uGlow * 1.4, pen);
          gl_FragColor = vec4(col, a * rev * uOpacity);
          if (gl_FragColor.a < 0.01) discard;
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 10;
    mesh.frustumCulled = false;
    group.add(mesh);
    planes.push({ key, mesh, mat, wM: wFt * FT, hM: hFt * FT, F, i: planes.length, off: new THREE.Vector3(0.5 - centerFt / wFt, 0.5 - groundFt / hFt, 0) });
  }

  // captions for the grid
  const caps = planes.map(({ F }) => {
    const c = O.el('div', 'ov ecap', O.root, `${F.title} elevation<span>p${F.page}</span>`);
    c.style.left = F.cell[0] - CELL_W / 2 + 'px';
    c.style.top = F.cell[1] - 118 + 'px';
    return c;
  });
  const sec = O.el('div', 'ov sec', O.root, `${COPY.s6Title}<small>Building elevations · p30–33</small>`);

  // ---------------------------------------------------------------- timeline
  const flash = O.el('div', 'ov fade-white');
  flash.style.opacity = 0;
  tl.to(flash, { opacity: 1, duration: 0.3 }, T0 - 0.3);
  tl.to(flash, { opacity: 0, duration: 0.4 }, T0 + 0.05);
  tl.set(group, { visible: true }, T0);
  tl.set(group, { visible: false }, T1 + 0.2);
  tl.set(stadium, { visible: false }, T0);
  tl.set(stadium, { visible: true }, T0 + 2.6);
  tl.set(S, { paper: 1, trees: 0, mirror: 0, boardOn: 0, sunAz: 120, sunEl: 48, sunK: 1, envK: 1, crowd: 0 }, T0);
  for (const c of ALL_CATS) tl.set(MAT.state[c], { mix: 0, fade: 0 }, T0);
  tl.fromTo(S, { elevDraw: 0 }, { elevDraw: 1, duration: 2.2, ease: 'none', immediateRender: false }, T0 + 0.15);
  tl.fromTo(S, { elevFold: 0 }, { elevFold: 1, duration: 2.0, ease: 'none', immediateRender: false }, T0 + 2.6);
  for (const c of ALL_CATS) tl.to(MAT.state[c], { fade: 1, duration: 1.3, ease: 'power1.inOut' }, T0 + 2.9);
  tl.to(S, { elevFade: 1, duration: 0.8 }, T0 + 3.7);
  tl.to(S, { paper: 0, duration: 1.2 }, T0 + 4.3);
  // materials come back on as the model turns, setting up dusk
  for (const c of ALL_CATS) if (c !== 'clay') tl.to(MAT.state[c], { mix: 1, duration: 1.2, ease: 'power1.inOut' }, T0 + 4.6);
  tl.fromTo(caps, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.1 }, T0 + 0.2);
  tl.to(caps, { opacity: 0, duration: 0.4 }, T0 + 2.5);
  tl.fromTo(sec, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4 }, T0 + 0.2);
  tl.to(sec, { opacity: 0, duration: 0.4 }, T1 - 0.5);

  // ---------------------------------------------------------------- camera
  const camAt = (T) => {
    const k = smooth((T - (T0 + 2.4)) / (T1 - T0 - 2.4));
    return orbit(lerp(38, 118, k), lerp(560, 520, k), lerp(320, 210, k), [0, 20, 0], 34);
  };
  director.add(T0, T1, (u, T) => camAt(T), 's6');

  // ---------------------------------------------------------------- per frame: grid -> facade
  const cam = engine.camera;
  const gq = new THREE.Quaternion(), fq = new THREE.Quaternion();
  const gp = new THREE.Vector3(), fp = new THREE.Vector3();
  const gs = new THREE.Vector3(), fs = new THREE.Vector3();
  const ndc = new THREE.Vector3();
  ctx.onFrame((T, c) => {
    if (!group.visible) return;
    const D = 140; // grid sits 140 m in front of the camera
    const visH = 2 * D * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const kpx = visH / HEIGHT;
    for (const p of planes) {
      const { F, mesh, mat, wM, hM, i, off } = p;
      // stroke animation, staggered per drawing
      mat.uniforms.uProgress.value = THREE.MathUtils.clamp(S.elevDraw * 1.45 - i * 0.15, 0, 1.02);
      mat.uniforms.uOpacity.value = 1 - S.elevFade;
      // grid pose (camera space -> world)
      const sx = CELL_W * kpx / wM;
      ndc.set((F.cell[0] / WIDTH) * 2 - 1, -((F.cell[1] / HEIGHT) * 2 - 1), 0.5).unproject(cam);
      gp.copy(ndc).sub(cam.position).normalize();
      const dist = D / gp.dot(cam.getWorldDirection(new THREE.Vector3()));
      gp.multiplyScalar(dist).add(cam.position);
      gq.copy(cam.quaternion);
      gs.set(wM * sx, hM * sx, 1);
      // pivot so that the drawing centre lands on the cell centre
      gp.sub(off.clone().multiply(gs).applyQuaternion(gq));
      // facade pose
      const fpos = F.pos();
      fp.set(fpos[0] * FT, fpos[1] * FT, fpos[2] * FT);
      fq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), F.rotY);
      fs.set(wM, hM, 1);
      const f = smoother(S.elevFold * 1.3 - i * 0.1);
      mesh.position.lerpVectors(gp, fp, f);
      mesh.quaternion.slerpQuaternions(gq, fq, f);
      mesh.scale.lerpVectors(gs, fs, f);
    }
    void c;
  });
  void site;
}
