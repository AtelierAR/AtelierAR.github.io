import React from 'react';
import {interpolate, interpolateColors, Easing} from 'remotion';
import {FUENTE} from '../constants/brand';

/**
 * Pizarra de estadio: cada dígito rueda verticalmente, como las tablillas
 * de un marcador, de `desde` a `hasta`. `progreso` 0–1.
 */
export const Pizarra: React.FC<{
  desde: string;
  hasta: string;
  progreso: number;
  tamano: number;
  colorDesde: string;
  colorHasta: string;
}> = ({desde, hasta, progreso, tamano, colorDesde, colorHasta}) => {
  const alto = tamano * 1.02;
  const color = interpolateColors(progreso, [0.35, 0.85], [colorDesde, colorHasta]);
  return (
    <div style={{display: 'flex', gap: tamano * 0.04}}>
      {hasta.split('').map((d, i) => {
        const a = Number(desde[i] ?? '0');
        const b = Number(d);
        // Recorre al menos una vuelta completa para que se sienta mecánico.
        const pasos = ((b - a + 10) % 10) + 10;
        const retraso = i * 0.12;
        const t = interpolate(progreso, [retraso, Math.min(1, 0.78 + retraso)], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.45, 0, 0.15, 1),
        });
        const desplazamiento = t * pasos;
        const digitos = new Array(pasos + 1).fill(0).map((_, k) => (a + k) % 10);
        return (
          <div
            key={i}
            style={{
              height: alto,
              width: tamano * 0.5,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{transform: `translateY(${-desplazamiento * alto}px)`}}>
              {digitos.map((n, k) => (
                <div
                  key={k}
                  style={{
                    height: alto,
                    fontFamily: FUENTE.display,
                    fontSize: tamano,
                    lineHeight: `${alto}px`,
                    color,
                    textAlign: 'center',
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
