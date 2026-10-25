import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { arco } from '../components/Anillo365';
import { Filete } from '../components/Lineas';
import { estiloDisplay, estiloTexto, Revelar } from '../components/Texto';
import { entrada } from '../components/utilidades';

/** 07 · SEIS MESES EN SILENCIO — anillo de 12 meses: abril–septiembre en rojo, el resto en gris punteado. */
export const Escena07: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = 560;
  const cy = 540;
  const r = 300;
  const hueco = 3; // grados de separación entre meses
  const desde = seg(T.e07.anillo);
  const pasoMes = seg(T.e07.durAnillo) / 12;
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {COPY.meses.nombres.map((mes, i) => {
          const p = entrada(frame, desde + i * pasoMes, 14);
          const a0 = i * 30 + hueco / 2;
          const a1 = a0 + (30 - hueco) * p;
          const temporada = i < COPY.meses.mesesTemporada;
          const medio = ((i * 30 + 15 - 90) * Math.PI) / 180;
          return (
            <g key={mes}>
              {p > 0.01 && (
                <path
                  d={arco(cx, cy, r, a0, a1)}
                  fill="none"
                  stroke={temporada ? COLOR.rojo : COLOR.ceniza}
                  strokeWidth={temporada ? 26 : 6}
                  strokeDasharray={temporada ? undefined : '2 14'}
                  strokeLinecap={temporada ? 'butt' : 'round'}
                />
              )}
              <text
                x={cx + Math.cos(medio) * (r + 70)}
                y={cy + Math.sin(medio) * (r + 70)}
                fill={COLOR.hueso}
                fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
                fontWeight={600}
                fontSize={36}
                letterSpacing="0.04em"
                textAnchor="middle"
                dominantBaseline="central"
                opacity={p}
              >
                {mes}
              </text>
            </g>
          );
        })}
        {/* marca de "hoy": los 6 meses de juego frente a los 12 de la ciudad */}
        <text x={cx} y={cy - 20} fill={COLOR.hueso} fontFamily="Anton, Impact, sans-serif" fontSize={190} textAnchor="middle" dominantBaseline="central" opacity={entrada(frame, desde + seg(T.e07.durAnillo), 20)}>
          6/12
        </text>
      </svg>
      {/* leyenda */}
      <div style={{ position: 'absolute', left: cx - 230, top: cy + 110, display: 'flex', flexDirection: 'column', gap: 14, opacity: entrada(frame, desde + seg(T.e07.durAnillo), 20) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...estiloTexto(36) }}>
          <span style={{ width: 40, height: 14, background: COLOR.rojo, display: 'inline-block' }} />
          {COPY.meses.leyendaTemporada}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...estiloTexto(36) }}>
          <span style={{ width: 40, height: 0, borderTop: `4px dotted ${COLOR.ceniza}`, display: 'inline-block' }} />
          {COPY.meses.leyendaSilencio}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1080, top: 330, width: 760, display: 'flex', flexDirection: 'column', gap: 36 }}>
        <Filete desde={seg(T.e07.texto) - 6} ancho={140} />
        <Revelar desde={seg(T.e07.texto)}>
          <div style={{ ...estiloDisplay(120), lineHeight: 1.04 }}>{COPY.meses.texto[0]}</div>
        </Revelar>
        <Revelar desde={seg(T.e07.texto) + 24}>
          <div style={{ ...estiloDisplay(120) }}>{COPY.meses.texto[1]}</div>
        </Revelar>
      </div>
    </AbsoluteFill>
  );
};
