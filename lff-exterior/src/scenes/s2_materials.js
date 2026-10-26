// Scene 2 (0:08-0:26) — five facade materials, one language. Each material switches on in
// turn (~3 s) while the rest of the building dims to 40 %, mirroring p14-18; a running area
// counter and a facade bar (segments drawn in the actual material textures) fill in turn.
import { FACADE, COPY } from '../data.js';
import { barSwatch } from '../textures.js';
import { orbit, lerp, ALL_CATS } from './common.js';
import { smooth } from '../director.js';

export async function build(ctx) {
  const { overlay: O, master: tl, director, MAT } = ctx;
  const T0 = 8, T1 = 26, STEP = 3.0, FIRST = 8.7;

  const sec = O.el('div', 'ov sec', O.root, `${COPY.s2Title}<small>Facade materials</small>`);
  tl.fromTo(sec, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6 }, T0 + 0.1);
  tl.to(sec, { opacity: 0, duration: 0.4 }, T1 - 0.5);

  // running counter: one element per material (never shared between tweens)
  const cbox = O.el('div', 'ov counter');
  const items = FACADE.rows.map((r) => {
    const box = O.el('div', 'ov', cbox);
    box.style.left = '0px'; box.style.top = '0px'; box.style.width = '900px';
    const mat = O.el('div', 'mat', box, r.label);
    const num = O.el('div', 'num', box);
    const lab = O.el('div', 'lab', box, `${r.pct} of facade · p${r.isolatePage}`);
    return { r, box, num, mat, lab, ctr: O.counter(num, r.area, { suffix: '<em>SF</em>' }) };
  });
  const totalBox = O.el('div', 'ov', cbox);
  totalBox.style.width = '900px';
  O.el('div', 'mat', totalBox, 'Facade total');
  const totalNum = O.el('div', 'num', totalBox);
  O.el('div', 'lab', totalBox, `${FACADE.total.pct} · p${FACADE.page}`);
  const totalCtr = O.counter(totalNum, FACADE.total.area, { suffix: '<em>SF</em>' });

  // facade bar
  const bar = O.el('div', 'ov fbar');
  O.el('div', 'track', bar);
  const W = 1920 - 206;
  let x = 0;
  const segs = FACADE.rows.map((r) => {
    const w = (r.value / FACADE.total.value) * W;
    const seg = O.el('div', 'seg', bar);
    seg.style.left = x + 'px'; seg.style.width = w + 'px';
    seg.style.backgroundImage = `url(${barSwatch(r.key, MAT.tex)})`;
    const lab = O.el('div', 'seg-l', bar, `<b>${r.label}</b><span>${r.pct}</span>`);
    lab.style.left = x + 'px';
    x += w;
    return { seg, lab };
  });
  const runTot = O.el('div', 'total', bar, 'Running total<b></b>');
  const runNum = runTot.querySelector('b');
  // running total = sum of switched-on rows; one element per step to avoid shared writes
  const runEls = [];
  let acc = 0;
  FACADE.rows.forEach((r, i) => {
    acc += r.value;
    const s = i === FACADE.rows.length - 1 ? FACADE.total.area : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(acc);
    const e = O.el('span', '', runNum, `${s} SF`);
    e.style.position = 'absolute'; e.style.right = '0'; e.style.opacity = 0; e.style.whiteSpace = 'nowrap';
    runEls.push(e);
  });
  runNum.style.position = 'relative'; runNum.style.display = 'inline-block'; runNum.style.width = '220px'; runNum.style.height = '20px';

  tl.fromTo([cbox, bar], { opacity: 0 }, { opacity: 1, duration: 0.5 }, FIRST - 0.3);
  tl.set(items.map((i) => i.box).concat(totalBox), { opacity: 0 }, 0);

  const facadeKeys = FACADE.rows.map((r) => r.key);
  const others = ALL_CATS.filter((c) => !facadeKeys.includes(c));
  FACADE.rows.forEach((r, i) => {
    const t = FIRST + i * STEP;
    // material event: this one on + full; everything else to 40 %
    tl.to(MAT.state[r.key], { mix: 1, fade: 1, duration: 0.7, ease: 'power2.inOut' }, t);
    for (const c of [...others, ...facadeKeys.filter((k) => k !== r.key)]) tl.to(MAT.state[c], { fade: 0.4, duration: 0.6, ease: 'power2.inOut' }, t);
    // counter
    const it = items[i];
    if (i > 0) tl.to(items[i - 1].box, { opacity: 0, y: -16, duration: 0.3 }, t - 0.05);
    tl.fromTo(it.box, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, t);
    tl.fromTo(it.ctr, { p: 0 }, { p: 1, duration: 1.3, ease: 'power2.out' }, t + 0.1);
    // bar
    tl.fromTo(segs[i].seg, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power2.inOut' }, t + 0.15);
    tl.fromTo(segs[i].lab, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, t + 0.5);
    if (i > 0) tl.to(runEls[i - 1], { opacity: 0, duration: 0.2 }, t + 0.9);
    tl.to(runEls[i], { opacity: 1, duration: 0.25 }, t + 1.0);
  });
  // all five on together
  const tAll = FIRST + 5 * STEP; // 23.7
  for (const c of ALL_CATS) tl.to(MAT.state[c], { fade: 1, duration: 0.8, ease: 'power2.inOut' }, tAll);
  tl.to(items[4].box, { opacity: 0, y: -16, duration: 0.3 }, tAll - 0.05);
  tl.fromTo(totalBox, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, tAll);
  tl.fromTo(totalCtr, { p: 0 }, { p: 1, duration: 1.2, ease: 'power2.out' }, tAll + 0.05);
  tl.to([cbox, bar], { opacity: 0, duration: 0.45 }, T1 - 0.5);
  tl.set([cbox, bar], { display: 'none' }, T1);

  // camera: continuous slow orbit around the north + east faces, easing in from scene 1
  director.add(8, 26, (u, T) => {
    const k = smooth(u);
    const az = lerp(52, -38, u);
    const R = lerp(520, 400, smooth(Math.min(1, u * 3)));
    const h = lerp(260, 150, smooth(Math.min(1, u * 2.5)));
    return orbit(az, R, h, [0, lerp(22, 14, k), lerp(-10, -40, k)], 32, { shiftX: 0.1 * smooth(u * 4), shiftY: -0.06 * smooth(u * 4) });
  }, 's2');
}
