// Sky, fog and lights. One `night` scalar blends the lavender-grey daylight of the p70/p71
// renders (#8D96AD → #E3E6EC) into the night of Scenes 1 and 6.
import * as THREE from 'three';
import { COLORS } from '../data.js';

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;
const SKY_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uTop, uHorizon, uNightTop, uNightHorizon, uGround;
uniform float uNight;
varying vec3 vDir;
void main() {
  float h = vDir.y;
  vec3 day = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.75, h), 0.8));
  // a soft high-cloud texture so the day sky is not flat
  vec3 night = mix(uNightHorizon, uNightTop, smoothstep(0.0, 0.5, h));
  vec3 c = mix(day, night, uNight);
  c = mix(c, uGround * mix(1.0, 0.08, uNight), smoothstep(0.0, -0.08, h));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.skyUniforms = {
      uTop: { value: new THREE.Color(COLORS.skyTop) },
      uHorizon: { value: new THREE.Color(COLORS.skyHorizon) },
      uNightTop: { value: new THREE.Color('#03070A') },
      uNightHorizon: { value: new THREE.Color('#0E1A20') },
      uGround: { value: new THREE.Color('#DADDE2') },
      uNight: { value: 0 },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(9000, 32, 16),
      new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false }),
    );
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    this.sky = sky;
    scene.add(sky);

    this.fog = new THREE.Fog(new THREE.Color(COLORS.skyHorizon), 1400, 7000);
    scene.fog = this.fog;

    this.hemi = new THREE.HemisphereLight(new THREE.Color('#E8ECF4'), new THREE.Color('#B9BDC4'), 1.4);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(new THREE.Color('#FFF8F0'), 2.6);
    this.sun.position.set(-900, 1400, 700);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -700;
    sc.right = 700;
    sc.top = 700;
    sc.bottom = -700;
    sc.near = 100;
    sc.far = 4000;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun);
    scene.add(this.sun.target);
    // night: stadium lighting from the canopies (two broad cool-white washes)
    this.floodE = new THREE.DirectionalLight(new THREE.Color('#EAF2FF'), 0);
    this.floodE.position.set(600, 700, 120);
    this.floodW = new THREE.DirectionalLight(new THREE.Color('#EAF2FF'), 0);
    this.floodW.position.set(-600, 700, -120);
    scene.add(this.floodE, this.floodW);
    // plaza wash from the plaza-facing face of the north board (p26), driven by content
    this.plazaLight = new THREE.SpotLight(new THREE.Color('#5FD3C3'), 0, 900, 0.95, 0.6, 1.2);
    this.plazaLight.position.set(0, 120, -420);
    this.plazaLight.target.position.set(0, 0, -640);
    scene.add(this.plazaLight, this.plazaLight.target);
    // field wash from the LED faces (cheap colour bounce)
    this.boardGlow = new THREE.PointLight(new THREE.Color('#4FC7B9'), 0, 900, 1.3);
    this.boardGlow.position.set(0, 110, -260);
    scene.add(this.boardGlow);
  }

  // night 0..1, house lights 0..1 (stadium lighting on at night)
  set(night, house = 1) {
    this.skyUniforms.uNight.value = night;
    const dayK = 1 - night;
    this.hemi.intensity = 1.35 * dayK + 0.05 * night + 0.1 * night * house;
    this.hemi.color.set('#E8ECF4');
    this.sun.intensity = 2.6 * dayK;
    this.sun.castShadow = dayK > 0.05;
    this.floodE.intensity = 0.42 * night * house;
    this.floodW.intensity = 0.42 * night * house;
    this.hemi.groundColor.set('#B9BDC4').lerp(new THREE.Color('#1a2226'), night);
    this.fog.color.copy(new THREE.Color(COLORS.skyHorizon)).lerp(new THREE.Color('#0B1418'), night);
  }
}
