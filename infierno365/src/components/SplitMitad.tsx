import React from 'react';
import {ANGULO_CORTE, COLOR, FUENTE} from '../constants/brand';
import {Grada, Punto} from './Grada';

// Centro vertical aproximado de la herradura (coordenadas locales).
const Y_CENTRO = 110;
const TAN = Math.tan((ANGULO_CORTE * Math.PI) / 180);

/** ¿El asiento queda del lado izquierdo de la diagonal de 18°? */
export const ladoIzquierdo = (p: Punto) => p.x < (Y_CENTRO - p.y) * TAN;

/**
 * La grada partida por una diagonal a 18° de la vertical: a la izquierda
 * ELLAS (rojo), a la derecha ELLOS (hueso). Los porcentajes suben juntos
 * hasta igualarse.
 */
export const SplitMitad: React.FC<{
  cx: number;
  cy: number;
  escala: number;
  progresoLinea: number;
  progresoColor: number;
  porcentajeIzq: number;
  porcentajeDer: number;
  etiquetaIzq: string;
  etiquetaDer: string;
  golpe: number;
  opacidadNumeros: number;
}> = ({
  cx,
  cy,
  escala,
  progresoLinea,
  progresoColor,
  porcentajeIzq,
  porcentajeDer,
  etiquetaIzq,
  etiquetaDer,
  golpe,
  opacidadNumeros,
}) => {
  const largo = 760;
  const dx = Math.sin((ANGULO_CORTE * Math.PI) / 180);
  const dy = Math.cos((ANGULO_CORTE * Math.PI) / 180);
  const p = Math.max(0, Math.min(1, progresoLinea));
  // La línea se dibuja de abajo hacia arriba como una costura.
  const x0 = cx - (largo / 2) * dx * escala;
  const y0 = cy + (Y_CENTRO + (largo / 2) * dy) * escala;
  const x1 = x0 + largo * dx * escala * p;
  const y1 = y0 - largo * dy * escala * p;
  const numero = (valor: number, color: string): React.CSSProperties => ({
    fontFamily: FUENTE.display,
    fontSize: 210,
    lineHeight: 1,
    color,
    transform: `scale(${1 + golpe * 0.06})`,
  });
  return (
    <>
      <Grada
        cx={cx}
        cy={cy}
        escala={escala}
        encendido={1}
        lineas={0.4}
        colorDe={(pt) => {
          const izq = ladoIzquierdo(pt);
          // El color se extiende desde la diagonal hacia afuera.
          const dist = Math.abs(pt.x - (Y_CENTRO - pt.y) * TAN) / 460;
          if (dist > progresoColor) return COLOR.grafito;
          return izq ? COLOR.rojo : COLOR.hueso;
        }}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={COLOR.rojo} strokeWidth={2} />
        <circle cx={x1} cy={y1} r={p > 0 && p < 1 ? 6 : 0} fill={COLOR.rojo} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: cy - 30,
          opacity: opacidadNumeros,
          textAlign: 'left',
        }}
      >
        <div style={numero(porcentajeIzq, COLOR.rojo)}>{Math.round(porcentajeIzq)}%</div>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 700, fontSize: 44, color: COLOR.hueso, letterSpacing: '0.12em', marginTop: 12}}>
          {etiquetaIzq}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 110,
          top: cy - 30,
          opacity: opacidadNumeros,
          textAlign: 'right',
        }}
      >
        <div style={{...numero(porcentajeDer, COLOR.hueso), transformOrigin: 'right center'}}>
          {Math.round(porcentajeDer)}%
        </div>
        <div style={{fontFamily: FUENTE.texto, fontWeight: 700, fontSize: 44, color: COLOR.hueso, letterSpacing: '0.12em', marginTop: 12}}>
          {etiquetaDer}
        </div>
      </div>
    </>
  );
};
