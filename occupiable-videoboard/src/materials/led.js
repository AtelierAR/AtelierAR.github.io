// LED skin shader for every face of both volumes.
//
// Clear LED: emissive vertical pixel bars with true transparency between them. The bar
// coverage is filtered analytically (fwidth), so at distance — when a bar is smaller than a
// few screen pixels — the skin resolves into the image (black content stays see-through,
// like real transparent LED), and up close it opens into a fine veil you can see through.
// Traditional LED: opaque emissive panel whose module grid only shows at close range.
// Glass: the p63 / p67 massing look — teal #41B6AF at ~45%.
// Skin changes run as a vertical wipe across the strips (no crossfade).
import * as THREE from 'three';

// Uniforms shared by every LED face. Values are driven by the timeline.
export const ledShared = {
  tContent: { value: null },
  uEmissive: { value: 2.2 },
  uPitch: { value: 1.0 }, // ft — 0.4 ft real pitch scaled ×2.5 for readability (quality toggle ×2)
  uFill: { value: 0.4 }, // bar width / pitch → ≈60% open
  uSkinFrom: { value: new THREE.Vector3(0, 0, 0) }, // canvas, wings+band, other faces: 0 clear, 1 traditional
  uSkinTo: { value: new THREE.Vector3(0, 0, 0) },
  uWipe: { value: 1 }, // 0..1 progress of the strip wipe from uSkinFrom to uSkinTo
  uGlass: { value: 0 }, // 0 LED … 1 teal glass massing
  uGlassAlpha: { value: 0.45 },
  uGlassGlow: { value: 0 },
  uBackDim: { value: 0.22 }, // how much of the image reads from behind (inside the volume)
  uNight: { value: 0 },
  uFlood: { value: 0 }, // touchdown: veil floods with light
};

export const GLASS_TEAL = new THREE.Color('#41B6AF');

const VERT = /* glsl */ `
attribute vec2 aFt;     // face coordinates, feet (x centred, y from the bottom edge)
attribute vec2 aCUv;    // content UV for this face
varying vec2 vFt;
varying vec2 vCUv;
varying vec3 vN;
varying vec3 vWorld;
#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
  vFt = aFt;
  vCUv = aCUv;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tContent;
uniform float uEmissive, uPitch, uFill, uWipe, uGlass, uGlassAlpha, uGlassGlow, uBackDim, uNight, uFlood;
uniform vec3 uSkinFrom, uSkinTo, uGlassColor;
uniform float uFaceKind;     // 0 field face (canvas/wings/band), 1 other faces
uniform float uFaceW;        // face width, ft (for the wipe)
uniform float uFaceX0;
uniform float uFade;         // per-face fade (used during the pass-through and for draw-on)
uniform float uMirror;       // 1 = mirror content horizontally (faces seen from the "wrong" side)
varying vec2 vFt;
varying vec2 vCUv;
varying vec3 vN;
varying vec3 vWorld;
#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float region() {
  // 0 canvas, 1 wings+band, 2 other faces
  if (uFaceKind > 0.5) return 2.0;
  bool inCanvas = abs(vFt.x) < 82.0 && vFt.y > 17.25;
  return inCanvas ? 0.0 : 1.0;
}
float pick(vec3 v, float r) { return r < 0.5 ? v.x : (r < 1.5 ? v.y : v.z); }

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 cuv = vCUv;
  if (uMirror > 0.5) cuv.x = 1.0 - cuv.x;
  vec3 content = texture2D(tContent, cuv).rgb;
  content += uFlood * vec3(0.55, 0.95, 0.9);
  float luma = dot(content, vec3(0.2126, 0.7152, 0.0722));

  // strip coordinates (gap centred on x = 0 so a camera on the axis passes between bars)
  float s = vFt.x / uPitch;
  float cell = fract(s) - 0.5;
  float fw = max(fwidth(s), 1e-4);
  float halfFill = 0.5 * uFill;
  float bar = 1.0 - smoothstep(halfFill - 0.5 * fw, halfFill + 0.5 * fw, abs(cell));
  float far = smoothstep(0.1, 0.38, fw);          // bars under ~3–10 px resolve into the image
  bar = mix(bar, uFill, smoothstep(0.35, 0.7, fw));

  // individual LED pixels along a bar, visible only when close
  float ty = vFt.y / uPitch;
  float fwy = max(fwidth(ty), 1e-4);
  float px = 1.0 - 0.45 * (1.0 - smoothstep(0.18, 0.32, abs(fract(ty) - 0.5))) * (1.0 - smoothstep(0.08, 0.3, fwy));

  // skin state for this strip: wipe sweeps across the strips
  float stripN = clamp((vFt.x - uFaceX0) / uFaceW, 0.0, 1.0);
  float r = region();
  float switched = step(stripN, uWipe);
  float trad = mix(pick(uSkinFrom, r), pick(uSkinTo, r), switched);
  float front = gl_FrontFacing ? 1.0 : 0.0;

  // clear LED
  vec3 cClear = content * uEmissive * px;
  float aNear = bar;
  float aFar = clamp(0.3 + 2.0 * luma, 0.0, 0.95);
  float aClear = mix(aNear, aFar, far);
  // from behind: the dark back of each bar with a little of the image bleeding through
  vec3 cBack = mix(vec3(0.012, 0.016, 0.018), content * uEmissive * uBackDim, 0.75);
  cClear = mix(cBack, cClear, front);
  aClear = mix(mix(bar, 0.5 * uFill + 0.1, far), aClear, front);

  // traditional LED (opaque) with its module grid near
  vec2 m = vFt / 2.0;
  vec2 fwm = fwidth(m);
  vec2 g = smoothstep(vec2(0.0), fwm * 1.5, abs(fract(m) - 0.5) - (0.5 - 0.035));
  float grid = max(g.x, g.y) * (1.0 - smoothstep(0.05, 0.25, max(fwm.x, fwm.y)));
  vec3 cTrad = content * uEmissive * (1.0 - 0.55 * grid);
  cTrad = mix(vec3(0.018, 0.021, 0.023), cTrad, front);
  float aTrad = 1.0;

  vec3 col = mix(cClear, cTrad, trad);
  float alpha = mix(aClear, aTrad, trad);

  // wipe front: strips flick bright as they switch
  float edge = exp(-abs(stripN - uWipe) * 140.0) * step(0.001, uWipe) * step(uWipe, 0.999);
  col += vec3(0.8, 1.0, 0.95) * edge * 1.5;
  alpha = max(alpha, edge * 0.8);

  // teal glass massing (p63, p67)
  float facing = abs(dot(normalize(vN), normalize(vec3(0.35, 0.8, 0.45))));
  vec3 cGlass = uGlassColor * (0.55 + 0.45 * facing) * (1.0 + uGlassGlow);
  col = mix(col, cGlass, uGlass);
  alpha = mix(alpha, uGlassAlpha, uGlass);

  gl_FragColor = vec4(col, alpha * uFade);
  #include <colorspace_fragment>
}
`;

export function makeLedMaterial({ faceKind = 1, faceW = 214, faceX0 = -107, mirror = 0 } = {}) {
  const lin = GLASS_TEAL.clone();
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      ...ledShared,
      uGlassColor: { value: lin },
      uFaceKind: { value: faceKind },
      uFaceW: { value: faceW },
      uFaceX0: { value: faceX0 },
      uFade: { value: 1 },
      uMirror: { value: mirror },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
    extensions: { derivatives: true },
  });
}

// Real 3D strips for the pass-through: one InstancedMesh of thin bars on the north field
// face, faded in only when the camera is close (the shader skin fades out there).
const STRIP_VERT = /* glsl */ `
attribute float aX;      // strip centre, face feet
uniform float uFaceH;
varying vec2 vFt;
varying vec3 vNl;
varying vec3 vWorld;
void main() {
  vec3 p = position;                 // unit box: x ±0.5 (width), y 0..1 (height), z ±0.5 (depth)
  vFt = vec2(aX, p.y * uFaceH);
  vNl = normal;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
const STRIP_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tContent;
uniform float uEmissive, uPitch, uFade, uBackDim, uFlood;
uniform float uFaceW;
varying vec2 vFt;
varying vec3 vNl;
varying vec3 vWorld;
void main() {
  vec2 cuv = vec2(vFt.x / uFaceW + 0.5, vFt.y / 109.5);
  vec3 content = texture2D(tContent, cuv).rgb + uFlood * vec3(0.55, 0.95, 0.9);
  float ty = vFt.y / uPitch;
  float fwy = max(fwidth(ty), 1e-4);
  float px = 1.0 - 0.5 * (1.0 - smoothstep(0.18, 0.32, abs(fract(ty) - 0.5))) * (1.0 - smoothstep(0.08, 0.3, fwy));
  // local box normal: -z faces the field (emitting side), +z faces inside, ±x the bar edges
  vec3 c;
  if (vNl.z < -0.5) c = content * uEmissive * px;
  else if (vNl.z > 0.5) c = mix(vec3(0.012, 0.016, 0.018), content * uEmissive * uBackDim, 0.75);
  else c = vec3(0.03, 0.035, 0.04) + content * 0.15;
  gl_FragColor = vec4(c, uFade);
}
`;

export function makeStripMaterial(faceH = 109.5) {
  return new THREE.ShaderMaterial({
    vertexShader: STRIP_VERT,
    fragmentShader: STRIP_FRAG,
    uniforms: {
      tContent: ledShared.tContent,
      uEmissive: ledShared.uEmissive,
      uPitch: ledShared.uPitch,
      uBackDim: ledShared.uBackDim,
      uFlood: ledShared.uFlood,
      uFade: { value: 0 },
      uFaceW: { value: 214 },
      uFaceH: { value: faceH },
    },
    transparent: true,
    depthWrite: true,
    extensions: { derivatives: true },
  });
}
