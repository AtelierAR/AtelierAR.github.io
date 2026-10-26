// Scene 1 (0:00-0:08) — title card from p12, then the white clay massing rotating in a
// slow 3/4 aerial.
import { COPY } from '../data.js';
import { orbit, lerp } from './common.js';
import { smoother } from '../director.js';

export async function build(ctx) {
  const { overlay: O, master: tl, director } = ctx;
  const card = O.el('div', 'ov title-card');
  const players = O.el('div', 'players', card);
  players.style.backgroundImage = `url(${import.meta.env.BASE_URL}assets/title_players.jpg)`;
  O.el('div', 'scan', card);
  O.el('div', 'vignette', card);
  const t = O.el('div', 't', card);
  const h1 = O.el('h1', '', t);
  const words = COPY.title.map((line) => { const s = O.el('span', '', h1); return O.el('i', '', s, line); });
  const kicker = O.el('div', 'kicker', t, COPY.kicker);
  const rule = O.el('div', 'rule', card);
  rule.style.top = '700px';
  // preload the image so frame 0 is complete
  await new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = players.style.backgroundImage.slice(5, -2); });

  // parallax: players drift right and scale slightly; the scanlines drift the other way
  tl.fromTo(players, { x: -36, scale: 1.04 }, { x: 34, scale: 1.1, duration: 4.8, ease: 'none' }, 0);
  tl.fromTo(words, { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.16 }, 0.35);
  tl.fromTo(kicker, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 1.05);
  tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, 0.9);
  tl.to(card, { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, 4.15);
  tl.set(card, { display: 'none' }, 4.8);

  // camera: slow 3/4 aerial rotation of the clay model
  director.add(0, 8, (u, T) => {
    const k = smoother((T - 3.6) / 4.4);
    return orbit(lerp(74, 52, k), lerp(600, 520, k), lerp(330, 260, k), [0, 22, -10], 32);
  }, 's1');
}
