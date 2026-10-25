import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLOR, VISUAL } from '../constants/brand';
import { estiloTexto } from './Texto';
import { entrada, lerp } from './utilidades';

export type Nodo = {
  etiqueta: string;
  /** Ángulo en grados (0° = las 12, horario) y distancia al centro. Posiciones ABSTRACTAS. */
  angulo: number;
  distancia: number;
  /** Lado del texto respecto del nodo. */
  lado: 'izq' | 'der';
};

/**
 * Mapa abstracto del distrito: nodos etiquetados alrededor del estadio y líneas
 * rojas que los conectan con el centro. Nunca calcado de un mapa real.
 */
export const MapaDistrito: React.FC<{
  cx: number;
  cy: number;
  nodos: Nodo[];
  desdeNodos: number;
  pasoNodo: number;
  desdeLineas: number;
  radioCentro: number;
}> = ({ cx, cy, nodos, desdeNodos, pasoNodo, desdeLineas, radioCentro }) => {
  const frame = useCurrentFrame();
  const pos = (n: Nodo) => {
    const a = ((n.angulo - 90) * Math.PI) / 180;
    return { x: cx + Math.cos(a) * n.distancia, y: cy + Math.sin(a) * n.distancia, a };
  };
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {nodos.map((n, i) => {
          const { x, y, a } = pos(n);
          const pl = entrada(frame, desdeLineas + i * 6, 34);
          // La línea va del nodo hacia el borde del anillo central.
          const x2 = cx + Math.cos(a) * radioCentro;
          const y2 = cy + Math.sin(a) * radioCentro;
          const largo = Math.hypot(x - x2, y - y2);
          const pn = entrada(frame, desdeNodos + i * pasoNodo, 20);
          return (
            <g key={n.etiqueta}>
              <line
                x1={x}
                y1={y}
                x2={x2}
                y2={y2}
                stroke={COLOR.rojo}
                strokeWidth={VISUAL.filete}
                strokeDasharray={largo}
                strokeDashoffset={largo * (1 - pl)}
              />
              {/* pulso que viaja por la línea una sola vez */}
              {pl > 0.05 && pl < 0.98 && (
                <circle cx={lerp(x, x2, pl)} cy={lerp(y, y2, pl)} r={4} fill={COLOR.hueso} />
              )}
              <circle cx={x} cy={y} r={lerp(0, 22, pn)} fill="none" stroke={COLOR.hueso} strokeWidth={2} opacity={pn} />
              <circle cx={x} cy={y} r={lerp(0, 7, pn)} fill={pl > 0.98 ? COLOR.rojo : COLOR.hueso} />
            </g>
          );
        })}
      </svg>
      {nodos.map((n, i) => {
        const { x, y } = pos(n);
        const pn = entrada(frame, desdeNodos + i * pasoNodo + 4, 20);
        const desplaz = lerp(n.lado === 'der' ? -16 : 16, 0, pn);
        return (
          <div
            key={n.etiqueta}
            style={{
              position: 'absolute',
              top: y - 22,
              ...(n.lado === 'der' ? { left: x + 40 } : { right: 1920 - x + 40 }),
              ...estiloTexto(36),
              whiteSpace: 'nowrap',
              opacity: pn,
              transform: `translateX(${desplaz}px)`,
              textAlign: n.lado === 'der' ? 'left' : 'right',
            }}
          >
            {n.etiqueta}
          </div>
        );
      })}
    </>
  );
};
