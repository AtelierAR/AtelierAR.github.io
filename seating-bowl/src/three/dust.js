import * as THREE from 'three';

// Fine demolition dust for the planar-slice demo (scenes 4/5). Every particle
// sits on a demolished surface; when the rising slice plane passes its height
// it is released and drifts outward and down, fading out. Fully a function of
// the slice height, so it is deterministic under frame stepping.
export function buildDust() {
  const N = 9000;
  const pos = new Float32Array(N * 3), dir = new Float32Array(N * 3), side = new Float32Array(N);
  let s = 99;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < N; i++) {
    const south = i % 2;
    const sx = south ? 1 : -1;
    // demolished north bowl above the main concourse / south upper + board
    const x = sx * (300 + r() * 85);
    const y = 30 + r() * 105;
    const z = (r() - 0.5) * (south ? 300 : 380);
    pos.set([x, y, z], i * 3);
    const a = r() * Math.PI * 2;
    dir.set([Math.cos(a) * 0.5 + sx * 0.6, -0.25 - r() * 0.35, Math.sin(a) * 0.5], i * 3);
    side[i] = south;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  const uniforms = { uCut: { value: -1e4 }, uSide: { value: 0 }, uSize: { value: 2.2 }, uColor: { value: new THREE.Color('#9C5550') } };
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms,
    vertexShader: `attribute vec3 aDir; attribute float aSide; uniform float uCut, uSide, uSize; varying float vA;
      void main(){
        float age = uCut - position.y;
        float on = step(0.0, age) * step(age, 30.0) * (1.0 - abs(aSide - uSide));
        vec3 p = position + aDir * age * 1.6 + vec3(0.0, -0.05 * age * age, 0.0);
        vA = on * (1.0 - age / 30.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (300.0 / -mv.z) * on;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard; gl_FragColor = vec4(uColor, vA * 0.55);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}
