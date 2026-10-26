import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLOR} from '../constants/brand';

/**
 * Brasas: partículas rojas que suben despacio. Sin destellos: el brillo
 * de cada brasa cambia suave (periodo > 1 s).
 */
export const Brasas: React.FC<{
  cantidad?: number;
  intensidad?: number;
  semilla?: string;
}> = ({cantidad = 26, intensidad = 1, semilla = 'brasas'}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1920} height={1080}>
        <defs>
          <radialGradient id="brasa">
            <stop offset="0%" stopColor={COLOR.rojo} stopOpacity={1} />
            <stop offset="45%" stopColor={COLOR.rojo} stopOpacity={0.55} />
            <stop offset="100%" stopColor={COLOR.vino} stopOpacity={0} />
          </radialGradient>
        </defs>
        {new Array(cantidad).fill(0).map((_, i) => {
          const r = (k: string) => random(`${semilla}-${i}-${k}`);
          const vel = 0.6 + r('v') * 1.4;
          const ciclo = 1080 + 200;
          const y = 1080 + 100 - ((frame * vel + r('y') * ciclo) % ciclo);
          const x = r('x') * 1920 + Math.sin((frame + r('f') * 300) / (60 + r('p') * 60)) * 30;
          const tam = 3 + r('t') * 7;
          const alfa = (0.35 + 0.35 * Math.sin((frame + r('a') * 200) / 45)) * intensidad;
          return <circle key={i} cx={x} cy={y} r={tam * 2.2} fill="url(#brasa)" opacity={alfa} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
