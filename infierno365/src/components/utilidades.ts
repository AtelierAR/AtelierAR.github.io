import { Easing, interpolate, spring } from 'remotion';
import { FPS, VISUAL } from '../constants/brand';

/** 0 → 1 con spring de peso (sin rebote), a partir del cuadro `desde`. */
export const entrada = (frame: number, desde: number, duracion?: number) =>
  spring({ frame: frame - desde, fps: FPS, config: VISUAL.spring, durationInFrames: duracion });

/** Spring de golpe: rápido, con un sobretiro mínimo. */
export const golpe = (frame: number, desde: number) =>
  spring({ frame: frame - desde, fps: FPS, config: VISUAL.springGolpe });

/** Interpolación lineal acotada entre cuadros. */
export const tramo = (
  frame: number,
  desde: number,
  hasta: number,
  ease: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [desde, hasta], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Mezcla dos colores hex. */
export const mezclar = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

export const TAN_CORTE = Math.tan((VISUAL.anguloCorte * Math.PI) / 180);
