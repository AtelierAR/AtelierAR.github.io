import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLOR} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {Texto} from '../../components/Texto';

// 09 · TRANSICIÓN — negro, texto en dos tiempos, una brasa sube. Corte.
export const Escena09Transicion: React.FC = () => {
  const frame = useCurrentFrame();
  const c = COPY_AFICION.cierre;
  const subida = interpolate(frame, [20, 178], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const y = interpolate(subida, [0, 1], [1110, 150]);
  const x = 960 + Math.sin(frame / 22) * 18;
  const alfa = interpolate(frame, [20, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="brasa-cierre">
            <stop offset="0%" stopColor={COLOR.rojo} stopOpacity={1} />
            <stop offset="40%" stopColor={COLOR.rojo} stopOpacity={0.5} />
            <stop offset="100%" stopColor={COLOR.vino} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={x} cy={y} r={34} fill="url(#brasa-cierre)" opacity={alfa} />
        <circle cx={x} cy={y} r={5} fill={COLOR.rojo} opacity={alfa} />
      </svg>
      <div style={{position: 'absolute', left: 96, right: 96, top: 300, textAlign: 'center'}}>
        <Texto desde={8} tamano={84}>
          {c.linea1}
        </Texto>
      </div>
      <div style={{position: 'absolute', left: 96, right: 96, top: 520, textAlign: 'center'}}>
        <Texto desde={72} tamano={84}>
          {c.linea2a}
        </Texto>
        <Texto desde={80} tamano={84}>
          {c.linea2b}
        </Texto>
      </div>
    </AbsoluteFill>
  );
};
