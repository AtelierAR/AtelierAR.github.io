import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CUT } from './materials.js';

// Tiny low-poly fans in midnight green and white. A wave travels around the
// bowl as a function of plan angle and film time, so it reads continuously
// across the four seat-view cuts of scene 9.
function figure() {
  const body = new THREE.BoxGeometry(1.25, 2.1, 0.8); body.translate(0, 1.05, 0);
  const head = new THREE.IcosahedronGeometry(0.42, 0); head.translate(0, 2.55, 0);
  const arms = new THREE.BoxGeometry(1.7, 0.35, 0.35); arms.translate(0, 1.75, 0);
  return mergeGeometries([body.toNonIndexed(), head.toNonIndexed(), arms.toNonIndexed()]);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function buildCrowd(seatLists, { density = 0.82, seed = 7 } = {}) {
  const rand = rng(seed);
  const seats = [];
  for (const list of seatLists) for (const s of list) if (rand() < density) seats.push(s);
  const geo = figure();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8, clippingPlanes: [CUT] });
  const uniforms = { uTime: { value: 0 }, uWave: { value: 1 }, uNear: { value: 45 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aPhase; uniform float uTime, uWave, uNear;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        // wave: crest travels clockwise in plan at ~0.11 rev/s
        float ph = fract(aPhase - uTime * 0.11);
        float crest = exp(-pow(min(ph, 1.0 - ph) * 28.0, 2.0)) * uWave;
        transformed.y *= 1.0 + 0.32 * crest;
        transformed.y += 0.9 * crest;
        if (position.y > 1.6 && position.y < 1.95) { transformed.x *= 1.0 - 0.6 * crest; transformed.y += 1.1 * crest; }
        // keep the seats around the camera empty (the renders show empty foreground rows)
        vec3 ip = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        transformed *= smoothstep(uNear, uNear + 12.0, distance(ip, cameraPosition));`);
  };
  mat.customProgramCacheKey = () => 'crowd';
  const mesh = new THREE.InstancedMesh(geo, mat, seats.length);
  const phase = new Float32Array(seats.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const green = new THREE.Color('#0F4A52'), white = new THREE.Color('#F4F6F6'), mid = new THREE.Color('#2B6A70');
  seats.forEach((s, i) => {
    // face the field: normal points away from the bowl back
    const ang = Math.atan2(-s.x, -s.z);
    q.setFromAxisAngle(up, ang);
    const k = 0.85 + rand() * 0.3;
    sc.set(k, k, k);
    p.set(s.x + (rand() - 0.5) * 0.4, s.y, s.z + (rand() - 0.5) * 0.4);
    mesh.setMatrixAt(i, m4.compose(p, q, sc));
    const r = rand();
    mesh.setColorAt(i, r < 0.58 ? green : r < 0.86 ? white : mid);
    phase[i] = (Math.atan2(s.z, s.x) / (Math.PI * 2) + 1) % 1;
  });
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return { mesh, uniforms, count: seats.length };
}
