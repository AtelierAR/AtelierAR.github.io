// Shared scene helpers.
import * as THREE from 'three';
import { FT } from '../data.js';

export const FACADE_CATS = ['masonry', 'fins', 'glazing', 'metal', 'mesh'];
export const ALL_CATS = ['clay', 'masonry', 'fins', 'glazing', 'metal', 'mesh', 'soffit', 'reflective', 'roof', 'pv', 'board', 'steel'];

// Orbit pose: az in degrees (0 = deck north / -Z, 90 = east / +X), radius + height in metres.
export function orbit(az, R, h, target = [0, 20, 0], fov = 32, extra = {}) {
  const a = THREE.MathUtils.degToRad(az);
  return { pos: new THREE.Vector3(Math.sin(a) * R + target[0], h, -Math.cos(a) * R + target[2]), target: new THREE.Vector3(...target), fov, ...extra };
}

export const lerp = (a, b, t) => a + (b - a) * t;

// Tween helper for many material states at once.
export function mats(tl, MAT, cats, vars, at) {
  cats.forEach((c, i) => tl.to(MAT.state[c], { ...vars }, at));
}

export const ftv = (x, y, z) => new THREE.Vector3(x * FT, y * FT, z * FT);
