import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, seg, T } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Diamante } from '../components/Diamante';
import { Luminaria } from '../components/Lineas';
import { MapaDistrito, Nodo } from '../components/MapaDistrito';
import { estiloDisplay, estiloTexto, Revelar } from '../components/Texto';
import { entrada, tramo } from '../components/utilidades';

/** 08 · EL DISTRITO — diamante en línea blanca, nodos abstractos y un anillo de 360°. */
export const Escena08: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = 960;
  const cy = 430;
  const escala = 0.92;
  const radioAnillo = 300 * escala;
  const trazo = tramo(frame, seg(T.e08.diamante), seg(T.e08.diamante + T.e08.durDiamante));
  const outfield = tramo(frame, seg(T.e08.diamante + T.e08.durDiamante * 0.6), seg(T.e08.diamante + T.e08.durDiamante + 0.4));
  const cierre = tramo(frame, seg(T.e08.anillo), seg(T.e08.anillo + 1.4));

  const [autodromo, palacio, gnp, metro] = COPY.distrito.nodos;
  // Posiciones abstractas (ángulo, distancia): composición, no cartografía.
  const nodos: Nodo[] = [
    { etiqueta: gnp, angulo: 302, distancia: 400, lado: 'izq' },
    { etiqueta: metro, angulo: 58, distancia: 400, lado: 'der' },
    { etiqueta: palacio, angulo: 235, distancia: 360, lado: 'izq' },
    { etiqueta: autodromo, angulo: 125, distancia: 360, lado: 'der' },
  ];

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Luminaria x={180} y={40} radio={460} intensidad={0.12} />
      <Luminaria x={1740} y={40} radio={460} intensidad={0.12} fase={1.5} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {/* retícula de distrito: anillo de 500 m punteado */}
        <circle
          cx={cx}
          cy={cy}
          r={radioAnillo + 60}
          fill="none"
          stroke={COLOR.grafito}
          strokeWidth={2}
          strokeDasharray="4 10"
          opacity={entrada(frame, seg(T.e08.nodos), 30)}
        />
        <Diamante
          cx={cx}
          cy={cy}
          escala={escala}
          trazo={trazo}
          outfield={outfield}
          cierre={cierre}
          colorAnillo={cierre > 0 ? COLOR.rojo : COLOR.hueso}
          grosor={2}
        />
      </svg>
      <MapaDistrito
        cx={cx}
        cy={cy}
        nodos={nodos}
        desdeNodos={seg(T.e08.nodos)}
        pasoNodo={seg(T.e08.pasoNodo)}
        desdeLineas={seg(T.e08.lineas)}
        radioCentro={radioAnillo + 60}
      />
      <div
        style={{
          position: 'absolute',
          left: cx - 60,
          width: 120,
          textAlign: 'center',
          top: cy + radioAnillo + 72,
          ...estiloTexto(36),
          opacity: entrada(frame, seg(T.e08.nodos) + 10, 30),
        }}
      >
        {COPY.distrito.radio}
      </div>
      <div style={{ position: 'absolute', top: 840, left: 120, right: 120, display: 'flex', justifyContent: 'center' }}>
        <Revelar desde={seg(T.e08.texto)}>
          <div style={{ ...estiloDisplay(84), lineHeight: 1.08, textAlign: 'center' }}>{COPY.distrito.texto}</div>
        </Revelar>
      </div>
    </AbsoluteFill>
  );
};
