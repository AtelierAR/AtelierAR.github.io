import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, ROJO_TEXTO, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Brasas } from '../components/Brasas';
import { Filete, Luminaria } from '../components/Lineas';
import { BarrasCoronas } from '../components/Pizarra';
import { estiloDisplay, estiloTexto, Golpe, Revelar } from '../components/Texto';

/** 05 · DIECIOCHO CORONAS — 18 barras se encienden como pizarra de estadio. */
export const Escena05: React.FC = () => {
  const frame = useCurrentFrame();
  const desde = seg(T.e05.primeraBarra);
  const paso = seg(T.e05.pasoBarra) || 1;
  const fGolpe = seg(T.e05.golpe);
  const total = COPY.coronas.anios.length;
  const encendidas = Math.max(0, Math.min(total, Math.floor((frame - desde) / paso) + 1));
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Luminaria x={260} y={-60} radio={520} intensidad={0.1} />
      <Luminaria x={1660} y={-60} radio={520} intensidad={0.1} fase={2} />
      <Brasas cantidad={30} semilla="e05" intensidad={0.45} />

      {/* Encabezado: número + título */}
      <div style={{ position: 'absolute', top: 70, left: 96, display: 'flex', alignItems: 'flex-end', gap: 48 }}>
        <div style={{ width: 300, textAlign: 'right' }}>
          {frame < fGolpe ? (
            <div style={{ ...estiloDisplay(250, encendidas > 0 ? ROJO_TEXTO : COLOR.grafito) }}>{String(encendidas).padStart(2, '0')}</div>
          ) : (
            <Golpe en={fGolpe} style={{ transformOrigin: 'right bottom' }}>
              <div style={{ ...estiloDisplay(250, ROJO_TEXTO) }}>{COPY.coronas.numero}</div>
            </Golpe>
          )}
        </div>
        <div style={{ paddingBottom: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Revelar desde={8}>
            <div style={{ ...estiloTexto(40) }}>
              {COPY.coronas.desde} → {COPY.coronas.hasta}
            </div>
          </Revelar>
          <Filete desde={10} ancho={160} />
          {frame >= fGolpe && (
            <Golpe en={fGolpe} style={{ transformOrigin: 'left bottom' }}>
              <div style={{ ...estiloDisplay(150) }}>{COPY.coronas.texto}</div>
            </Golpe>
          )}
        </div>
      </div>

      {/* Etiqueta de las dos últimas */}
      <div
        style={{
          position: 'absolute',
          top: 410,
          right: 96,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          ...estiloTexto(40),
          opacity: frame >= fGolpe ? 1 : 0,
        }}
      >
        {COPY.coronas.destacado}
      </div>

      <div style={{ position: 'absolute', top: 480, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <BarrasCoronas
          etiquetas={COPY.coronas.anios}
          desde={desde}
          paso={paso}
          destello={seg(T.e05.destello)}
          destacadas={[total - 2, total - 1]}
          ancho={44}
          separacion={52}
          alto={380}
        />
      </div>
    </AbsoluteFill>
  );
};
