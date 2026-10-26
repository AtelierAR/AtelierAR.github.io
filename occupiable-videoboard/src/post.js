// Post stack: N8AO (daylight scenes), bloom gated to LED emission, depth of field and
// chromatic aberration (≤ 0.6 px, pass-through only), AgX tone mapping.
// A dual render pass draws the Scene 6 split (outside | inside) into one buffer.
import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  Pass,
  BloomEffect,
  DepthOfFieldEffect,
  ChromaticAberrationEffect,
  ToneMappingEffect,
  ToneMappingMode,
  SMAAEffect,
  VignetteEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

class DualRenderPass extends Pass {
  constructor(scene, camA, camB) {
    super('DualRenderPass', scene, camA);
    this.needsSwap = false;
    this.scene = scene;
    this.camA = camA;
    this.camB = camB;
    this.split = 1; // fraction of the width given to camera A
    this.black = new THREE.Color(0, 0, 0);
  }
  render(renderer, inputBuffer) {
    const rt = this.renderToScreen ? null : inputBuffer;
    const w = rt ? rt.width : renderer.domElement.width;
    const h = rt ? rt.height : renderer.domElement.height;
    // EffectComposer disables renderer.autoClear, so clear colour + depth explicitly
    const bg = this.scene.background;
    renderer.setClearColor(bg && bg.isColor ? bg : this.black, 1);
    renderer.setRenderTarget(rt);
    if (this.split >= 0.999 || !this.camB) {
      renderer.clear(true, true, true);
      renderer.render(this.scene, this.camA);
      return;
    }
    renderer.clear(true, true, true);
    const xs = Math.round(w * this.split);
    const draw = (cam, x, width) => {
      if (width < 1) return;
      if (rt) {
        rt.viewport.set(x, 0, width, h);
        rt.scissor.set(x, 0, width, h);
        rt.scissorTest = true;
        renderer.setRenderTarget(rt);
      }
      renderer.render(this.scene, cam);
    };
    draw(this.camA, 0, xs);
    draw(this.camB, xs, w - xs);
    if (rt) {
      rt.viewport.set(0, 0, w, h);
      rt.scissor.set(0, 0, w, h);
      rt.scissorTest = false;
      renderer.setRenderTarget(rt);
    }
  }
}

export class Post {
  constructor(renderer, scene, camera, cameraB, { quality = 'high', width = 1920, height = 1080 } = {}) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: quality === 'high' ? 4 : 0,
    });
    this.renderPass = new DualRenderPass(scene, camera, cameraB);
    this.composer.addPass(this.renderPass);

    this.ao = new N8AOPostPass(scene, camera, width, height);
    this.ao.configuration.aoRadius = 12;
    this.ao.configuration.distanceFalloff = 2;
    this.ao.configuration.intensity = 2.2;
    this.ao.configuration.aoSamples = quality === 'high' ? 16 : 8;
    this.ao.configuration.denoiseSamples = quality === 'high' ? 8 : 4;
    this.ao.configuration.halfRes = quality !== 'high';
    this.ao.configuration.gammaCorrection = false;
    this.composer.addPass(this.ao);

    this.bloom = new BloomEffect({
      mipmapBlur: true,
      luminanceThreshold: 1.05, // only LED emission is authored above 1.0 → bloom is LED-only
      luminanceSmoothing: 0.25,
      intensity: 0.9,
      radius: 0.62,
    });
    this.dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 60, worldFocusRange: 40, bokehScale: 0, resolutionScale: 0.5 });
    this.ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0, 0), radialModulation: true, modulationOffset: 0.2 });
    this.tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
    this.vignette = new VignetteEffect({ darkness: 0.28, offset: 0.38 });
    this.smaa = new SMAAEffect();
    // convolution effects (DOF, CA, SMAA) cannot share a pass
    this.passA = new EffectPass(camera, this.bloom);
    this.passDOF = new EffectPass(camera, this.dof); // only enabled during the pass-through
    this.passCA = new EffectPass(camera, this.ca);
    this.passB = new EffectPass(camera, this.tone, this.vignette, this.smaa);
    this.composer.addPass(this.passDOF);
    this.composer.addPass(this.passA);
    this.composer.addPass(this.passCA);
    this.composer.addPass(this.passB);
    this.width = width;
    this.height = height;
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
    this.composer.setSize(w, h, false);
  }

  // chromatic aberration in pixels (clamped to 0.6 px)
  setCA(px) {
    const p = Math.min(0.6, Math.max(0, px));
    this.passCA.enabled = p > 0.001;
    this.ca.offset.set(p / this.width, (p / this.height) * 0.5);
  }

  setDOF(focus, range, bokeh) {
    this.dof.cocMaterial.worldFocusDistance = focus;
    this.dof.cocMaterial.worldFocusRange = range;
    this.dof.bokehScale = bokeh;
    this.passDOF.enabled = bokeh > 0.01;
  }

  setCameras(a, b) {
    this.renderPass.camA = a;
    this.renderPass.camB = b;
    this.ao.camera = a;
    this.passA.mainCamera = a;
    this.passB.mainCamera = a;
    this.passCA.mainCamera = a;
    this.passDOF.mainCamera = a;
    this.dof.mainCamera = a;
  }

  render(dt = 0) {
    this.composer.render(dt);
  }
}
