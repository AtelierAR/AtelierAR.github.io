import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Brasas } from '../components/Brasas';
import { Filete } from '../components/Lineas';
import { estiloDisplay, estiloTexto, Revelar } from '../components/Texto';
import { lerp, mezclar, tramo } from '../components/utilidades';

/** 06 · EL VERANO FRÍO — la paleta se desatura a gris ceniza; las brasas caen como ceniza. */
export const Escena06: React.FC = () => {
  const frame = useCurrentFrame();
  const d0 = seg(T.e06.desaturar);
  const d1 = d0 + seg(T.e06.durDesaturar);
  const frio = tramo(frame, d0, d1);
  const ceniza = useCallback((f: number) => tramo(f, d0, d1), [d0, d1]);
  const rojo = mezclar(COLOR.rojo, COLOR.ceniza, frio);
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      {/* horizonte encendido que se enfría */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 115%, ${mezclar(COLOR.rojoProfundo, COLOR.grafito, frio)} 0%, rgba(11,11,11,0) 70%)`,
          opacity: lerp(0.9, 0.6, frio),
        }}
      />
      <Brasas cantidad={70} semilla="e06" intensidad={0.9} ceniza={ceniza} />

      <div style={{ position: 'absolute', left: 120, top: 200, width: 1680 }}>
        <Revelar desde={seg(T.e06.texto)}>
          <div style={{ ...estiloDisplay(150), lineHeight: 1.06 }}>{COPY.frio.texto}</div>
        </Revelar>
      </div>

      <div style={{ position: 'absolute', left: 120, top: 640, display: 'flex', alignItems: 'center', gap: 48 }}>
        <Filete desde={seg(T.e06.dato) - 6} ancho={120} color={rojo} />
        <Revelar desde={seg(T.e06.dato)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 40 }}>
            <div style={{ ...estiloDisplay(190) }}>{COPY.frio.datoCifra}</div>
            <div style={{ ...estiloTexto(44) }}>{COPY.frio.datoContexto}</div>
          </div>
        </Revelar>
      </div>
    </AbsoluteFill>
  );
};
