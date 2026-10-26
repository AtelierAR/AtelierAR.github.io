import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, FUENTE, SPRING_PESO, TAMANO_MIN} from '../constants/brand';

/** Progreso de entrada con peso (spring con damping alto) desde `desde`. */
export const usarEntrada = (desde: number, duracion = 24) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - desde, fps, config: SPRING_PESO, durationInFrames: duracion});
};

/**
 * Texto que entra subiendo con peso. Nunca menor a 36 px.
 * `display` usa Anton en mayúsculas; si no, Inter.
 */
export const Texto: React.FC<{
  children: React.ReactNode;
  desde: number;
  tamano: number;
  display?: boolean;
  color?: string;
  peso?: number;
  style?: React.CSSProperties;
  espaciado?: string;
}> = ({children, desde, tamano, display = true, color = COLOR.hueso, peso, style, espaciado}) => {
  const p = usarEntrada(desde);
  return (
    <div
      style={{
        fontFamily: display ? FUENTE.display : FUENTE.texto,
        fontWeight: peso ?? (display ? 400 : 600),
        fontSize: Math.max(TAMANO_MIN, tamano),
        lineHeight: display ? 1.02 : 1.25,
        letterSpacing: espaciado ?? (display ? '0.01em' : '0.02em'),
        color,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [tamano * 0.35, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Etiqueta de módulo: hueso sobre un filete rojo. */
export const EtiquetaModulo: React.FC<{texto: string; desde: number}> = ({texto, desde}) => {
  const p = usarEntrada(desde);
  return (
    <div style={{position: 'absolute', left: 96, top: 72, opacity: p}}>
      <div style={{width: 160 * p, height: 2, background: COLOR.rojo, marginBottom: 16}} />
      <div
        style={{
          fontFamily: FUENTE.texto,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: '0.16em',
          color: COLOR.hueso,
        }}
      >
        {texto}
      </div>
    </div>
  );
};
