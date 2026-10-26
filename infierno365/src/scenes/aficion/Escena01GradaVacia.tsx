import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLOR} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {Grada} from '../../components/Grada';
import {EtiquetaModulo, Texto} from '../../components/Texto';
import {GRADA_CENTRO} from './comun';

// 01 · LA GRADA VACÍA — planta en línea blanca, todo apagado.
export const Escena01GradaVacia: React.FC = () => {
  const frame = useCurrentFrame();
  const lineas = interpolate(frame, [8, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <Grada {...GRADA_CENTRO} encendido={0} lineas={0.6} progresoLineas={lineas} />
      <EtiquetaModulo texto={COPY_AFICION.modulo} desde={6} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 920, textAlign: 'center'}}>
        <Texto desde={54} tamano={96}>
          {COPY_AFICION.pregunta}
        </Texto>
      </div>
    </AbsoluteFill>
  );
};
