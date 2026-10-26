// Category materials. Every kit mesh belongs to a category; each category owns one or more
// PBR materials that share two uniforms:
//   uMix  0 = white clay (deck render style)  ->  1 = full PBR material
//   uFade 1 = normal                          ->  0.4 = dimmed toward the pale wash
// Scenes tween MAT.state[cat].mix / .fade; MAT.apply() pushes them into the shaders.
import * as THREE from 'three';
import { PAL, SWATCH } from './data.js';
import * as T from './textures.js';

export const CATS = ['clay', 'masonry', 'fins', 'glazing', 'metal', 'mesh', 'soffit', 'reflective', 'roof', 'pv', 'board', 'steel'];

const lin = (c) => new THREE.Color(c); // THREE.Color is linear internally (ColorManagement on)

const shared = {
  uWash: { value: lin('#E9EBEF').multiplyScalar(1.0) },
  uClay: { value: lin(PAL.clay) },
};

// Canopy build-up (scene 4): fragments farther than uRevealR from uRevealO are discarded,
// PV panels scale in behind a ripple front at distance uRipple (metres) from uRippleO.
export const REVEAL = {
  uRevealO: { value: new THREE.Vector3() },
  uRevealR: { value: 1e6 },
  uRipple: { value: 1e6 },
  uRippleW: { value: 18 },
  uFlash: { value: new THREE.Color(PAL.lineGreen) },
};

export const MAT = {
  state: {},
  uniforms: {},
  materials: {}, // key -> material
  byCat: {}, // cat -> [materials]
  edges: {}, // cat -> LineBasicMaterial
  tex: {},
  targets: {}, // material uuid -> {normalScale, emissiveIntensity, envMapIntensity}
  global: { edge: 1, dusk: 0, glow: 0, boardGlow: 0, washK: 1 },
};

for (const c of CATS) {
  MAT.state[c] = { mix: 0, fade: 1 };
  MAT.uniforms[c] = { uMix: { value: 0 }, uFade: { value: 1 } };
  MAT.byCat[c] = [];
  MAT.edges[c] = new THREE.LineBasicMaterial({ color: PAL.edge, transparent: true, opacity: PAL.edgeOpacity, depthWrite: false });
}

function patch(mat, cat, { clayRough = 0.9, clayColor = null, reveal = false, ripple = false } = {}) {
  const U = MAT.uniforms[cat];
  const clay = clayColor ? { value: lin(clayColor) } : shared.uClay;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uMix = U.uMix;
    sh.uniforms.uFade = U.uFade;
    sh.uniforms.uClay = clay;
    sh.uniforms.uWash = shared.uWash;
    Object.assign(sh.uniforms, REVEAL);
    if (reveal || ripple) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
varying vec3 vLffW;
varying float vLffFlash;
uniform vec3 uRevealO;
uniform float uRipple;
uniform float uRippleW;
${ripple ? 'attribute float aDist;' : ''}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vLffFlash = 0.0;
${ripple ? `{
  float r = clamp((uRipple - aDist) / uRippleW, 0.0, 1.0);
  float s = r * r * (3.0 - 2.0 * r);
  transformed *= s;
  vLffFlash = (r > 0.0) ? (1.0 - r) : 0.0;
}` : ''}`)
        .replace('#include <project_vertex>', `#include <project_vertex>
{
  vec4 lffW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    lffW = instanceMatrix * lffW;
  #endif
  vLffW = (modelMatrix * lffW).xyz;
}`);
    }
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uMix;\nuniform float uFade;\nuniform vec3 uClay;\nuniform vec3 uWash;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.rgb = mix(uClay, diffuseColor.rgb, uMix);')
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n\troughnessFactor = mix(${clayRough.toFixed(3)}, roughnessFactor, uMix);`)
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n\tmetalnessFactor = mix(0.0, metalnessFactor, uMix);')
      .replace('#include <dithering_fragment>', '\tgl_FragColor.rgb = mix(uWash, gl_FragColor.rgb, uFade);\n#include <dithering_fragment>');
    if (reveal || ripple) {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vLffW;
varying float vLffFlash;
uniform vec3 uRevealO;
uniform float uRevealR;
uniform vec3 uFlash;`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
${reveal ? 'if (distance(vLffW, uRevealO) > uRevealR) discard;' : ''}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += uFlash * vLffFlash * 2.5;`);
    }
  };
  mat.customProgramCacheKey = () => `lff-${cat}-${clayRough}-${reveal}-${ripple}`;
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  MAT.byCat[cat].push(mat);
  MAT.targets[mat.uuid] = {
    normalScale: mat.normalMap ? mat.normalScale.x : 0,
    emissiveIntensity: mat.emissiveIntensity,
    envMapIntensity: mat.envMapIntensity,
  };
  return mat;
}

export function initMaterials() {
  const tx = MAT.tex;
  tx.brick = T.brick();
  tx.metal = T.metalPanel();
  tx.fins = T.finSkin();
  tx.cw = T.curtainWall();
  tx.mesh = T.meshScreen();
  tx.soffit = T.soffitPlanks();
  tx.mirror = T.mirrorJoints();
  tx.pv = T.pvPanel();
  tx.pvc = T.pvc();
  tx.seating = T.seating();

  const M = MAT.materials;
  M.clay = patch(new THREE.MeshStandardMaterial({ color: PAL.clay, roughness: 0.9 }), 'clay');
  M.seating = patch(new THREE.MeshStandardMaterial({ map: tx.seating.map, roughness: 0.9 }), 'clay', { clayColor: '#E7E9EC' });
  M.dark = patch(new THREE.MeshStandardMaterial({ color: '#2a2c2e', roughness: 0.8 }), 'mesh', { clayColor: '#E4E6EA' }); // volume behind mesh

  M.masonry = patch(new THREE.MeshStandardMaterial({
    map: tx.brick.map, normalMap: tx.brick.normalMap, roughnessMap: tx.brick.roughnessMap, roughness: 1, metalness: 0,
    normalScale: new THREE.Vector2(1.2, 1.2),
  }), 'masonry');

  M.metal = patch(new THREE.MeshStandardMaterial({
    map: tx.metal.map, normalMap: tx.metal.normalMap, roughness: 0.42, metalness: 0.15, envMapIntensity: 1.0,
    normalScale: new THREE.Vector2(1, 1),
  }), 'metal');

  M.fins = patch(new THREE.MeshStandardMaterial({
    map: tx.fins.map, normalMap: tx.fins.normalMap, roughness: 0.36, metalness: 0.18, envMapIntensity: 1.0,
  }), 'fins');

  M.glass = patch(new THREE.MeshStandardMaterial({
    map: tx.cw.map, roughnessMap: tx.cw.roughnessMap, roughness: 1, metalness: 0.85, envMapIntensity: 1.6,
    emissive: new THREE.Color('#ffb46b'), emissiveMap: tx.cw.emissiveMap, emissiveIntensity: 0,
  }), 'glazing', { clayRough: 0.6, clayColor: '#E2E5E9' });
  M.frame = patch(new THREE.MeshStandardMaterial({ color: '#3a4043', roughness: 0.4, metalness: 0.35 }), 'glazing');

  M.mesh = patch(new THREE.MeshStandardMaterial({
    map: tx.mesh.map, alphaMap: tx.mesh.alphaMap, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.15,
  }), 'mesh');

  M.soffit = patch(new THREE.MeshStandardMaterial({
    map: tx.soffit.map, roughnessMap: tx.soffit.roughnessMap, roughness: 1, metalness: 1, envMapIntensity: 1,
  }), 'soffit');
  M.wingSoffit = patch(new THREE.MeshStandardMaterial({
    map: tx.soffit.map, roughnessMap: tx.soffit.roughnessMap, roughness: 1, metalness: 1, envMapIntensity: 1,
  }), 'soffit', { reveal: true });

  // envMap is assigned the live cube-camera texture in main.js
  M.reflective = patch(new THREE.MeshStandardMaterial({
    map: tx.mirror.map, roughnessMap: tx.mirror.roughnessMap, roughness: 0.6, metalness: 1, envMapIntensity: 1,
  }), 'reflective', { reveal: true });

  M.roof = patch(new THREE.MeshStandardMaterial({ map: tx.pvc.map, roughness: 0.75 }), 'roof', { reveal: true });
  M.pv = patch(new THREE.MeshStandardMaterial({ map: tx.pv.map, roughness: 0.3, metalness: 0.1, envMapIntensity: 1.2 }), 'pv', { ripple: true });
  M.steel = patch(new THREE.MeshStandardMaterial({ color: '#9aa1a6', roughness: 0.5, metalness: 0.6 }), 'steel');
  M.galv = patch(new THREE.MeshStandardMaterial({ color: '#a8adb0', roughness: 0.45, metalness: 0.8 }), 'pv');

  M.board = patch(new THREE.MeshStandardMaterial({
    color: '#000000', emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.6, roughness: 0.5,
  }), 'board', { clayColor: '#DCDFE4' });
  M.boardFrame = patch(new THREE.MeshStandardMaterial({ color: '#202426', roughness: 0.5, metalness: 0.5 }), 'board');
  return MAT;
}

export function setWash(color, k = 1) {
  shared.uWash.value.set(color).multiplyScalar(k);
}

// Push tweened state into uniforms + JS-side material parameters.
export function applyMaterials() {
  for (const c of CATS) {
    const s = MAT.state[c];
    const U = MAT.uniforms[c];
    U.uMix.value = s.mix;
    U.uFade.value = s.fade;
    for (const m of MAT.byCat[c]) {
      const t = MAT.targets[m.uuid];
      if (m.normalMap) m.normalScale.setScalar(t.normalScale * s.mix);
    }
    const e = MAT.edges[c];
    e.opacity = PAL.edgeOpacity * MAT.global.edge * (1 - 0.55 * s.mix) * (0.25 + 0.75 * s.fade);
    e.visible = e.opacity > 0.004;
  }
  const g = MAT.global;
  const M = MAT.materials;
  // dusk: warm interior glow behind the glazing (only once glazing is "on")
  M.glass.emissiveIntensity = g.glow * MAT.state.glazing.mix;
  M.board.emissiveIntensity = (1.1 + 1.3 * g.boardGlow) * MAT.state.board.mix;
}

export function edgeMaterial(cat) {
  return MAT.edges[cat];
}
