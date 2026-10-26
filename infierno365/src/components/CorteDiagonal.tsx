import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {ANGULO_CORTE, VIDEO} from '../constants/brand';

/**
 * Entrada de escena con un corte diagonal a 18°: el contenido se revela
 * detrás de un borde inclinado que barre de izquierda a derecha.
 */
export const CorteDiagonal: React.FC<{
  children: React.ReactNode;
  duracion?: number;
}> = ({children, duracion = 14}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, duracion], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.7, 0, 0.2, 1),
  });
  if (t >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const inclinacion = Math.tan((ANGULO_CORTE * Math.PI) / 180) * VIDEO.alto;
  const borde = -inclinacion + t * (VIDEO.ancho + inclinacion * 2);
  const clip = `polygon(0 0, ${borde + inclinacion}px 0, ${borde}px 100%, 0 100%)`;
  return <AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>;
};
