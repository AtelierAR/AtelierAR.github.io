import * as THREE from 'three';

// Full-frame (or partial) image plates that ride with the camera, used for the deck photographs.
// The shader does the photographic treatment in one place: cover-fit, push-in, duotone, darken,
// torn-paper edges and a light halftone.

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const frag = /* glsl */ `
uniform sampler2D map;
uniform float opacity;
uniform float imageAspect;
uniform float planeAspect;
uniform float zoom;
uniform vec2 pan;
uniform vec2 focus;
uniform float duotone;
uniform vec2 levels;
uniform vec3 duoDark;
uniform vec3 duoLight;
uniform float brightness;
uniform float contrast;
uniform float torn;
uniform float tornSeed;
uniform float halftone;
uniform float vignette;
uniform vec2 res;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
  return v;
}

void main() {
  // cover fit
  vec2 uv = vUv - 0.5;
  if (imageAspect > planeAspect) uv.x *= planeAspect / imageAspect;
  else uv.y *= imageAspect / planeAspect;
  uv += 0.5;
  uv = (uv - focus) / zoom + focus + pan;
  vec3 c = texture2D(map, uv).rgb;
  c = (c - 0.5) * contrast + 0.5;
  c *= brightness;
  // perceptual (gamma) luminance: textures are decoded to linear, which would crush dark photos
  float l = pow(max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0), 0.4545);
  vec3 duo = mix(duoDark, duoLight, smoothstep(levels.x, levels.y, l));
  c = mix(c, duo, duotone);
  if (halftone > 0.0) {
    vec2 g = vUv * res / 5.0;
    vec2 cell = fract(mat2(0.7071, -0.7071, 0.7071, 0.7071) * g) - 0.5;
    float dotR = sqrt(1.0 - l) * 0.62;
    float ink = smoothstep(dotR + 0.08, dotR - 0.08, length(cell));
    c = mix(c, c * (1.0 - ink * 0.55), halftone);
  }
  float a = opacity;
  if (torn > 0.0) {
    // distance to the nearest edge, roughened by fbm: a torn paper edge with a pale fibre rim
    vec2 e = min(vUv, 1.0 - vUv) * res / min(res.x, res.y);
    float d = min(e.x, e.y);
    float n = fbm(vUv * vec2(res.x / res.y, 1.0) * 9.0 + tornSeed) * 0.05 * torn;
    float edge = smoothstep(n, n + 0.004, d);
    float fibre = smoothstep(n + 0.012, n + 0.004, d) * edge;
    c = mix(c, vec3(0.86, 0.88, 0.86), fibre * 0.6);
    a *= edge;
  }
  if (vignette > 0.0) {
    vec2 v = vUv - 0.5;
    c *= 1.0 - vignette * dot(v, v) * 1.6;
  }
  gl_FragColor = vec4(c, a);
}`;

export const COVER_GLSL = /* glsl */ `
vec2 coverUv(vec2 vUv, float imageAspect, float planeAspect, float zoom, vec2 focus, vec2 pan) {
  vec2 uv = vUv - 0.5;
  if (imageAspect > planeAspect) uv.x *= planeAspect / imageAspect;
  else uv.y *= imageAspect / planeAspect;
  uv += 0.5;
  return (uv - focus) / zoom + focus + pan;
}`;
export const PLATE_VERT = vert;

// Plates are backdrops: they must draw before any 3D geometry. Three.js renders every
// `transparent` material after the opaque list, so a transparent plate with depthTest off would
// paint over the model. Instead plates stay in the opaque list (sorted by renderOrder < 0) and
// blend through CustomBlending, which three.js honours even for non-transparent materials.
export function backdrop(m) {
  m.transparent = false;
  m.blending = THREE.CustomBlending;
  m.blendSrc = THREE.SrcAlphaFactor;
  m.blendDst = THREE.OneMinusSrcAlphaFactor;
  m.blendSrcAlpha = THREE.OneFactor;
  m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  return m;
}

export function plate(texture, opts = {}) {
  const img = texture.image;
  const u = {
    map: { value: texture },
    opacity: { value: opts.opacity ?? 1 },
    imageAspect: { value: img ? img.width / img.height : 16 / 9 },
    planeAspect: { value: opts.aspect ?? 16 / 9 },
    zoom: { value: opts.zoom ?? 1 },
    pan: { value: new THREE.Vector2() },
    focus: { value: new THREE.Vector2(0.5, 0.5) },
    duotone: { value: opts.duotone ?? 0 },
    levels: { value: new THREE.Vector2(...(opts.levels ?? [0.02, 0.95])) },
    duoDark: { value: new THREE.Color(opts.dark ?? '#0B3B41') },
    duoLight: { value: new THREE.Color(opts.light ?? '#B9CFD3') },
    brightness: { value: opts.brightness ?? 1 },
    contrast: { value: opts.contrast ?? 1 },
    torn: { value: opts.torn ?? 0 },
    tornSeed: { value: opts.seed ?? 0 },
    halftone: { value: opts.halftone ?? 0 },
    vignette: { value: opts.vignette ?? 0 },
    res: { value: new THREE.Vector2(opts.w ?? 1920, opts.h ?? 1080) },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: vert,
    fragmentShader: frag,
    depthTest: false,
    depthWrite: false,
  });
  backdrop(m);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  mesh.renderOrder = opts.order ?? -100;
  mesh.frustumCulled = false;
  mesh.userData.u = u;
  return mesh;
}

// Place a camera-attached plate so that it covers the pixel rect (x, y, w, h) of the 1920×1080
// frame at distance `dist` in front of the camera.
export function placeOnScreen(mesh, camera, { x = 0, y = 0, w = 1920, h = 1080, dist = 10 } = {}) {
  const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const k = vh / 1080;
  mesh.scale.set(w * k, h * k, 1);
  mesh.position.set((x + w / 2 - 960) * k, -(y + h / 2 - 540) * k, -dist);
  mesh.userData.u.planeAspect.value = w / h;
  mesh.userData.u.res.value.set(w, h);
}

// A soft radial field (grey) for duotone backgrounds: the slide "field" of p2/p9.
let fieldTex;
export function fieldTexture() {
  if (fieldTex) return fieldTex;
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 360;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(400, 150, 10, 360, 200, 520);
  r.addColorStop(0, '#ffffff');
  r.addColorStop(0.55, '#9a9a9a');
  r.addColorStop(1, '#000000');
  g.fillStyle = r;
  g.fillRect(0, 0, 640, 360);
  fieldTex = new THREE.CanvasTexture(c);
  fieldTex.colorSpace = THREE.SRGBColorSpace;
  return fieldTex;
}

export function fieldPlate(dark = '#041f23', light = '#0e4a52', order = -200) {
  const p = plate(fieldTexture(), { duotone: 1, dark, light, opacity: 0, order });
  p.userData.u.imageAspect.value = 16 / 9;
  return p;
}
