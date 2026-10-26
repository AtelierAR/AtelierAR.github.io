import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, FUENTE, SPRING_GOLPE, marcadorLocal} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {SplitMitad} from '../../components/SplitMitad';
import {Texto, usarEntrada} from '../../components/Texto';
import {GRADA_SPLIT} from './comun';

// 04 · MITAD Y MITAD — una diagonal de 18° divide la grada en dos mitades iguales.
export const Escena04MitadYMitad: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = COPY_AFICION.mitad;
  const golpe = marcadorLocal('golpeMitadYMitad', 'e04MitadYMitad');
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const linea = interpolate(frame, [4, 34], [0, 1], clamp);
  const color = interpolate(frame, [14, 60], [0, 1.05], clamp);
  const porcentaje = interpolate(frame, [12, golpe - 4], [0, 50], clamp);
  const pGolpe = spring({frame: frame - golpe, fps, config: SPRING_GOLPE});
  const golpeNumeros = interpolate(frame - golpe, [0, 3, 18], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <SplitMitad
        {...GRADA_SPLIT}
        progresoLinea={linea}
        progresoColor={color}
        porcentajeIzq={(porcentaje / 50) * c.ellas}
        porcentajeDer={(porcentaje / 50) * c.ellos}
        etiquetaIzq={c.etiquetaEllas}
        etiquetaDer={c.etiquetaEllos}
        golpe={golpeNumeros}
        opacidadNumeros={usarEntrada(10)}
      />
      {frame >= golpe ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 64,
            textAlign: 'center',
            fontFamily: FUENTE.display,
            fontSize: 160,
            lineHeight: 1,
            color: COLOR.hueso,
            opacity: Math.min(1, pGolpe * 1.6),
            transform: `scale(${interpolate(pGolpe, [0, 1], [1.28, 1])})`,
          }}
        >
          {c.golpe}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 96, right: 96, top: 930, textAlign: 'center'}}>
        <Texto desde={golpe + 16} tamano={76}>
          {c.remate}
        </Texto>
      </div>
    </AbsoluteFill>
  );
};
