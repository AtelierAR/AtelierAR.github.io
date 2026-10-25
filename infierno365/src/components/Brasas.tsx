import React, { useMemo } from 'react';
import { random, useCurrentFrame } from 'remotion';
import { ALTO, ANCHO, COLOR } from '../constants/brand';
import { lerp, mezclar } from './utilidades';

type Props = {
  cantidad?: number;
  semilla?: string;
  /** Opacidad general (0–1). */
  intensidad?: number;
  /** 0 = brasa que sube, 1 = ceniza gris que cae. Función del cuadro local. */
  ceniza?: (frame: number) => number;
  /** Cuadro a partir del cual todo queda inmóvil. */
  congelarEn?: number;
};

type Particula = { x: number; y: number; r: number; v: number; fase: number; amp: number; brillo: number };

/**
 * Brasas que suben (o ceniza que cae). Posiciones deterministas: se integra la
 * velocidad cuadro a cuadro para que el cambio brasa → ceniza sea continuo.
 */
export const Brasas: React.FC<Props> = ({
  cantidad = 48,
  semilla = 'brasas',
  intensidad = 1,
  ceniza,
  congelarEn = Infinity,
}) => {
  const frame = Math.min(useCurrentFrame(), congelarEn);

  const particulas = useMemo<Particula[]>(
    () =>
      Array.from({ length: cantidad }, (_, i) => ({
        x: random(`${semilla}-x-${i}`) * ANCHO,
        y: random(`${semilla}-y-${i}`) * ALTO,
        r: 1.2 + random(`${semilla}-r-${i}`) * 2.6,
        v: 0.9 + random(`${semilla}-v-${i}`) * 2.2,
        fase: random(`${semilla}-f-${i}`) * Math.PI * 2,
        amp: 6 + random(`${semilla}-a-${i}`) * 22,
        brillo: 0.35 + random(`${semilla}-b-${i}`) * 0.65,
      })),
    [cantidad, semilla],
  );

  // Desplazamiento vertical acumulado (unidades de velocidad) y estado de ceniza.
  const { acumSubida, acumCaida, c } = useMemo(() => {
    let sub = 0;
    let caida = 0;
    for (let f = 0; f < frame; f++) {
      const k = ceniza ? ceniza(f) : 0;
      sub += 1 - k;
      caida += k;
    }
    return { acumSubida: sub, acumCaida: caida, c: ceniza ? ceniza(frame) : 0 };
  }, [frame, ceniza]);

  const margen = 40;
  const alto = ALTO + margen * 2;

  return (
    <svg width={ANCHO} height={ALTO} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id={`brillo-${semilla}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={c < 0.9 ? `url(#brillo-${semilla})` : undefined}>
        {particulas.map((p, i) => {
          // Sube con su velocidad; como ceniza cae más lento y deriva.
          const dy = -acumSubida * p.v + acumCaida * p.v * 0.55;
          let y = (p.y + dy + margen) % alto;
          if (y < 0) y += alto;
          y -= margen;
          const x = p.x + Math.sin(frame / 38 + p.fase) * p.amp * lerp(1, 1.8, c);
          // Las brasas se enfrían al subir (más tenues arriba).
          const altura = 1 - y / ALTO;
          const opBrasa = p.brillo * lerp(1, 0.25, altura);
          const titileo = 0.85 + 0.15 * Math.sin(frame / 7 + p.fase * 3);
          const op = lerp(opBrasa * titileo, p.brillo * 0.55, c) * intensidad;
          const color = mezclar(i % 6 === 0 ? COLOR.hueso : COLOR.rojo, COLOR.ceniza, c);
          return <circle key={i} cx={x} cy={y} r={lerp(p.r, p.r * 0.8, c)} fill={color} opacity={op} />;
        })}
      </g>
    </svg>
  );
};
