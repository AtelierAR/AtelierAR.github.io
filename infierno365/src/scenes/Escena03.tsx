import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, ROJO_TEXTO, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Brasas } from '../components/Brasas';
import { Contador } from '../components/Contador';
import { FileteDiagonal } from '../components/Lineas';
import { estiloDisplay, Golpe, Revelar } from '../components/Texto';
import { entrada, lerp } from '../components/utilidades';

/** 03 · EL RÉCORD — contador 0 → 592,153 que se asienta como «592 MIL». */
export const Escena03: React.FC = () => {
  const frame = useCurrentFrame();
  const fGolpe = seg(T.e03.golpe);
  const fTachado = seg(T.e03.tachado);
  const tachado = entrada(frame, fTachado, 14);
  const brasas = entrada(frame, 0, 60);
  const resplandor = frame >= fGolpe ? Math.max(0, 1 - (frame - fGolpe) / 24) : 0;

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Brasas cantidad={36} semilla="e03" intensidad={0.6 * brasas} />
      <FileteDiagonal desde={seg(T.e03.anio1967)} x={1500} opacidad={0.5} />
      {/* resplandor rojo profundo del golpe (un solo pulso) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 34%, rgba(142,10,20,${0.55 * resplandor}) 0%, rgba(11,11,11,0) 60%)`,
        }}
      />
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        {frame < fGolpe ? (
          <Contador hasta={COPY.record.asistencia} desde={6} duracion={fGolpe - 6} tamano={300} />
        ) : (
          <Golpe en={fGolpe}>
            <div style={{ ...estiloDisplay(340, ROJO_TEXTO), textAlign: 'center' }}>{COPY.record.asentado}</div>
          </Golpe>
        )}
      </div>

      <div style={{ position: 'absolute', top: 530, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 120 }}>
        <Revelar desde={seg(T.e03.anio1967)}>
          <div style={{ position: 'relative' }}>
            <div style={{ ...estiloDisplay(160), opacity: lerp(1, 0.55, tachado) }}>{COPY.record.anioAnterior}</div>
            {/* tachado a 18°: el contenedor gira sobre su centro y la línea crece desde la izquierda */}
            <div style={{ position: 'absolute', left: -20, right: -20, top: '50%', height: 6, marginTop: -3, transform: 'rotate(-18deg)' }}>
              <div style={{ height: '100%', background: COLOR.rojo, transform: `scaleX(${tachado})`, transformOrigin: 'left center' }} />
            </div>
          </div>
        </Revelar>
        <Revelar desde={seg(T.e03.anio2025)}>
          <div style={{ ...estiloDisplay(160) }}>{COPY.record.anioNuevo}</div>
        </Revelar>
      </div>

      <div style={{ position: 'absolute', top: 800, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Revelar desde={seg(T.e03.texto)}>
          <div style={{ ...estiloDisplay(96) }}>{COPY.record.texto}</div>
        </Revelar>
      </div>
    </AbsoluteFill>
  );
};
