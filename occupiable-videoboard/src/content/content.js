// ContentTexture: one render target that every LED face samples, so the same frame plays
// on the field face, the side faces, the plaza face and the existing board.
// Procedural GLSL only: abstract feather streaks (the p34 board language), the p4 House of
// Energy waveform, a touchdown burst and big type. No marks are drawn.
import * as THREE from 'three';
import { WAVEFORM } from '../data.js';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uFeather;   // feather streak programme
uniform float uBurst;     // touchdown burst
uniform float uRest;      // calm teal glow
uniform float uWave;      // waveform programme
uniform float uWaveAmp;   // 0 TODAY → 1 RENOVATED BOWL
uniform float uPower;     // 0 off … 1 on
uniform float uFlicker;   // power-down flicker amount
uniform float uEnergy;    // crowd envelope
uniform float uText;      // type layer opacity
uniform sampler2D tText;
uniform vec2 uWavePts[18];
uniform int uWaveN;
uniform float uWaveSplit;

const vec3 MIDNIGHT = vec3(0.0060, 0.0648, 0.0844);   // #0F4A52 linear
const vec3 EAGLES   = vec3(0.0, 0.0723, 0.0887);      // #004C54 linear
const vec3 TEAL     = vec3(0.0529, 0.4678, 0.4233);   // #41B6AF linear
const vec3 SILVER   = vec3(0.3763, 0.4125, 0.4233);   // #A5ACAF linear
const vec3 GREEN    = vec3(0.0452, 0.6038, 0.1022);   // #3CCB5A linear

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}

// A single abstract feather: a curved rachis with angled barbs that fray into streaks.
float feather(vec2 p, vec2 base, float ang, float len, float bend, float t) {
  vec2 d = p - base;
  float c = cos(ang), s = sin(ang);
  vec2 q = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);   // q.x along the feather
  float u = q.x / len;
  if (u < 0.0 || u > 1.0) return 0.0;
  float spine = bend * u * u;                         // curved rachis
  float y = q.y - spine;
  float width = len * 0.16 * sin(3.14159 * pow(u, 0.7)); // vane outline
  float inside = 1.0 - smoothstep(width * 0.75, width, abs(y));
  float barbs = 0.5 + 0.5 * sin((q.x * 1.0 - abs(y) * 1.6) * 90.0 / len + fbm(q * 6.0 + t * 0.2) * 5.0);
  float fray = smoothstep(0.25, 0.85, fbm(vec2(q.x * 3.0 / len - t * 0.15, y * 22.0 / len)));
  float rachis = (1.0 - smoothstep(0.0, len * 0.006, abs(y))) * smoothstep(1.0, 0.6, u);
  return inside * (0.35 + 0.65 * barbs) * (0.4 + 0.6 * fray) + rachis * 0.9;
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 featherProgramme(vec2 uv, float t) {
  vec2 p = (uv - 0.5) * vec2(16.0 / 9.0, 1.0);
  // drifting streak field, stretched along a sweeping flow (brush strokes of p34)
  float ang = -0.35 + 0.25 * sin(p.y * 1.3 + t * 0.07);
  vec2 q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;
  float warp = fbm(q * 1.7 + vec2(t * 0.05, 0.0));
  float streak = fbm(vec2(q.x * 0.9 - t * 0.22, q.y * 15.0 + warp * 3.0));
  streak = pow(smoothstep(0.42, 0.92, streak), 1.6);
  float fine = pow(smoothstep(0.55, 0.98, fbm(vec2(q.x * 2.2 - t * 0.4, q.y * 48.0 + warp * 6.0))), 2.0);

  float f = 0.0;
  f += feather(p, vec2(-0.95, -0.42), 0.42, 1.55, 0.25, t);
  f += 0.85 * feather(p, vec2(-0.75, -0.58), 0.18, 1.35, 0.18, t + 3.0);
  f += 0.7 * feather(p, vec2(-1.05, -0.2), 0.62, 1.2, 0.3, t + 7.0);
  f = clamp(f, 0.0, 1.4);

  vec3 col = mix(EAGLES * 0.55, MIDNIGHT, smoothstep(-0.6, 0.6, p.y + 0.2 * warp));
  col += TEAL * (0.55 * streak + 0.35 * f);
  col += SILVER * (0.9 * fine + 0.55 * pow(f, 2.0));
  col += vec3(0.85) * pow(fine * f, 1.5) * 0.6;
  return col;
}

vec3 burstProgramme(vec2 uv, float t, float e) {
  vec2 p = (uv - 0.5) * vec2(16.0 / 9.0, 1.0);
  float r = length(p);
  float a = atan(p.y, p.x);
  float rays = fbm(vec2(a * 6.0, r * 2.0 - t * 2.5));
  rays = pow(smoothstep(0.35, 0.95, rays), 1.4);
  float streaks = pow(smoothstep(0.5, 0.98, fbm(vec2(a * 22.0, r * 0.8 - t * 4.0))), 2.0);
  float ring = exp(-pow((r - fract(t * 0.6) * 1.6) * 6.0, 2.0));
  vec3 col = mix(TEAL, SILVER, rays) * (0.4 + 1.2 * rays) + vec3(1.0) * streaks * 1.2 + GREEN * ring * 0.8;
  col *= 0.6 + 0.8 * e;
  col += featherProgramme(uv * 0.8 + 0.1, t * 3.0) * 0.6;
  return col;
}

vec3 waveProgramme(vec2 uv, float t) {
  vec2 p = uv;
  vec3 col = MIDNIGHT * 0.5;
  float d = 1e3;
  float ampAfter = mix(0.12, 1.0, uWaveAmp);
  for (int i = 0; i < 17; i++) {
    if (i + 1 >= uWaveN) break;
    vec2 a = uWavePts[i], b = uWavePts[i + 1];
    a = vec2(0.06 + 0.88 * a.x, 0.5 + 0.28 * a.y * (a.x > uWaveSplit + 1e-4 ? ampAfter : 1.0));
    b = vec2(0.06 + 0.88 * b.x, 0.5 + 0.28 * b.y * (b.x > uWaveSplit + 1e-4 ? ampAfter : 1.0));
    d = min(d, segDist(p * vec2(16.0 / 9.0, 1.0), a * vec2(16.0 / 9.0, 1.0), b * vec2(16.0 / 9.0, 1.0)));
  }
  float line = 1.0 - smoothstep(0.004, 0.009, d);
  float glow = exp(-d * 40.0);
  col += mix(SILVER, GREEN, step(uWaveSplit * 0.88 + 0.06, p.x)) * (line * 2.0 + glow * 0.6);
  return col;
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  vec3 col = vec3(0.0);
  col += uFeather * featherProgramme(uv, t);
  col += uBurst * burstProgramme(uv, t, uEnergy);
  col += uWave * waveProgramme(uv, t);
  // rest: calm teal glow with a slow trace of streaks
  vec3 rest = mix(EAGLES * 0.6, TEAL * 0.9, smoothstep(0.0, 1.0, uv.y)) + TEAL * 0.25 * featherProgramme(uv, t * 0.4).g;
  col += uRest * rest;
  // big type (white on whatever is playing)
  vec4 tx = texture2D(tText, uv);
  col = mix(col, vec3(1.15), tx.a * uText);
  // power & flicker
  float fl = 1.0 - uFlicker * step(0.55, hash(vec2(floor(t * 24.0), 3.1))) * (0.6 + 0.4 * hash(vec2(floor(uv.y * 9.0), floor(t * 24.0))));
  col *= uPower * fl;
  gl_FragColor = vec4(col, 1.0);
}
`;

export class ContentTexture {
  constructor(renderer, w = 1280, h = 720) {
    this.renderer = renderer;
    this.target = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      colorSpace: THREE.LinearSRGBColorSpace,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.texture = this.target.texture;
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 1600;
    this.textCanvas.height = 900;
    this.textTex = new THREE.CanvasTexture(this.textCanvas);
    this.textTex.colorSpace = THREE.LinearSRGBColorSpace;
    this.currentText = null;

    const pts = [...WAVEFORM.today, ...WAVEFORM.renovated.slice(1)].map(([x, y]) => new THREE.Vector2(x, y));
    while (pts.length < 18) pts.push(new THREE.Vector2(1, 0));
    this.uniforms = {
      uTime: { value: 0 },
      uFeather: { value: 1 },
      uBurst: { value: 0 },
      uRest: { value: 0 },
      uWave: { value: 0 },
      uWaveAmp: { value: 0 },
      uPower: { value: 1 },
      uFlicker: { value: 0 },
      uEnergy: { value: 0 },
      uText: { value: 0 },
      tText: { value: this.textTex },
      uWavePts: { value: pts },
      uWaveN: { value: WAVEFORM.today.length + WAVEFORM.renovated.length - 1 },
      uWaveSplit: { value: WAVEFORM.renovated[0][0] },
    };
    this.material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms, depthTest: false, depthWrite: false });
    this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setText(lines) {
    const key = JSON.stringify(lines);
    if (key === this.currentText) return;
    this.currentText = key;
    const c = this.textCanvas.getContext('2d');
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    if (lines && lines.length) {
      c.fillStyle = '#fff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const H = c.canvas.height;
      const n = lines.length;
      lines.forEach((ln, i) => {
        const size = ln.size || 190;
        c.font = `${ln.weight || 800} ${size}px "Hanken Grotesk", sans-serif`;
        if (ln.tracking) c.letterSpacing = `${ln.tracking}px`;
        else c.letterSpacing = '0px';
        c.fillText(ln.text, c.canvas.width / 2, H / 2 + (i - (n - 1) / 2) * size * 1.0);
      });
    }
    this.textTex.needsUpdate = true;
  }

  render(t) {
    this.uniforms.uTime.value = t;
    const r = this.renderer;
    const prev = r.getRenderTarget();
    r.setRenderTarget(this.target);
    r.render(this.scene, this.camera);
    r.setRenderTarget(prev);
  }
}
