import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ALTO, ANCHO, COLOR, VISUAL } from '../constants/brand';
import { entrada, TAN_CORTE } from './utilidades';

/** Filete rojo de 2 px que se dibuja horizontalmente. */
export const Filete: React.FC<{ desde: number; ancho: number; style?: React.CSSProperties; color?: string }> = ({
  desde,
  ancho,
  style,
  color = COLOR.rojo,
}) => {
  const frame = useCurrentFrame();
  const p = entrada(frame, desde, 24);
  return <div style={{ height: VISUAL.filete, width: ancho * p, background: color, ...style }} />;
};

/** Filete diagonal a 18° que cruza el cuadro (acento gráfico). */
export const FileteDiagonal: React.FC<{ desde: number; x: number; opacidad?: number }> = ({ desde, x, opacidad = 1 }) => {
  const frame = useCurrentFrame();
  const p = entrada(frame, desde, 30);
  const dx = ALTO * TAN_CORTE;
  const largo = Math.hypot(dx, ALTO);
  return (
    <svg width={ANCHO} height={ALTO} style={{ position: 'absolute', inset: 0, opacity: opacidad }}>
      <line
        x1={x + dx}
        y1={0}
        x2={x}
        y2={ALTO}
        stroke={COLOR.rojo}
        strokeWidth={VISUAL.filete}
        strokeDasharray={largo}
        strokeDashoffset={largo * (1 - p)}
      />
    </svg>
  );
};

/**
 * Costura de pelota: curva suave con puntadas en "V" que se dibuja de izquierda a derecha.
 * Se dibuja en coordenadas propias (ancho × 40 px).
 */
export const Costura: React.FC<{ desde: number; ancho: number; duracion?: number; style?: React.CSSProperties }> = ({
  desde,
  ancho,
  duracion = 40,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = entrada(frame, desde, duracion);
  const alto = 40;
  const medio = alto / 2;
  const curva = `M 0 ${medio} C ${ancho * 0.25} ${medio - 14}, ${ancho * 0.75} ${medio + 14}, ${ancho} ${medio}`;
  const y = (x: number) => {
    // Aproximación de la curva para colocar las puntadas.
    const t = x / ancho;
    return medio - 14 * 3 * t * (1 - t) * (1 - 2 * t) * 0.9;
  };
  const paso = 26;
  const puntadas = Math.floor(ancho / paso);
  const largo = ancho * 1.02;
  return (
    <svg width={ancho} height={alto} style={{ overflow: 'visible', ...style }}>
      <path d={curva} fill="none" stroke={COLOR.rojo} strokeWidth={VISUAL.filete} strokeDasharray={largo} strokeDashoffset={largo * (1 - p)} />
      {Array.from({ length: puntadas }, (_, i) => {
        const x = (i + 0.5) * paso;
        if (x / ancho > p) return null;
        const cy = y(x);
        return (
          <g key={i} stroke={COLOR.rojo} strokeWidth={VISUAL.filete} strokeLinecap="round">
            <line x1={x - 5} y1={cy - 9} x2={x + 2} y2={cy - 2} />
            <line x1={x - 5} y1={cy + 9} x2={x + 2} y2={cy + 2} />
          </g>
        );
      })}
    </svg>
  );
};

/** Destello suave de luminaria: halo radial que respira lento (sin parpadeo). */
export const Luminaria: React.FC<{
  x: number;
  y: number;
  radio?: number;
  intensidad?: number;
  fase?: number;
  congelarEn?: number;
}> = ({ x, y, radio = 420, intensidad = 0.18, fase = 0, congelarEn = Infinity }) => {
  const frame = Math.min(useCurrentFrame(), congelarEn);
  // Periodo de ~4 s: muy por debajo de 3 Hz.
  const respiro = 0.8 + 0.2 * Math.sin((frame / 120) * Math.PI * 2 + fase);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - radio,
        top: y - radio,
        width: radio * 2,
        height: radio * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(245,243,239,${Math.min(1, intensidad * respiro * 3)}) 0%, rgba(245,243,239,${intensidad * respiro * 1.2}) 3%, rgba(245,243,239,${intensidad * respiro * 0.35}) 16%, rgba(245,243,239,0) 60%)`,
        pointerEvents: 'none',
      }}
    />
  );
};
