import React from 'react';
import {COLOR, FUENTE} from '../constants/brand';

const arco = (cx: number, cy: number, r: number, fraccion: number) => {
  const f = Math.max(0, Math.min(0.9999, fraccion));
  const a0 = -Math.PI / 2;
  const a1 = a0 + f * Math.PI * 2;
  const grande = f > 0.5 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${grande} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`;
};

/** Minutos → "h:mm". */
export const hmm = (min: number) => {
  const m = Math.round(min);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

/**
 * Reloj de duración: anillo que se llena (carátula de 5 horas) y la
 * cifra al centro. Se dibuja dentro de un <svg>.
 */
export const Reloj: React.FC<{
  cx: number;
  cy: number;
  radio: number;
  minutos: number;
  color: string;
  tamanoCifra: number;
  etiqueta?: string;
  escala?: number;
  caratulaMin?: number;
}> = ({cx, cy, radio, minutos, color, tamanoCifra, etiqueta, escala = 1, caratulaMin = 300}) => (
  <g transform={`translate(${cx} ${cy}) scale(${escala}) translate(${-cx} ${-cy})`}>
    <circle cx={cx} cy={cy} r={radio} fill={COLOR.negro} stroke={COLOR.grafito} strokeWidth={10} />
    {new Array(12).fill(0).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <line
          key={i}
          x1={cx + Math.cos(a) * (radio - 16)}
          y1={cy + Math.sin(a) * (radio - 16)}
          x2={cx + Math.cos(a) * (radio - 24)}
          y2={cy + Math.sin(a) * (radio - 24)}
          stroke={COLOR.ceniza}
          strokeWidth={2}
        />
      );
    })}
    <path d={arco(cx, cy, radio, minutos / caratulaMin)} fill="none" stroke={color} strokeWidth={10} strokeLinecap="butt" />
    <text
      x={cx}
      y={cy + tamanoCifra * 0.36}
      textAnchor="middle"
      fontFamily={FUENTE.display}
      fontSize={tamanoCifra}
      fill={COLOR.hueso}
    >
      {hmm(minutos)}
    </text>
    {etiqueta ? (
      <text
        x={cx}
        y={cy + radio + 52}
        textAnchor="middle"
        fontFamily={FUENTE.texto}
        fontWeight={700}
        fontSize={36}
        letterSpacing="0.08em"
        fill={COLOR.hueso}
      >
        {etiqueta}
      </text>
    ) : null}
  </g>
);

/**
 * Dos relojes: JUEGO (hueso) y ESTANCIA (rojo, crece). Japón: la visita
 * dura más que el juego. Solo crece el anillo; las etiquetas no se mueven.
 */
export const RelojDoble: React.FC<{
  cx: number;
  cy: number;
  minutosJuego: number;
  minutosEstancia: number;
  etiquetaJuego: string;
  etiquetaEstancia: string;
  crecimiento: number;
}> = ({cx, cy, minutosJuego, minutosEstancia, etiquetaJuego, etiquetaEstancia, crecimiento}) => {
  const etiqueta = (x: number, texto: string) => (
    <text
      x={x}
      y={cy + 112}
      textAnchor="middle"
      fontFamily={FUENTE.texto}
      fontWeight={700}
      fontSize={36}
      letterSpacing="0.06em"
      fill={COLOR.hueso}
    >
      {texto}
    </text>
  );
  return (
    <>
      <Reloj cx={cx - 100} cy={cy - 16} radio={60} minutos={minutosJuego} color={COLOR.hueso} tamanoCifra={40} />
      <Reloj
        cx={cx + 86}
        cy={cy - 16}
        radio={60}
        minutos={minutosEstancia}
        color={COLOR.rojo}
        tamanoCifra={40}
        escala={1 + 0.22 * crecimiento}
      />
      {etiqueta(cx - 100, etiquetaJuego)}
      {etiqueta(cx + 86, etiquetaEstancia)}
    </>
  );
};
