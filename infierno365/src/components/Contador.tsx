import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLOR } from '../constants/brand';
import { estiloDisplay } from './Texto';

const formato = new Intl.NumberFormat('es-MX');

/**
 * Contador de 0 a `hasta` con desaceleración final (ease-out quíntico).
 * Cada carácter ocupa una celda fija para que el número no "baile".
 */
export const Contador: React.FC<{
  hasta: number;
  desde: number;
  duracion: number;
  tamano: number;
  color?: string;
}> = ({ hasta, desde, duracion, tamano, color = COLOR.hueso }) => {
  const frame = useCurrentFrame();
  const valor = Math.round(
    interpolate(frame, [desde, desde + duracion], [0, hasta], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.poly(5)),
    }),
  );
  const texto = formato.format(valor);
  return (
    <div style={{ ...estiloDisplay(tamano, color), display: 'flex', justifyContent: 'center' }}>
      {texto.split('').map((ch, i) => (
        <span key={i} style={{ display: 'inline-block', width: ch === ',' ? '0.24em' : '0.47em', textAlign: 'center' }}>
          {ch}
        </span>
      ))}
    </div>
  );
};
