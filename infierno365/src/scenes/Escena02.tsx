import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLOR, seg, T } from '../constants/brand';

/** 02 · LA BRASA — silencio; una sola brasa sube desde abajo y deja una estela fina. */
export const Escena02: React.FC = () => {
  const frame = useCurrentFrame();
  const fin = seg(T.e02.subida);
  const posicion = (f: number) => {
    const p = interpolate(f, [6, fin], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    });
    return {
      x: 960 + Math.sin(f / 22) * 26 + Math.sin(f / 9) * 5,
      y: interpolate(p, [0, 1], [1130, 300]),
    };
  };
  const ahora = posicion(frame);
  const estela: string[] = [];
  for (let f = Math.max(0, frame - 40); f <= frame; f++) {
    const p = posicion(f);
    estela.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  const titileo = 0.85 + 0.15 * Math.sin(frame / 5);
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="estelaBrasa" x1="0" y1={ahora.y + 300} x2="0" y2={ahora.y} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={COLOR.rojo} stopOpacity="0" />
            <stop offset="1" stopColor={COLOR.rojo} stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="nucleo">
            <stop offset="0" stopColor={COLOR.hueso} />
            <stop offset="0.35" stopColor={COLOR.rojo} />
            <stop offset="1" stopColor={COLOR.rojo} stopOpacity="0" />
          </radialGradient>
        </defs>
        <polyline points={estela.join(' ')} fill="none" stroke="url(#estelaBrasa)" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={ahora.x} cy={ahora.y} r={40} fill="url(#nucleo)" opacity={0.25 * titileo} />
        <circle cx={ahora.x} cy={ahora.y} r={9} fill="url(#nucleo)" opacity={titileo} />
      </svg>
    </AbsoluteFill>
  );
};
