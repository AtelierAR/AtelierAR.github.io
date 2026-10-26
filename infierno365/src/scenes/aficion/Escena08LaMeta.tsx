import React from 'react';
import {AbsoluteFill, interpolate, Easing, useCurrentFrame} from 'remotion';
import {COLOR, FUENTE} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {Grada} from '../../components/Grada';
import {Contador} from '../../components/Contador';
import {Filete} from '../../components/Filete';
import {Brasas} from '../../components/Brasas';
import {Texto, usarEntrada} from '../../components/Texto';
import {GRADA_IZQUIERDA} from './comun';

// 08 · LA META — de 14,443 a 17,000 por juego; la grada llega al 85 %.
export const Escena08LaMeta: React.FC = () => {
  const frame = useCurrentFrame();
  const c = COPY_AFICION.meta;
  const t = interpolate(frame, [24, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  const valor = interpolate(t, [0, 1], [c.desde, c.hasta]);
  const encendido = interpolate(t, [0, 1], [c.ocupacionHoy / 100, c.ocupacionMeta / 100]);
  const columna = 1040;
  const pMeta = usarEntrada(110);
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <Brasas cantidad={18} intensidad={0.45} semilla="meta" />
      <Grada {...GRADA_IZQUIERDA} encendido={encendido} />
      <div style={{position: 'absolute', left: 96, top: 60}}>
        <Texto desde={4} tamano={72}>
          {c.titulo}
        </Texto>
      </div>
      <div style={{position: 'absolute', left: columna, top: 210, opacity: usarEntrada(10)}}>
        <Contador valor={valor} tamano={230} color={t >= 1 ? COLOR.rojo : COLOR.hueso} />
      </div>
      <Filete x={columna} y={490} ancho={760} progreso={t} />
      <div style={{position: 'absolute', left: columna, top: 512, opacity: usarEntrada(10)}}>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 700, fontSize: 40, letterSpacing: '0.12em', color: COLOR.hueso}}>
          {c.etiqueta}
        </div>
      </div>
      <div style={{position: 'absolute', left: columna, top: 610, opacity: usarEntrada(16)}}>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 600, fontSize: 36, letterSpacing: '0.14em', color: COLOR.hueso}}>
          {c.ocupacionEtiqueta}
        </div>
        <div style={{fontFamily: FUENTE.display, fontSize: 120, lineHeight: 1.1, color: COLOR.rojo}}>
          {Math.round(encendido * 100)}%
        </div>
      </div>
      <div style={{position: 'absolute', left: columna, top: 800, opacity: pMeta}}>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 700, fontSize: 44, color: COLOR.hueso}}>{c.temporada}</div>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 400, fontSize: 36, color: COLOR.hueso, marginTop: 6, letterSpacing: '0.08em'}}>
          {c.marca}
        </div>
      </div>
    </AbsoluteFill>
  );
};
