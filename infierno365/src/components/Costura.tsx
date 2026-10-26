import React from 'react';
import {COLOR} from '../constants/brand';

/**
 * Costura de pelota: una curva suave con puntadas en "V" que se dibuja
 * según `progreso` (0–1). Se usa como separador y como trazo de transición.
 */
export const Costura: React.FC<{
  x: number;
  y: number;
  ancho: number;
  progreso: number;
  amplitud?: number;
  color?: string;
}> = ({x, y, ancho, progreso, amplitud = 18, color = COLOR.rojo}) => {
  const p = Math.max(0, Math.min(1, progreso));
  const d = `M 0 ${amplitud} C ${ancho * 0.25} ${-amplitud} ${ancho * 0.75} ${amplitud * 3} ${ancho} ${amplitud}`;
  const largo = ancho * 1.08;
  const puntadas = Math.floor(ancho / 28);
  const curva = (t: number) => {
    // Bézier cúbica evaluada en t
    const p0 = [0, amplitud];
    const p1 = [ancho * 0.25, -amplitud];
    const p2 = [ancho * 0.75, amplitud * 3];
    const p3 = [ancho, amplitud];
    const u = 1 - t;
    const bx = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const by = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    return [bx, by];
  };
  return (
    <svg
      style={{position: 'absolute', left: x, top: y - amplitud * 2, overflow: 'visible'}}
      width={ancho}
      height={amplitud * 4}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={largo}
        strokeDashoffset={largo * (1 - p)}
      />
      {new Array(puntadas).fill(0).map((_, i) => {
        const t = (i + 0.5) / puntadas;
        if (t > p) return null;
        const [cx, cy] = curva(t);
        return (
          <path
            key={i}
            d={`M ${cx - 7} ${cy - 10} L ${cx + 1} ${cy - 3} M ${cx - 7} ${cy + 10} L ${cx + 1} ${cy + 3}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
};
