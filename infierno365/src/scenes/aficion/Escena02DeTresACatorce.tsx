import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, FUENTE, SPRING_GOLPE, SPRING_PESO, marcadorLocal} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {AFORO_VISUAL, Grada} from '../../components/Grada';
import {Contador, valorContador} from '../../components/Contador';
import {Filete} from '../../components/Filete';
import {Texto, usarEntrada} from '../../components/Texto';
import {GRADA_CENTRO, GRADA_IZQUIERDA} from './comun';

// 02 · DE 3 MIL A 14 MIL — los asientos se encienden con la asistencia.
export const Escena02DeTresACatorce: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = COPY_AFICION.asistencia;
  const golpe = marcadorLocal('golpeCatorceMil', 'e02DeTresACatorce');

  const mover = spring({frame, fps, config: SPRING_PESO, durationInFrames: 36});
  const g = {
    cx: interpolate(mover, [0, 1], [GRADA_CENTRO.cx, GRADA_IZQUIERDA.cx]),
    cy: interpolate(mover, [0, 1], [GRADA_CENTRO.cy, GRADA_IZQUIERDA.cy]),
    escala: interpolate(mover, [0, 1], [GRADA_CENTRO.escala, GRADA_IZQUIERDA.escala]),
  };
  const tramos: [number, number][] = [
    [34, 84],
    [104, 150],
  ];
  const valor = valorContador(frame, c.etapas, tramos);
  const entrada = usarEntrada(14);
  const pGolpe = spring({frame: frame - golpe, fps, config: SPRING_GOLPE});
  const brillo = interpolate(frame - golpe, [0, 4, 24], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const contadorVisible = interpolate(frame, [golpe - 6, golpe], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pOcupAntes = usarEntrada(84);
  const pOcupHoy = usarEntrada(150);
  const columna = 1040;

  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <Grada {...g} encendido={valor / AFORO_VISUAL} brillo={brillo} />

      {/* Contador */}
      <div style={{position: 'absolute', left: columna, top: 210, opacity: entrada * contadorVisible}}>
        <Contador valor={valor} tamano={230} />
      </div>

      {/* Golpe: 14 MIL */}
      {frame >= golpe ? (
        <div
          style={{
            position: 'absolute',
            left: columna,
            top: 180,
            fontFamily: FUENTE.display,
            fontSize: 290,
            lineHeight: 1,
            color: COLOR.hueso,
            opacity: Math.min(1, pGolpe * 1.6),
            transform: `scale(${interpolate(pGolpe, [0, 1], [1.3, 1])})`,
            transformOrigin: 'left center',
          }}
        >
          {c.golpe}
        </div>
      ) : null}
      <Filete x={columna} y={490} ancho={760} progreso={frame >= golpe ? pGolpe : entrada * 0.35} />

      <div style={{position: 'absolute', left: columna, top: 512, opacity: entrada}}>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 700, fontSize: 40, letterSpacing: '0.12em', color: COLOR.hueso}}>
          {c.etiqueta}
        </div>
      </div>

      {/* Ocupación: 59 % → 72 % */}
      <div style={{position: 'absolute', left: columna, top: 610}}>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 600, fontSize: 36, letterSpacing: '0.14em', color: COLOR.hueso, opacity: pOcupAntes}}>
          {c.ocupacionEtiqueta}
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 28, fontFamily: FUENTE.display, fontSize: 120, lineHeight: 1.1}}>
          <span style={{color: COLOR.ceniza, opacity: pOcupAntes}}>{c.ocupacionAntes}%</span>
          <span style={{color: COLOR.hueso, opacity: pOcupHoy, fontSize: 80}}>→</span>
          <span style={{color: COLOR.rojo, opacity: pOcupHoy}}>{c.ocupacionHoy}%</span>
        </div>
      </div>

      <div style={{position: 'absolute', left: 96, right: 96, top: 905, textAlign: 'center'}}>
        <Texto desde={golpe + 14} tamano={76}>
          {c.remate}
        </Texto>
      </div>
    </AbsoluteFill>
  );
};
