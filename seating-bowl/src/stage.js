import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, SelectiveBloomEffect, DepthOfFieldEffect, SMAAEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { C } from './palette.js';

export const W = 1920, H = 1080;

// Renderer, post stack (N8AO -> selective bloom on LED ribbons -> subtle DOF
// -> SMAA), camera rig and lights. The stage is a fixed 1920x1080 frame,
// letterboxed to the window; ?record=1 renders at devicePixelRatio (2 for 4K).
export function createStage(container, { dpr = window.devicePixelRatio || 1 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true, stencil: false });
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.domElement.style.width = `${W}px`;
  renderer.domElement.style.height = `${H}px`;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.paper);

  const camera = new THREE.PerspectiveCamera(30, W / H, 4, 30000);
  const rig = { px: 0, py: 2400, pz: 0.01, tx: 0, ty: 0, tz: 0, fov: 20, upMix: 0, roll: 0, shiftX: 0 };

  // lights
  const hemi = new THREE.HemisphereLight('#FFFFFF', '#AEB6B8', 1.45);
  const sun = new THREE.DirectionalLight('#FFFFFF', 2.1);
  sun.position.set(380, 760, 520);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -560, right: 560, top: 560, bottom: -560, near: 50, far: 2200 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(hemi, sun, sun.target);

  // sky dome for the seat views (p55-59 blue-grey sky)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(9000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uTop: { value: new THREE.Color('#9FAAC0') }, uHor: { value: new THREE.Color('#E4E7EC') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uTop, uHor; varying vec3 vP;
        void main(){ float h = clamp(normalize(vP).y * 2.2, 0.0, 1.0); gl_FragColor = vec4(mix(uHor, uTop, pow(h, 0.8)), 1.0);
        #include <colorspace_fragment>
        }`,
    }),
  );
  sky.visible = false;
  scene.add(sky);

  // post
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 4 });
  composer.addPass(new RenderPass(scene, camera));
  const ao = new N8AOPostPass(scene, camera, W * dpr, H * dpr);
  Object.assign(ao.configuration, {
    aoRadius: 14, distanceFalloff: 3, intensity: 2.4, color: new THREE.Color('#1E2A2D'),
    aoSamples: 16, denoiseSamples: 8, denoiseRadius: 10, halfRes: false, gammaCorrection: false,
  });
  ao.setQualityMode('High');
  composer.addPass(ao);
  const bloom = new SelectiveBloomEffect(scene, camera, {
    intensity: 2.2, luminanceThreshold: 0, luminanceSmoothing: 0.2, mipmapBlur: true, radius: 0.55,
  });
  bloom.ignoreBackground = true;
  const dof = new DepthOfFieldEffect(camera, { focusDistance: 400, focusRange: 260, bokehScale: 0, resolutionScale: 0.5 });
  dof.target = new THREE.Vector3();
  const smaa = new SMAAEffect();
  const fxPass = new EffectPass(camera, bloom, dof);
  composer.addPass(fxPass);
  composer.addPass(new EffectPass(camera, smaa));

  const tmpUp = new THREE.Vector3();
  function applyRig() {
    camera.position.set(rig.px, rig.py, rig.pz);
    // plan views use "east up" (p37 orientation); perspective views use y up
    tmpUp.set(0, rig.upMix, -(1 - rig.upMix)).normalize();
    camera.up.copy(tmpUp);
    camera.lookAt(rig.tx, rig.ty, rig.tz);
    if (rig.roll) camera.rotateZ(rig.roll);
    // shiftX: slide the composition sideways (px) to make room for insets
    if (rig.shiftX) camera.setViewOffset(W, H, rig.shiftX, 0, W, H);
    else if (camera.view && camera.view.enabled) camera.clearViewOffset();
    camera.fov = rig.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    dof.target.set(rig.tx, rig.ty, rig.tz);
  }

  function render({ post = true } = {}) {
    if (post) composer.render();
    else renderer.render(scene, camera);
  }

  // project a world point to stage pixels
  const v = new THREE.Vector3();
  function project(x, y, z, cam = camera) {
    v.set(x, y, z).project(cam);
    return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z];
  }

  return { renderer, scene, camera, rig, applyRig, render, composer, ao, bloom, dof, fxPass, sky, sun, hemi, project, dpr };
}
