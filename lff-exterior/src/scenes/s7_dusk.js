// Scene 7 (1:18-1:25) — dusk on the plaza. Aerial over the Studio MLA site plan (p74-76):
// paving, trees and lawns fade in, the two ticketing canopies draw along the perimeter with
// their dimension strings (1,033.5 ft and 491 ft, p76). Time of day shifts to dusk: glazing
// glows warm, fins rim-light, the board lights the plaza in midnight green, the mirror soffit
// reflects it all. Hold on the Plaza View. End line (PROPOSED COPY).
import * as THREE from 'three';
import { ARRIVALS, COPY, TICKETING } from '../data.js';
import { spline, camPose, ft } from '../director.js';
import { orbit } from './common.js';

const T0 = 78, T1 = 85;

export async function build(ctx) {
  const { overlay: O, master: tl, director, site } = ctx;
  const S = ctx.state;
  Object.assign(S, { tk0: 0, tk1: 0, dimOp: 0 });

  // ---------------------------------------------------------------- state
  tl.set(S, { sunAz: 285, sunEl: 34, sunK: 1, envK: 1, mirror: 1, mirrorWing: 'NW', crowd: 0 }, T0);
  tl.to(S, { plan: 0.92, duration: 1.4, ease: 'power1.inOut' }, T0 + 0.2);
  tl.to(S, { trees: 1, duration: 1.6, ease: 'power1.out' }, T0 + 0.5);
  tl.to(S, { tk0: 1, duration: 1.8, ease: 'power1.inOut' }, T0 + 0.7);
  tl.to(S, { tk1: 1, duration: 1.2, ease: 'power1.inOut' }, T0 + 1.1);
  tl.to(S, { dimOp: 1, duration: 0.4 }, T0 + 1.0);
  tl.to(S, { dimOp: 0, duration: 0.4 }, T0 + 3.4);
  tl.to(S, { crowd: 1, duration: 1.2 }, T0 + 2.4);
  // dusk: warm, restrained, architectural
  tl.to(S, { dusk: 1, sunEl: 3, sunAz: 296, duration: 3.0, ease: 'power1.inOut' }, T0 + 2.6);
  tl.to(S, { glow: 1.5, rim: 1, duration: 2.4, ease: 'power1.inOut' }, T0 + 3.2);
  tl.to(S, { boardOn: 1, duration: 0.8 }, T0 + 2.8);
  tl.to(S, { bloom: 0.45, duration: 2.0 }, T0 + 3.4);
  tl.to(S, { plan: 0.4, duration: 2.0 }, T0 + 3.4);

  // ---------------------------------------------------------------- overlay
  const dims = site.ticketing.items.map((it, i) => {
    const d = O.el('div', 'ov dim', O.root, `<b>Ticketing canopy</b><span>${TICKETING[i].text}</span>`);
    d.style.opacity = 0;
    return { it, d };
  });
  const chip = O.el('div', 'ov ref-chip', O.root, 'Site plan: Studio MLA · p74–76');
  tl.set(chip, { opacity: 0 }, 0);
  tl.to(chip, { opacity: 1, duration: 0.4 }, T0 + 0.4);
  tl.to(chip, { opacity: 0, duration: 0.4 }, T0 + 3.4);

  // PROPOSED COPY — end line
  const end = O.el('div', 'ov endline');
  const words = COPY.endLine.split(' ').map((w) => O.el('span', 'w', end, w + '&nbsp;'));
  tl.set(words, { opacity: 0 }, 0);
  tl.fromTo(words, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out', immediateRender: false }, T0 + 5.0);

  ctx.onFrame((T, c) => {
    const on = T >= T0;
    site.ticketing.items[0].setProgress(on ? S.tk0 : 0);
    site.ticketing.items[1].setProgress(on ? S.tk1 : 0);
    site.ticketing.items.forEach((it) => (it.dim.material.opacity = on ? S.dimOp : 0));
    if (on) {
      c.shadowKey.push('tk' + S.tk0.toFixed(3) + S.tk1.toFixed(3));
      for (const { it, d } of dims) {
        const p = O.project(it.anchor, c.engine.camera);
        d.style.left = p.x + 'px';
        d.style.top = p.y - 34 + 'px';
        d.style.opacity = p.ok ? S.dimOp : 0;
      }
    } else for (const { d } of dims) d.style.opacity = 0;
  });

  // ---------------------------------------------------------------- camera
  const plaza = camPose(ARRIVALS[0].cam);
  const s6end = orbit(118, 520, 210, [0, 20, 0], 34);
  const K = (t, p, x = {}) => ({ t, pos: p.pos.toArray(), target: p.target.toArray(), fov: p.fov ?? 34, shiftX: p.shiftX || 0, shiftY: p.shiftY || 0, ...x });
  const aerialA = { pos: ft(1300, 1900, -2300), target: ft(-60, 0, -560), fov: 36 };
  const aerialB = { pos: ft(600, 1500, -2400), target: ft(-80, 0, -620), fov: 36 };
  const low = { pos: ft(0, 120, -1700), target: ft(0, 110, -1200), fov: 38, shiftY: 0.06 };
  const hold = { ...plaza, pos: plaza.pos.clone().lerp(plaza.target, 0.025) };
  const path = spline([
    K(T0, s6end),
    K(T0 + 1.2, aerialA),
    K(T0 + 2.6, aerialB),
    K(T0 + 4.2, low),
    K(T0 + 5.0, plaza),
    K(T1, hold),
  ]);
  director.add(T0, T1, (u, T) => path(T), 's7');
}
