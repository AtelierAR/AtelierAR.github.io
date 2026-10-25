import React from 'react';
import { spring, useCurrentFrame } from 'remotion';
import { COLOR, FPS, VISUAL } from '../constants/brand';
import { estiloDisplay } from './Texto';
import { lerp, mezclar } from './utilidades';

/**
 * Rodillo de pizarra: cada dígito gira verticalmente de su valor inicial al final
 * (como un marcador mecánico de estadio).
 */
export const Rodillo: React.FC<{
  de: string;
  a: string;
  desde: number;
  duracion: number;
  tamano: number;
  colorInicial?: string;
  colorFinal?: string;
}> = ({ de, a, desde, duracion, tamano, colorInicial = COLOR.hueso, colorFinal = COLOR.hueso }) => {
  const frame = useCurrentFrame();
  const altoCelda = tamano * 1.0;
  return (
    <div style={{ display: 'flex', gap: tamano * 0.02 }}>
      {a.split('').map((digFinal, i) => {
        const ini = parseInt(de[i] ?? '0', 10);
        const fin = parseInt(digFinal, 10);
        // Siempre gira "hacia abajo": recorre los dígitos intermedios.
        const pasos = (ini - fin + 10) % 10 || 10;
        const p = spring({
          frame: frame - desde - i * 4,
          fps: FPS,
          config: VISUAL.spring,
          durationInFrames: duracion,
        });
        const pos = p * pasos; // dígitos recorridos
        const secuencia = Array.from({ length: pasos + 1 }, (_, k) => (ini - k + 10) % 10);
        const color = mezclar(colorInicial, colorFinal, Math.max(0, (p - 0.75) / 0.25));
        return (
          <div
            key={i}
            style={{
              height: altoCelda,
              overflow: 'hidden',
              position: 'relative',
              width: tamano * 0.5,
              borderTop: `${VISUAL.filete}px solid ${COLOR.grafito}`,
              borderBottom: `${VISUAL.filete}px solid ${COLOR.grafito}`,
              background: COLOR.carbon,
            }}
          >
            {/* línea de pliegue de la pizarra */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: COLOR.negro, zIndex: 2 }} />
            <div style={{ transform: `translateY(${-pos * altoCelda}px)` }}>
              {secuencia.map((d, k) => (
                <div
                  key={k}
                  style={{
                    ...estiloDisplay(tamano * 0.86, color),
                    height: altoCelda,
                    lineHeight: `${altoCelda}px`,
                    textAlign: 'center',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Pizarra de coronas: barras verticales hechas de celdas LED que se encienden en secuencia.
 * `destello` marca el cuadro en que las barras `destacadas` destellan UNA sola vez.
 */
export const BarrasCoronas: React.FC<{
  etiquetas: readonly string[];
  desde: number;
  paso: number;
  destello: number;
  destacadas: number[];
  alto?: number;
  ancho?: number;
  separacion?: number;
}> = ({ etiquetas, desde, paso, destello, destacadas, alto = 320, ancho = 44, separacion = 52 }) => {
  const frame = useCurrentFrame();
  const celdas = 12;
  const altoCelda = (alto - (celdas - 1) * 4) / celdas;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
      {etiquetas.map((etq, i) => {
        const inicio = desde + i * paso;
        // Cada barra se llena de abajo hacia arriba en ~8 cuadros.
        const lleno = Math.max(0, Math.min(1, (frame - inicio) / 8));
        const esDestacada = destacadas.includes(i);
        // Destello único: sube en 4 cuadros y baja en 14 (≈ 0.6 s, un solo pulso).
        const t = frame - destello;
        const pulso = esDestacada && t >= 0 && t < 18 ? (t < 4 ? t / 4 : 1 - (t - 4) / 14) : 0;
        return (
          <div key={etq} style={{ width: ancho + separacion, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: 4,
                filter: pulso > 0 ? `drop-shadow(0 0 ${lerp(0, 26, pulso)}px rgba(245,243,239,${0.7 * pulso}))` : undefined,
              }}
            >
              {Array.from({ length: celdas }, (_, k) => {
                const encendida = lleno * celdas > k;
                const base = encendida ? COLOR.rojo : COLOR.carbon;
                return (
                  <div
                    key={k}
                    style={{
                      width: ancho,
                      height: altoCelda,
                      background: pulso > 0 ? mezclar(COLOR.rojo, COLOR.hueso, pulso * 0.75) : base,
                      boxShadow: encendida ? `0 0 10px rgba(208,2,27,0.45)` : undefined,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ ...estiloDisplay(36, COLOR.hueso), letterSpacing: '0.02em', opacity: lleno > 0 ? 1 : 0.0 }}>{etq}</div>
          </div>
        );
      })}
    </div>
  );
};
