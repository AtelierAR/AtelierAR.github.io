import React from 'react';
import {COLOR} from '../constants/brand';

/**
 * Marco de teléfono vertical con un feed abstracto que se desplaza:
 * tarjetas rojas y blancas, sin rostros ni marcas. `desplazamiento` en px.
 */
export const FeedVertical: React.FC<{
  cx: number;
  cy: number;
  ancho?: number;
  alto?: number;
  desplazamiento: number;
  opacidad?: number;
}> = ({cx, cy, ancho = 170, alto = 320, desplazamiento, opacidad = 1}) => {
  const x = cx - ancho / 2;
  const y = cy - alto / 2;
  const alturaTarjeta = 118;
  const hueco = 14;
  const bloque = alturaTarjeta + hueco;
  const colores = [COLOR.rojo, COLOR.hueso, COLOR.vino, COLOR.hueso, COLOR.rojo, COLOR.grafito];
  const primera = Math.floor(desplazamiento / bloque);
  const id = `feed-${Math.round(cx)}-${Math.round(cy)}`;
  return (
    <g opacity={opacidad}>
      <defs>
        <clipPath id={id}>
          <rect x={x + 10} y={y + 26} width={ancho - 20} height={alto - 46} rx={6} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={ancho} height={alto} rx={26} fill={COLOR.negro} stroke={COLOR.hueso} strokeWidth={3} />
      <rect x={cx - 22} y={y + 10} width={44} height={6} rx={3} fill={COLOR.grafito} />
      <g clipPath={`url(#${id})`}>
        {new Array(4).fill(0).map((_, i) => {
          const n = primera + i;
          const ty = y + 26 + n * bloque - desplazamiento;
          const c = colores[((n % colores.length) + colores.length) % colores.length];
          const oscuro = c === COLOR.hueso;
          return (
            <g key={n}>
              <rect x={x + 10} y={ty} width={ancho - 20} height={alturaTarjeta} rx={8} fill={c} />
              <circle cx={x + 30} cy={ty + 22} r={9} fill={oscuro ? COLOR.grafito : COLOR.hueso} opacity={0.8} />
              <rect x={x + 46} y={ty + 17} width={60} height={9} rx={4} fill={oscuro ? COLOR.grafito : COLOR.hueso} opacity={0.7} />
              <rect x={x + 22} y={ty + 84} width={ancho - 70} height={9} rx={4} fill={oscuro ? COLOR.grafito : COLOR.hueso} opacity={0.55} />
            </g>
          );
        })}
      </g>
      <rect x={cx - 30} y={y + alto - 13} width={60} height={4} rx={2} fill={COLOR.hueso} opacity={0.6} />
    </g>
  );
};
