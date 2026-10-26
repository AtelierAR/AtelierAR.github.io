import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLOR} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {RecorridoDia} from '../../components/RecorridoDia';
import {Filete} from '../../components/Filete';
import {Texto, usarEntrada} from '../../components/Texto';

// 07 · UN DÍA EN EL INFIERNO — 4:52 de visita, el juego es solo un tramo.
export const Escena07UnDia: React.FC = () => {
  const frame = useCurrentFrame();
  const c = COPY_AFICION.dia;
  const progreso = interpolate(frame, [30, 245], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <div style={{position: 'absolute', left: 96, top: 70}}>
        <Texto desde={6} tamano={84}>
          {c.titulo}
        </Texto>
      </div>
      <RecorridoDia x={120} y={500} ancho={1680} tramos={c.tramos} progreso={progreso} inicio={c.inicio} fin={c.fin} />
      <div style={{position: 'absolute', left: 96, top: 800}}>
        <Texto desde={250} tamano={80}>
          {c.remate1}
        </Texto>
        <Texto desde={262} tamano={80} style={{marginTop: 6}}>
          {c.remate2}
        </Texto>
      </div>
      <Filete x={96} y={790} ancho={420} progreso={usarEntrada(250)} />
    </AbsoluteFill>
  );
};
