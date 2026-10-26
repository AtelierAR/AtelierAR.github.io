import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLOR, FUENTE} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {Pizarra} from '../../components/Pizarra';
import {Costura} from '../../components/Costura';
import {Texto, usarEntrada} from '../../components/Texto';

// 03 · LA AFICIÓN MÁS JOVEN — la pizarra rueda de 60 (pasado) a 35 (hoy).
export const Escena03MasJoven: React.FC = () => {
  const frame = useCurrentFrame();
  const c = COPY_AFICION.edad;
  const giro = interpolate(frame, [52, 86], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pNum = usarEntrada(14);
  const hoy = giro > 0.6;
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center'}}>
        <Texto desde={6} tamano={44} display={false} peso={700} espaciado="0.14em">
          {c.etiqueta}
        </Texto>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 210,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 30,
          opacity: pNum,
        }}
      >
        <Pizarra
          desde={String(c.antes)}
          hasta={String(c.hoy)}
          progreso={giro}
          tamano={440}
          colorDesde={COLOR.ceniza}
          colorHasta={COLOR.rojo}
        />
        <div style={{fontFamily: FUENTE.texto, fontWeight: 700, fontSize: 48, color: COLOR.hueso, marginBottom: 70, letterSpacing: '0.1em'}}>
          {c.unidad}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 690,
          textAlign: 'center',
          fontFamily: FUENTE.texto,
          fontWeight: 700,
          fontSize: 40,
          letterSpacing: '0.2em',
          color: COLOR.hueso,
          opacity: pNum,
        }}
      >
        {hoy ? c.tagHoy : c.tagAntes}
      </div>
      <Costura x={560} y={790} ancho={800} progreso={interpolate(frame, [70, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <div style={{position: 'absolute', left: 96, right: 96, top: 860, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 28}}>
        <Texto desde={96} tamano={130} color={COLOR.rojo}>
          {c.menores45}%
        </Texto>
        <Texto desde={102} tamano={76}>
          {c.remate}
        </Texto>
      </div>
    </AbsoluteFill>
  );
};
