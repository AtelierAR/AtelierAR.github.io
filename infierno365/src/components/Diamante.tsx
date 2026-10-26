import React from 'react';
import {COLOR} from '../constants/brand';

/**
 * Diamante de beisbol en línea blanca que se dibuja (progreso 0–1),
 * con las cuatro bases como pequeños cuadros.
 */
export const Diamante: React.FC<{
  cx: number;
  cy: number;
  radio: number;
  progreso: number;
  color?: string;
  opacidad?: number;
}> = ({cx, cy, radio, progreso, color = COLOR.hueso, opacidad = 1}) => {
  const p = Math.max(0, Math.min(1, progreso));
  const lado = radio * Math.SQRT2;
  const perimetro = lado * 4;
  // Empieza en home (abajo) y sigue en sentido antihorario: 1.ª, 2.ª, 3.ª.
  const d = `M ${cx} ${cy + radio} L ${cx + radio} ${cy} L ${cx} ${cy - radio} L ${cx - radio} ${cy} Z`;
  const bases = [
    [cx, cy + radio],
    [cx + radio, cy],
    [cx, cy - radio],
    [cx - radio, cy],
  ];
  return (
    <g opacity={opacidad}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={perimetro}
        strokeDashoffset={perimetro * (1 - p)}
      />
      {bases.map(([x, y], i) => {
        const visible = p * 4 >= i + 0.05 ? 1 : 0;
        return (
          <rect
            key={i}
            x={x - 7}
            y={y - 7}
            width={14}
            height={14}
            transform={`rotate(45 ${x} ${y})`}
            fill={i === 0 ? COLOR.rojo : color}
            opacity={visible}
          />
        );
      })}
    </g>
  );
};
