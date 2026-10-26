import React from 'react';
import {COLOR, FILETE} from '../constants/brand';

/** Filete rojo de 2 px que crece de izquierda a derecha (progreso 0–1). */
export const Filete: React.FC<{
  x: number;
  y: number;
  ancho: number;
  progreso: number;
  color?: string;
  alinear?: 'izquierda' | 'centro';
}> = ({x, y, ancho, progreso, color = COLOR.rojo, alinear = 'izquierda'}) => {
  const w = ancho * Math.max(0, Math.min(1, progreso));
  const left = alinear === 'centro' ? x - w / 2 : x;
  return (
    <div
      style={{position: 'absolute', left, top: y, width: w, height: FILETE, background: color}}
    />
  );
};
