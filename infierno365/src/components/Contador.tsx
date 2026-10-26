import React from 'react';
import {interpolate, Easing} from 'remotion';
import {COLOR, FUENTE} from '../constants/brand';

/** Formato es-MX con coma de miles, independiente del navegador. */
export const miles = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Contador que recorre una lista de etapas. `tramos` son frames
 * [inicio, fin] de cada transición (una menos que las etapas).
 */
export const valorContador = (frame: number, etapas: readonly number[], tramos: [number, number][]) => {
  let v = etapas[0];
  tramos.forEach(([a, b], i) => {
    if (frame >= a) {
      v = interpolate(frame, [a, b], [etapas[i], etapas[i + 1]], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  });
  return v;
};

export const Contador: React.FC<{
  valor: number;
  tamano: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({valor, tamano, color = COLOR.hueso, style}) => (
  <div
    style={{
      fontFamily: FUENTE.display,
      fontSize: tamano,
      lineHeight: 1,
      color,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.01em',
      ...style,
    }}
  >
    {miles(valor)}
  </div>
);
