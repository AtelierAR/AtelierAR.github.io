import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ANCHO, AUDIO, COLOR, FPS, inicioEscena, seg, T } from '../constants/brand';

/** Forma de un complejo QRS (unidad: amplitud), centrado en 0 s, dura ~0.22 s. */
const qrs = (dt: number) => {
  const g = (mu: number, s: number, a: number) => a * Math.exp(-((dt - mu) ** 2) / (2 * s * s));
  return g(-0.06, 0.018, 0.12) + g(-0.012, 0.008, -0.18) + g(0, 0.01, 1) + g(0.022, 0.01, -0.45) + g(0.14, 0.035, 0.18);
};

/** 01 · LATIDO — una línea roja late como electrocardiograma al ritmo del canto. */
export const Escena01: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = inicioEscena('Escena01');
  const t = frame / FPS;
  const duracion = T.e01.corteSilencio;
  const velocidad = ANCHO / (duracion * 0.92); // px/s del cursor
  const cursor = Math.min(ANCHO, t * velocidad);
  const y0 = 540;
  const amp = 210;

  const senal = (tau: number) => AUDIO.latidos.reduce((s, b) => s + qrs(tau - (b - t0)), 0);

  const puntos: string[] = [];
  for (let x = 0; x <= cursor; x += 2) {
    const tau = x / velocidad;
    puntos.push(`${x},${(y0 - senal(tau) * amp).toFixed(1)}`);
  }
  const yCursor = y0 - senal(cursor / velocidad) * amp;
  puntos.push(`${cursor},${yCursor.toFixed(1)}`);

  if (frame >= seg(T.e01.corteSilencio)) return <AbsoluteFill style={{ background: COLOR.negro }} />;

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="estela" x1="0" x2={cursor} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={COLOR.rojo} stopOpacity="0.15" />
            <stop offset="0.7" stopColor={COLOR.rojo} stopOpacity="0.7" />
            <stop offset="1" stopColor={COLOR.rojo} stopOpacity="1" />
          </linearGradient>
          <filter id="halo" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polyline points={puntos.join(' ')} fill="none" stroke="url(#estela)" strokeWidth={3} strokeLinejoin="round" filter="url(#halo)" />
        <circle cx={cursor} cy={yCursor} r={5} fill={COLOR.hueso} />
        <circle cx={cursor} cy={yCursor} r={16} fill={COLOR.rojo} opacity={0.25} />
      </svg>
    </AbsoluteFill>
  );
};
