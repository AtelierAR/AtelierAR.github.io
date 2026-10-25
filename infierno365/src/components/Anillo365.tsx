import React from 'react';
import { COLOR } from '../constants/brand';
import { mezclar } from './utilidades';

/**
 * Anillo de N marcas radiales (365 por defecto). `progreso` (0–1) indica cuántas
 * se han llenado de rojo, en sentido horario desde las 12.
 */
export const Anillo365: React.FC<{
  cx: number;
  cy: number;
  radio: number;
  progreso: number;
  marcas?: number;
  largo?: number;
  /** 0 = gris (sin color), 1 = rojo pleno: para el regreso del color. */
  color?: number;
  opacidad?: number;
}> = ({ cx, cy, radio, progreso, marcas = 365, largo = 34, color = 1, opacidad = 1 }) => {
  const llenas = progreso * marcas;
  const rojo = mezclar(COLOR.ceniza, COLOR.rojo, color);
  return (
    <g opacity={opacidad}>
      {Array.from({ length: marcas }, (_, i) => {
        const a = (i / marcas) * Math.PI * 2 - Math.PI / 2;
        // Cada 30 marcas (≈ un mes) la marca es más larga.
        const l = i % 30 === 0 ? largo * 1.45 : largo;
        const r1 = radio - l / 2;
        const r2 = radio + l / 2;
        const llena = i < llenas;
        // La punta del llenado tiene un brillo suave.
        const punta = llena && llenas - i < 6;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke={llena ? (punta ? mezclar(COLOR.rojo, COLOR.hueso, 0.5 * color) : rojo) : COLOR.grafito}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

/** Arco SVG (ángulos en grados, 0° = las 12, sentido horario). */
export const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  };
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1}`;
};
