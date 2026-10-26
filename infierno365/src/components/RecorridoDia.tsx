import React from 'react';
import {COLOR, FUENTE} from '../constants/brand';

export type Tramo = {nombre: string; min: number; juego?: boolean};

/**
 * Línea de tiempo horizontal de una visita. `progreso` 0–1 recorre de
 * izquierda a derecha: cada tramo se ilumina y su etiqueta aparece al
 * pasar. El tramo JUEGO es más alto y rojo; todo lo demás también cuenta.
 */
export const RecorridoDia: React.FC<{
  x: number;
  y: number;
  ancho: number;
  tramos: readonly Tramo[];
  progreso: number;
  inicio: string;
  fin: string;
}> = ({x, y, ancho, tramos, progreso, inicio, fin}) => {
  const total = tramos.reduce((a, t) => a + t.min, 0);
  const cabeza = x + ancho * Math.max(0, Math.min(1, progreso));
  let acumulado = 0;
  const hueco = 4;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={x} y1={y} x2={x + ancho} y2={y} stroke={COLOR.grafito} strokeWidth={2} />
      {tramos.map((t, i) => {
        const x0 = x + (acumulado / total) * ancho;
        acumulado += t.min;
        const x1 = x + (acumulado / total) * ancho;
        const llenado = Math.max(0, Math.min(1, (cabeza - x0) / (x1 - x0)));
        const alto = t.juego ? 64 : 26;
        const centro = (x0 + x1) / 2;
        const arriba = i % 2 === 0;
        const visibleEtiqueta = Math.max(0, Math.min(1, (cabeza - centro) / 40 + 0.4));
        const lineas = t.nombre.split('\n');
        const tamano = 40;
        const yEtiqueta = arriba ? y - 92 - (lineas.length - 1) * tamano : y + 110;
        const ancla = i === 0 ? 'start' : i === tramos.length - 1 ? 'end' : 'middle';
        const xEtiqueta = i === 0 ? x0 : i === tramos.length - 1 ? x1 : centro;
        return (
          <g key={t.nombre}>
            <rect
              x={x0 + hueco / 2}
              y={y - alto / 2}
              width={Math.max(0, x1 - x0 - hueco)}
              height={alto}
              fill="none"
              stroke={COLOR.grafito}
              strokeWidth={2}
            />
            <rect
              x={x0 + hueco / 2}
              y={y - alto / 2}
              width={Math.max(0, (x1 - x0 - hueco) * llenado)}
              height={alto}
              fill={t.juego ? COLOR.rojo : COLOR.hueso}
            />
            <line
              x1={centro}
              y1={arriba ? y - alto / 2 - 10 : y + alto / 2 + 10}
              x2={centro}
              y2={arriba ? y - 64 : y + 64}
              stroke={t.juego ? COLOR.rojo : COLOR.hueso}
              strokeWidth={2}
              opacity={visibleEtiqueta}
            />
            <text
              x={xEtiqueta}
              y={yEtiqueta}
              textAnchor={ancla}
              fontFamily={FUENTE.display}
              fontSize={tamano}
              letterSpacing="0.02em"
              fill={COLOR.hueso}
              opacity={visibleEtiqueta}
            >
              {lineas.map((l, k) => (
                <tspan key={k} x={xEtiqueta} dy={k === 0 ? 0 : tamano * 1.05}>
                  {l}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
      <circle cx={cabeza} cy={y} r={progreso > 0 && progreso < 1 ? 10 : 0} fill={COLOR.hueso} />
      <text x={x} y={y + 230} fontFamily={FUENTE.texto} fontWeight={700} fontSize={40} fill={COLOR.hueso}>
        {inicio}
      </text>
      <text x={x + ancho} y={y + 230} textAnchor="end" fontFamily={FUENTE.texto} fontWeight={700} fontSize={40} fill={COLOR.hueso}>
        {fin}
      </text>
    </svg>
  );
};
