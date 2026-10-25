import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, FPS, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Costura } from '../components/Lineas';
import { estiloDisplay } from '../components/Texto';
import { entrada, lerp } from '../components/utilidades';

/** Pausas de lectura: después de coma o de cierre de frase el ritmo respira. */
const pausaTras = (palabra: string) => (/[,;:]$/.test(palabra) ? 0.35 : 0);

/** 09 · LA PREGUNTA — negro limpio; la pregunta aparece palabra por palabra. */
export const Escena09: React.FC = () => {
  const frame = useCurrentFrame();
  const palabras = COPY.pregunta.split(' ');
  const intervalo = FPS / T.e09.palabrasPorSegundo;
  let t = seg(T.e09.inicio);
  const inicios = palabras.map((p) => {
    const ini = t;
    t += intervalo + pausaTras(p) * FPS;
    return ini;
  });
  const finPregunta = t;
  return (
    <AbsoluteFill style={{ background: COLOR.negro, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1560, display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ ...estiloDisplay(118), lineHeight: 1.14, display: 'flex', flexWrap: 'wrap', columnGap: '0.24em' }}>
          {palabras.map((p, i) => {
            const e = entrada(frame, inicios[i], 14);
            return (
              <span key={i} style={{ display: 'inline-block', opacity: e, transform: `translateY(${lerp(18, 0, e)}px)` }}>
                {p}
              </span>
            );
          })}
        </div>
        <Costura desde={finPregunta} ancho={620} duracion={36} />
      </div>
    </AbsoluteFill>
  );
};
