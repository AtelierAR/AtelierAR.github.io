import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLOR, TIPO } from '../constants/brand';
import { entrada, golpe, lerp, TAN_CORTE } from './utilidades';

/**
 * Revela su contenido con un corte diagonal a 18° que barre de izquierda a
 * derecha, más un leve ascenso con spring de peso.
 */
export const Revelar: React.FC<{
  desde: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  duracion?: number;
}> = ({ desde, children, style, duracion = 22 }) => {
  const frame = useCurrentFrame();
  const p = entrada(frame, desde, duracion);
  // El borde inclinado recorre de −35 % a 135 % del ancho. El polígono rebasa la caja
  // en vertical para no recortar acentos (Á, É, Ñ) que sobresalen del interlineado.
  const borde = lerp(-35, 135, p);
  const inclinacion = 100 * TAN_CORTE * 0.5;
  const clip =
    p >= 0.999
      ? 'none'
      : `polygon(-10% -40%, ${borde + inclinacion * 1.8}% -40%, ${borde - inclinacion * 1.8}% 140%, -10% 140%)`;
  return (
    <div style={{ ...style, clipPath: clip, transform: `translateY(${lerp(28, 0, p)}px)`, opacity: p > 0 ? 1 : 0 }}>
      {children}
    </div>
  );
};

/** Golpe: escala de 1.16 → 1 con spring rápido y una sacudida breve que se amortigua. */
export const Golpe: React.FC<{ en: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  en,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = golpe(frame, en);
  const t = frame - en;
  const sacudida = t >= 0 && t < 12 ? Math.sin(t * 2.3) * 7 * (1 - t / 12) : 0;
  return (
    <div
      style={{
        ...style,
        opacity: t >= 0 ? 1 : 0,
        transform: `translate(${sacudida}px, ${sacudida * 0.4}px) scale(${lerp(1.16, 1, p)})`,
      }}
    >
      {children}
    </div>
  );
};

export const estiloDisplay = (tamano: number, color: string = COLOR.hueso): React.CSSProperties => ({
  fontFamily: TIPO.display,
  fontSize: Math.max(tamano, TIPO.minimo),
  lineHeight: 0.95,
  letterSpacing: TIPO.trackingDisplay,
  textTransform: 'uppercase',
  color,
  margin: 0,
  whiteSpace: 'pre-wrap',
});

export const estiloTexto = (tamano: number, color: string = COLOR.hueso): React.CSSProperties => ({
  fontFamily: TIPO.texto,
  fontWeight: 600,
  fontSize: Math.max(tamano, TIPO.minimo),
  lineHeight: 1.15,
  letterSpacing: TIPO.trackingTexto,
  textTransform: 'uppercase',
  color,
  margin: 0,
});
