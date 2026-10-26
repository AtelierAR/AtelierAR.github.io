// Renderer, sky, lights, environment, post-processing and the real-time mirror camera.
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, DepthOfFieldEffect, NoiseEffect,
  ToneMappingEffect, ToneMappingMode, SMAAEffect, SMAAPreset, BlendFunction,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { PAL, WIDTH, HEIGHT } from './data.js';

const C = (h) => new THREE.Color(h);

export function createEngine(canvas, { pixelRatio = 1, record = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, stencil: false, depth: true, powerPreference: 'high-performance',
    preserveDrawingBuffer: record,
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, WIDTH / HEIGHT, 1, 9000);
  camera.position.set(400, 250, -500);
  camera.lookAt(0, 30, 0);

  // ---- sky dome (lavender-grey deck sky; warm restrained dusk)
  const skyU = {
    top: { value: C(PAL.skyTop) }, horizon: { value: C(PAL.skyHorizon) },
    duskTop: { value: C(PAL.duskTop) }, duskMid: { value: C(PAL.duskMid) }, duskHorizon: { value: C(PAL.duskHorizon) },
    ground: { value: C('#E9EAEE') }, uDusk: { value: 0 }, uBright: { value: 1 }, uPaper: { value: 0 },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(8000, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
      fragmentShader: `uniform vec3 top, horizon, duskTop, duskMid, duskHorizon, ground; uniform float uDusk, uBright, uPaper; varying vec3 vDir;
        void main(){ float h = normalize(vDir).y;
          vec3 day = mix(horizon, top, smoothstep(0.0, 0.5, h));
          vec3 dusk = mix(duskHorizon, duskMid, smoothstep(0.0, 0.16, h)); dusk = mix(dusk, duskTop, smoothstep(0.16, 0.65, h));
          vec3 c = mix(day, dusk, uDusk);
          vec3 g = mix(ground, ground*0.35 + duskHorizon*0.12, uDusk);
          c = mix(c, g, smoothstep(0.0, -0.04, h));
          c = mix(c, vec3(0.86, 0.87, 0.89), uPaper);
          gl_FragColor = vec4(c*uBright, 1.0); }`,
    }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  sky.name = 'sky';
  scene.add(sky);
  scene.fog = new THREE.Fog(C(PAL.skyHorizon), 900, 5200);

  // ---- lights
  const hemi = new THREE.HemisphereLight(C('#E4E8F0'), C('#D6D3CE'), 0.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(C('#FFF5E8'), 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera;
  sc.left = -230; sc.right = 230; sc.top = 230; sc.bottom = -230; sc.near = 10; sc.far = 1600;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(C('#FFC58F'), 0);
  scene.add(rim, rim.target);
  const boardLight = new THREE.PointLight(C('#1B6F74'), 0, 260, 1.6);
  scene.add(boardLight);
  const plazaGlow = new THREE.PointLight(C('#FFB878'), 0, 320, 1.5);
  scene.add(plazaGlow);
  const lights = { hemi, sun, rim, boardLight, plazaGlow };

  // sun from azimuth (deg, 0 = north/-Z, 90 = east/+X) and elevation (deg)
  const sunState = { az: 205, el: 48 };
  function placeSun(focus = new THREE.Vector3()) {
    const a = THREE.MathUtils.degToRad(sunState.az), e = THREE.MathUtils.degToRad(sunState.el);
    const d = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
    sun.position.copy(focus).addScaledVector(d, 700);
    sun.target.position.copy(focus);
    rim.position.copy(focus).addScaledVector(new THREE.Vector3(-d.x, 0.35, -d.z), 700);
    rim.target.position.copy(focus);
    return d;
  }

  // ---- environment (PMREM of the sky + ground), regenerated when dusk changes
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = sky.clone();
  envSky.material = sky.material; // shares uniforms
  envScene.add(envSky);
  let envRT = null, envDusk = -1;
  function updateEnv(force = false) {
    const d = skyU.uDusk.value;
    if (!force && Math.abs(d - envDusk) < 0.04) return;
    envDusk = d;
    const rt = pmrem.fromScene(envScene, 0, 1, 20000);
    if (envRT) envRT.dispose();
    envRT = rt;
    scene.environment = rt.texture;
  }

  // ---- real-time mirror for the 316 stainless soffit: a cube camera placed at the
  // camera position mirrored through the focus wing's underside plane (exact planar
  // reflection for that wing); wings are hidden while it renders.
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cubeCam = new THREE.CubeCamera(2, 9000, cubeRT);
  scene.add(cubeCam);

  // ---- post
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const ao = new N8AOPostPass(scene, camera, WIDTH, HEIGHT);
  ao.configuration.aoRadius = 6;
  ao.configuration.distanceFalloff = 1.2;
  ao.configuration.intensity = 2.2;
  ao.configuration.halfRes = true;
  ao.configuration.gammaCorrection = false;
  ao.configuration.aoSamples = 10;
  ao.configuration.denoiseSamples = 4;
  ao.configuration.denoiseRadius = 8;
  composer.addPass(ao);
  // Middle pass variants so the expensive effects only run where a shot needs them:
  // plain (tone only) / dof / dof + bloom. Exactly one is enabled per frame (setPost).
  const mkDof = () => {
    const d = new DepthOfFieldEffect(camera, { worldFocusDistance: 300, worldFocusRange: 260, bokehScale: 1.2, resolutionScale: 0.4 });
    d.target = new THREE.Vector3();
    return d;
  };
  const tone = () => new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
  const dof = mkDof(), dof2 = mkDof();
  const bloom = new BloomEffect({ luminanceThreshold: 1.05, luminanceSmoothing: 0.25, mipmapBlur: true, intensity: 0, radius: 0.7, resolutionScale: 0.5 });
  const passPlain = new EffectPass(camera, tone());
  const passDof = new EffectPass(camera, dof, tone());
  const passBloom = new EffectPass(camera, dof2, bloom, tone());
  composer.addPass(passPlain);
  composer.addPass(passDof);
  composer.addPass(passBloom);
  const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
  const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
  noise.blendMode.opacity.value = 0.03; // film grain 3 %
  composer.addPass(new EffectPass(camera, smaa, noise));
  function setPost({ dofOn = false, bloomOn = false, target = null, bokeh = 1.2 }) {
    passPlain.enabled = !dofOn && !bloomOn;
    passDof.enabled = dofOn && !bloomOn;
    passBloom.enabled = bloomOn;
    for (const d of [dof, dof2]) { if (target) d.target.copy(target); d.bokehScale = bokeh; }
  }
  setPost({});
  const exposure = { value: 1 };

  return {
    renderer, scene, camera, sky, skyU, lights, sunState, placeSun, updateEnv, cubeRT, cubeCam,
    composer, renderPass, effects: { ao, dof, dof2, bloom, smaa, noise }, setPost, exposure,
    render(dt = 1 / 60) { composer.render(dt); },
  };
}
