import React from 'react';
import {random} from 'remotion';
import {COLOR} from '../constants/brand';

// Planta abstracta del estadio: un abanico de secciones en herradura
// alrededor de un diamante. Coordenadas locales con centro (0, 0).
// Las personas son siempre puntos de luz, nunca figuras.

export const GRADA = {
  radioInterior: 240,
  radioExterior: 440,
  filas: 10,
  secciones: 12,
  anguloInicio: -30, // grados, 0 = derecha, 90 = abajo (detrás de home)
  anguloFin: 210,
  pasillo: 2.2, // grados entre secciones
  separacion: 14, // px entre asientos
} as const;

export type Punto = {
  x: number;
  y: number;
  seccion: number;
  /** Orden de encendido 0–1 (aleatorio determinista). */
  rango: number;
  indice: number;
};

const rad = (g: number) => (g * Math.PI) / 180;

const construirPuntos = (): Punto[] => {
  const pts: Omit<Punto, 'rango'>[] = [];
  const paso = (GRADA.anguloFin - GRADA.anguloInicio) / GRADA.secciones;
  for (let sec = 0; sec < GRADA.secciones; sec++) {
    const a0 = GRADA.anguloInicio + sec * paso + GRADA.pasillo / 2;
    const a1 = a0 + paso - GRADA.pasillo;
    for (let f = 0; f < GRADA.filas; f++) {
      const r =
        GRADA.radioInterior +
        14 +
        (f * (GRADA.radioExterior - GRADA.radioInterior - 28)) / (GRADA.filas - 1);
      const arco = rad(a1 - a0) * r;
      const n = Math.max(2, Math.floor(arco / GRADA.separacion));
      for (let k = 0; k < n; k++) {
        const a = rad(a0 + ((k + 0.5) / n) * (a1 - a0));
        pts.push({x: Math.cos(a) * r, y: Math.sin(a) * r, seccion: sec, indice: pts.length});
      }
    }
  }
  // Rango aleatorio determinista → encendido disperso, como una grada real.
  const orden = pts
    .map((p) => ({i: p.indice, v: random(`asiento-${p.indice}`)}))
    .sort((a, b) => a.v - b.v);
  const rangos = new Array(pts.length).fill(0);
  orden.forEach((o, pos) => {
    rangos[o.i] = pos / (pts.length - 1);
  });
  return pts.map((p) => ({...p, rango: rangos[p.indice]}));
};

export const PUNTOS_GRADA: Punto[] = construirPuntos();

const arcoPath = (r: number, a0: number, a1: number) => {
  const x0 = Math.cos(rad(a0)) * r;
  const y0 = Math.sin(rad(a0)) * r;
  const x1 = Math.cos(rad(a1)) * r;
  const y1 = Math.sin(rad(a1)) * r;
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1}`;
};

/** Contornos de secciones (línea blanca). */
export const LineasGrada: React.FC<{opacidad: number; progreso?: number}> = ({
  opacidad,
  progreso = 1,
}) => {
  const paso = (GRADA.anguloFin - GRADA.anguloInicio) / GRADA.secciones;
  const home = {x: 0, y: 150};
  const lado = 155; // distancia home → primera base
  const b1 = {x: home.x + lado * Math.SQRT1_2, y: home.y - lado * Math.SQRT1_2};
  const b2 = {x: home.x, y: home.y - lado * Math.SQRT2};
  const b3 = {x: home.x - lado * Math.SQRT1_2, y: home.y - lado * Math.SQRT1_2};
  const foul = 300;
  const largoDiamante = lado * 4;
  return (
    <g opacity={opacidad} fill="none" stroke={COLOR.hueso} strokeWidth={2}>
      {new Array(GRADA.secciones).fill(0).map((_, sec) => {
        const a0 = GRADA.anguloInicio + sec * paso + GRADA.pasillo / 2;
        const a1 = a0 + paso - GRADA.pasillo;
        const visible = Math.max(0, Math.min(1, progreso * GRADA.secciones - sec));
        if (visible <= 0) return null;
        return (
          <g key={sec} opacity={visible}>
            <path d={arcoPath(GRADA.radioInterior, a0, a1)} />
            <path d={arcoPath(GRADA.radioExterior, a0, a1)} />
            {[a0, a1].map((a) => (
              <line
                key={a}
                x1={Math.cos(rad(a)) * GRADA.radioInterior}
                y1={Math.sin(rad(a)) * GRADA.radioInterior}
                x2={Math.cos(rad(a)) * GRADA.radioExterior}
                y2={Math.sin(rad(a)) * GRADA.radioExterior}
              />
            ))}
          </g>
        );
      })}
      {/* Diamante, líneas de foul y barda */}
      <path
        d={`M ${home.x} ${home.y} L ${b1.x} ${b1.y} L ${b2.x} ${b2.y} L ${b3.x} ${b3.y} Z`}
        strokeDasharray={largoDiamante}
        strokeDashoffset={largoDiamante * (1 - progreso)}
      />
      <line
        x1={home.x}
        y1={home.y}
        x2={home.x + foul * Math.SQRT1_2 * progreso}
        y2={home.y - foul * Math.SQRT1_2 * progreso}
      />
      <line
        x1={home.x}
        y1={home.y}
        x2={home.x - foul * Math.SQRT1_2 * progreso}
        y2={home.y - foul * Math.SQRT1_2 * progreso}
      />
      <path
        d={`M ${home.x + foul * Math.SQRT1_2} ${home.y - foul * Math.SQRT1_2} A ${foul} ${foul} 0 0 0 ${home.x - foul * Math.SQRT1_2} ${home.y - foul * Math.SQRT1_2}`}
        opacity={Math.max(0, progreso * 2 - 1)}
      />
      <circle cx={0} cy={home.y - lado * Math.SQRT1_2} r={9} opacity={progreso} />
    </g>
  );
};

/**
 * Grada completa: líneas + asientos. `encendido` es la fracción de asientos
 * encendidos (0–1). `colorDe` permite colorear cada asiento (p. ej. la
 * división MITAD Y MITAD). Se dibuja en coordenadas de pantalla 1920×1080.
 */
export const Grada: React.FC<{
  cx: number;
  cy: number;
  escala: number;
  encendido: number;
  lineas?: number;
  progresoLineas?: number;
  colorEncendido?: string;
  colorDe?: (p: Punto) => string | null;
  brillo?: number;
}> = ({
  cx,
  cy,
  escala,
  encendido,
  lineas = 0.55,
  progresoLineas = 1,
  colorEncendido = COLOR.rojo,
  colorDe,
  brillo = 0,
}) => {
  return (
    <svg
      width={1920}
      height={1080}
      style={{position: 'absolute', left: 0, top: 0}}
      viewBox="0 0 1920 1080"
    >
      <g transform={`translate(${cx} ${cy}) scale(${escala})`}>
        <LineasGrada opacidad={lineas} progreso={progresoLineas} />
        {PUNTOS_GRADA.map((p) => {
          // Encendido suave por asiento: cada uno tarda ~3 % del total.
          const t = Math.max(0, Math.min(1, (encendido - p.rango) / 0.03));
          const color = colorDe?.(p) ?? colorEncendido;
          return (
            <g key={p.indice}>
              <circle cx={p.x} cy={p.y} r={3.4} fill={COLOR.grafito} />
              {t > 0 ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={3.4 + 0.8 * brillo}
                  fill={color}
                  opacity={t}
                />
              ) : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** Fracción visual de asientos para una asistencia dada (aforo ≈ 20 mil). */
export const AFORO_VISUAL = 20000;
