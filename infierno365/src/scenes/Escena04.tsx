import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, ROJO_TEXTO, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Brasas } from '../components/Brasas';
import { Costura, Filete } from '../components/Lineas';
import { Rodillo } from '../components/Pizarra';
import { estiloDisplay, estiloTexto, Revelar } from '../components/Texto';
import { tramo } from '../components/utilidades';

/** 04 · LA NUEVA AFICIÓN — «60» gira como rodillo de pizarra hasta «35». */
export const Escena04: React.FC = () => {
  const frame = useCurrentFrame();
  const fRodillo = seg(T.e04.rodillo);
  const cambio = tramo(frame, fRodillo + 10, fRodillo + 22);
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Brasas cantidad={30} semilla="e04" intensidad={0.5} />
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {/* etiqueta ANTES → HOY */}
        <div style={{ position: 'relative', height: 48, width: 400 }}>
          <div style={{ ...estiloTexto(40), position: 'absolute', inset: 0, textAlign: 'center', opacity: 1 - cambio, transform: `translateY(${-cambio * 20}px)` }}>
            {COPY.aficion.etiquetaAntes}
          </div>
          <div style={{ ...estiloTexto(40), position: 'absolute', inset: 0, textAlign: 'center', opacity: cambio, transform: `translateY(${(1 - cambio) * 20}px)` }}>
            {COPY.aficion.etiquetaHoy}
          </div>
        </div>
        <Filete desde={4} ancho={120} />
        <Rodillo
          de={COPY.aficion.edadAntes}
          a={COPY.aficion.edadHoy}
          desde={fRodillo}
          duracion={seg(T.e04.durRodillo)}
          tamano={440}
          colorInicial={COLOR.hueso}
          colorFinal={ROJO_TEXTO}
        />
      </div>
      <div style={{ position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Costura desde={seg(T.e04.texto) - 6} ancho={560} />
      </div>
      <div style={{ position: 'absolute', top: 830, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Revelar desde={seg(T.e04.texto)}>
          <div style={{ ...estiloDisplay(96) }}>{COPY.aficion.texto}</div>
        </Revelar>
      </div>
    </AbsoluteFill>
  );
};
