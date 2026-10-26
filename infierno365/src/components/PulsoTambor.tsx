import React from 'react';
import {COLOR} from '../constants/brand';

/** Envolvente de golpe: sube instantáneo y decae (frames desde el golpe). */
export const envolventeGolpe = (frame: number, beats: number[]) => {
  let e = 0;
  for (const b of beats) {
    if (frame >= b) e = Math.max(e, Math.exp(-(frame - b) / 6));
  }
  return e;
};

/**
 * Barras que pulsan al ritmo de un tambor. Las barras cambian de altura,
 * no de brillo: no hay destellos.
 */
export const PulsoTambor: React.FC<{
  cx: number;
  cy: number;
  frame: number;
  beats: number[];
  aparicion: number;
}> = ({cx, cy, frame, beats, aparicion}) => {
  const n = 9;
  const ancho = 18;
  const hueco = 12;
  const total = n * ancho + (n - 1) * hueco;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        // Cada barra recibe el golpe con un pequeño retraso: una ola.
        const retraso = Math.abs(i - (n - 1) / 2) * 1.5;
        const e = envolventeGolpe(frame - retraso, beats);
        const base = 30 + 26 * Math.sin(i * 1.7) ** 2;
        const h = (base + e * (110 - Math.abs(i - 4) * 12)) * aparicion;
        const x = cx - total / 2 + i * (ancho + hueco);
        return (
          <rect
            key={i}
            x={x}
            y={cy - h / 2}
            width={ancho}
            height={h}
            fill={i % 3 === 1 ? COLOR.hueso : COLOR.rojo}
          />
        );
      })}
    </g>
  );
};
