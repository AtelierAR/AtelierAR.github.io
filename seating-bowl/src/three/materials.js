import * as THREE from 'three';
import { C } from '../palette.js';

// Shared clipping planes: the 50-yard cut (scene 2) and the planar demolition
// slice (scenes 4/5). Materials opt in by including these arrays.
export const CUT = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e5); // keeps x <= constant
export const SLICE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e5); // keeps y >= -constant

const col = (hex) => new THREE.Color(hex);

function clay(hex = C.model, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: col(hex), roughness: 0.92, metalness: 0, side: THREE.DoubleSide,
    clippingPlanes: [CUT], ...opts,
  });
}

// Deck red with a 45° hatch at 30% (p52/p54 treatment). The hatch is screen
// space so it reads as a drafting pattern regardless of the model's scale.
function hatch(hex, { fill = 0.3, line = 0.85, spacing = 9, width = 1.6, planes = [CUT, SLICE] } = {}) {
  const m = new THREE.MeshLambertMaterial({ color: col('#FFFFFF'), side: THREE.DoubleSide, clippingPlanes: planes });
  m.userData.uniforms = {
    uHatch: { value: col(hex) }, uFill: { value: fill }, uLine: { value: line },
    uSpacing: { value: spacing }, uWidth: { value: width }, uDpr: { value: 1 },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.uniforms);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uHatch; uniform float uFill, uLine, uSpacing, uWidth, uDpr;`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float sp = uSpacing * uDpr;
        float d = mod(gl_FragCoord.x + gl_FragCoord.y, sp);
        float l = 1.0 - smoothstep(uWidth * uDpr * 0.5, uWidth * uDpr * 0.5 + 1.0, min(d, sp - d));
        vec3 base = mix(gl_FragColor.rgb, uHatch, uFill);
        gl_FragColor.rgb = mix(base, uHatch, l * uLine);`);
  };
  m.customProgramCacheKey = () => `hatch-${hex}-${planes.length}`;
  return m;
}

// Seat-row strips fade toward the tread colour with distance so the fine
// parallel lines read up close without moiré in the wide shots.
function strip(hex, farHex, opts = {}) {
  const m = clay(hex, opts);
  const u = { uFarCol: { value: col(farHex) }, uNear: { value: 160 }, uFar: { value: 620 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uFarCol; uniform float uNear, uFar;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, uFarCol, smoothstep(uNear, uFar, length(vViewPosition)));');
  };
  m.customProgramCacheKey = () => `strip-${hex}-${farHex}-${(opts.clippingPlanes || []).length}`;
  return m;
}

function tint(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: col(hex), roughness: 0.85, metalness: 0, side: THREE.DoubleSide,
    clippingPlanes: [CUT], ...opts,
  });
}

function glass(hex = C.glass, opacity = 0.45) {
  return new THREE.MeshStandardMaterial({
    color: col(hex), roughness: 0.25, metalness: 0.05, transparent: true, opacity,
    depthWrite: false, side: THREE.DoubleSide, emissive: col(hex), emissiveIntensity: 0.12,
    clippingPlanes: [CUT],
  });
}

export function makeMaterials() {
  const M = {
    clay: clay(),
    clayWarm: clay('#ECEDEF'),
    fascia: clay('#E3E6E8'),
    seat: strip('#8F989C', C.model, { roughness: 0.8 }),
    seatGreen: strip('#2E7C47', C.overbuild),
    seatLight: strip('#6FAE60', C.newSeat),
    seatTeal: strip('#2A8C86', '#3FA9A3'),
    seatRed: strip('#9E2C26', '#E8B4B0', { clippingPlanes: [CUT, SLICE] }),
    poche: new THREE.MeshBasicMaterial({ color: col('#2C3B3D'), side: THREE.DoubleSide }),
    hatch: hatch(C.demo),
    hatchField: hatch(C.demo, { planes: [CUT], fill: 0.42 }),
    overbuild: tint(C.overbuild),
    newSeat: tint(C.newSeat),
    clubSweep: tint(C.clubSweep),
    altGreen: tint('#A6D69A'),
    tealSeat: tint('#3FA9A3'),
    glass: glass(),
    glassSolid: glass('#2E8F89', 0.62),
    glassAlt: glass('#2E8F89', 0.78),
    edge: new THREE.LineBasicMaterial({ color: col(C.hairline), transparent: true, opacity: 0.35, clippingPlanes: [CUT] }),
    edgeRed: new THREE.LineDashedMaterial({ color: col(C.demo), dashSize: 3, gapSize: 2.2, transparent: true, opacity: 0.95, clippingPlanes: [CUT, SLICE] }),
    edgeGreen: new THREE.LineBasicMaterial({ color: col('#1E5E33'), transparent: true, opacity: 0.85, clippingPlanes: [CUT] }),
    edgeGlass: new THREE.LineBasicMaterial({ color: col(C.glassEdge), transparent: true, opacity: 1, clippingPlanes: [CUT] }),
    ribbon: new THREE.MeshBasicMaterial({ color: col('#B9FFF0'), clippingPlanes: [CUT] }),
    ground: new THREE.MeshStandardMaterial({ color: col('#E9EBEA'), roughness: 1 }),
  };
  M.hatchAll = [M.hatch, M.hatchField];
  return M;
}

// Plan graphic bands (scenes 1/8): flat colour, revealed by an angular sweep
// around the field centre so the bowl "draws" ring by ring.
export function planMaterial(hex) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    uniforms: { uColor: { value: col(hex) }, uOpacity: { value: 1 }, uSweep: { value: 1 }, uColor2: { value: col(hex) }, uMix: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uColor, uColor2; uniform float uOpacity, uSweep, uMix; varying vec3 vW;
      void main(){
        float a = atan(-vW.z, -vW.x) / 6.2831853 + 0.5; // 0 at north, increasing clockwise in plan
        if (a > uSweep) discard;
        gl_FragColor = vec4(mix(uColor, uColor2, uMix), uOpacity);
        #include <colorspace_fragment>
      }`,
  });
}
