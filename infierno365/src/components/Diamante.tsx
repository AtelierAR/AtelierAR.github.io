import React from 'react';
import { COLOR } from '../constants/brand';
import { arco } from './Anillo365';

/**
 * Diamante de beisbol en línea, centrado en (cx, cy) = montículo.
 *  - `trazo` 0–1: dibuja bases y líneas de foul.
 *  - `outfield` 0–1: dibuja la barda del outfield (de foul a foul).
 *  - `cierre` 0–1: la barda se cierra hasta completar un anillo de 360°.
 * Geometría abstracta, no a escala.
 */
export const Diamante: React.FC<{
  cx: number;
  cy: number;
  escala?: number;
  trazo: number;
  outfield?: number;
  cierre?: number;
  color?: string;
  colorAnillo?: string;
  grosor?: number;
}> = ({ cx, cy, escala = 1, trazo, outfield = 0, cierre = 0, color = COLOR.hueso, colorAnillo = COLOR.hueso, grosor = 2 }) => {
  const b = 120 * escala; // mitad de la diagonal del cuadro
  const home = [cx, cy + b];
  const primera = [cx + b, cy];
  const segunda = [cx, cy - b];
  const tercera = [cx - b, cy];
  const R = 300 * escala; // radio de la barda
  // Las líneas de foul salen de home a ±45° y tocan la barda.
  const foul = (sentido: 1 | -1) => {
    // Intersección de la recta desde home con dirección (±1, −1)/√2 con el círculo (cx, cy, R).
    const dx = (sentido * 1) / Math.SQRT2;
    const dy = -1 / Math.SQRT2;
    const ox = home[0] - cx;
    const oy = home[1] - cy;
    const bq = ox * dx + oy * dy;
    const c = ox * ox + oy * oy - R * R;
    const t = -bq + Math.sqrt(bq * bq - c);
    return [home[0] + dx * t, home[1] + dy * t];
  };
  const fd = foul(1);
  const fi = foul(-1);
  const ang = (p: number[]) => ((Math.atan2(p[1] - cy, p[0] - cx) * 180) / Math.PI + 90 + 360) % 360;
  const aIzq = ang(fi); // ~ 300°
  const aDer = ang(fd); // ~ 60°
  const spanOutfield = (aDer + 360 - aIzq) % 360;

  const cuadro = `M ${home[0]} ${home[1]} L ${primera[0]} ${primera[1]} L ${segunda[0]} ${segunda[1]} L ${tercera[0]} ${tercera[1]} Z`;
  const lineasFoul = `M ${fi[0]} ${fi[1]} L ${home[0]} ${home[1]} L ${fd[0]} ${fd[1]}`;
  const perimetroCuadro = 4 * b * Math.SQRT2;
  const largoFoul = 2 * Math.hypot(fd[0] - home[0], fd[1] - home[1]);

  // Barda: de foul izquierdo a foul derecho por arriba; luego se cierra por abajo.
  const a1 = aIzq + spanOutfield * outfield;
  const resto = 360 - spanOutfield;
  const a2 = aDer + resto * cierre;

  const base = (p: number[], k: number) => (
    <rect
      x={p[0] - 9 * escala}
      y={p[1] - 9 * escala}
      width={18 * escala}
      height={18 * escala}
      transform={`rotate(45 ${p[0]} ${p[1]})`}
      fill={color}
      opacity={trazo > 0.25 * (k + 1) ? 1 : 0}
    />
  );

  return (
    <g fill="none" strokeLinecap="round">
      <path d={cuadro} stroke={color} strokeWidth={grosor} strokeDasharray={perimetroCuadro} strokeDashoffset={perimetroCuadro * (1 - trazo)} />
      <path d={lineasFoul} stroke={color} strokeWidth={grosor} strokeDasharray={largoFoul} strokeDashoffset={largoFoul * (1 - trazo)} opacity={0.85} />
      <circle cx={cx} cy={cy} r={10 * escala} stroke={color} strokeWidth={grosor} opacity={trazo} />
      {base(primera, 0)}
      {base(segunda, 1)}
      {base(tercera, 2)}
      {/* home */}
      <path
        d={`M ${home[0] - 10 * escala} ${home[1] - 6 * escala} h ${20 * escala} v ${8 * escala} l ${-10 * escala} ${10 * escala} l ${-10 * escala} ${-10 * escala} Z`}
        fill={color}
        opacity={trazo > 0.05 ? 1 : 0}
      />
      {outfield > 0.001 && <path d={arco(cx, cy, R, aIzq, a1)} stroke={colorAnillo} strokeWidth={grosor + 1} />}
      {cierre > 0.001 && <path d={arco(cx, cy, R, aDer, a2)} stroke={colorAnillo} strokeWidth={grosor + 1} />}
    </g>
  );
};
