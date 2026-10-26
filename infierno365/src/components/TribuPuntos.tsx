import React from 'react';
import {interpolateColors} from 'remotion';
import {COLOR} from '../constants/brand';
import {GRADA, PUNTOS_GRADA, Punto} from './Grada';

export const NUM_TRIBUS = 6;
const ANGULO_DORADO = Math.PI * (3 - Math.sqrt(5));

/** Tribu de cada asiento: dos secciones contiguas por tribu. */
export const tribuDe = (p: Punto) =>
  Math.floor((p.seccion * NUM_TRIBUS) / GRADA.secciones);

// Índice de cada asiento dentro de su tribu (para la espiral).
const indiceEnTribu: number[] = (() => {
  const cuenta = new Array(NUM_TRIBUS).fill(0);
  return PUNTOS_GRADA.map((p) => cuenta[tribuDe(p)]++);
})();

/**
 * Los asientos de la grada se reagrupan en seis constelaciones (espiral
 * de girasol). `migracion[i]` 0–1 por tribu; `activa[i]` 0–1 la enciende
 * en rojo.
 */
export const TribuPuntos: React.FC<{
  origen: {cx: number; cy: number; escala: number};
  centros: {x: number; y: number}[];
  migracion: number[];
  activa: number[];
  colorOrigen: (p: Punto) => string;
}> = ({origen, centros, migracion, activa, colorOrigen}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    {PUNTOS_GRADA.map((p) => {
      const t = tribuDe(p);
      const k = indiceEnTribu[p.indice];
      const m = migracion[t];
      const ox = origen.cx + p.x * origen.escala;
      const oy = origen.cy + p.y * origen.escala;
      const r = 8.2 * Math.sqrt(k + 0.5);
      const a = k * ANGULO_DORADO;
      const dx = centros[t].x + Math.cos(a) * r;
      const dy = centros[t].y + Math.sin(a) * r;
      // Trayectoria curva: un arco suave en lugar de línea recta.
      const curva = Math.sin(m * Math.PI) * 40 * (k % 2 === 0 ? 1 : -1);
      const x = ox + (dx - ox) * m + curva * 0.3;
      const y = oy + (dy - oy) * m - curva;
      const enReposo = interpolateColors(m, [0, 1], [colorOrigen(p), '#8A8986']);
      const color = interpolateColors(activa[t], [0, 1], [enReposo, COLOR.rojo]);
      return <circle key={p.indice} cx={x} cy={y} r={3.4 + activa[t] * 0.6} fill={color} />;
    })}
  </svg>
);
