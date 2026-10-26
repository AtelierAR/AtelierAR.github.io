import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, FUENTE, SPRING_PESO} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {TribuPuntos} from '../../components/TribuPuntos';
import {ladoIzquierdo} from '../../components/SplitMitad';
import {Texto, usarEntrada} from '../../components/Texto';
import {GRADA_SPLIT} from './comun';

const CENTROS = [
  {x: 330, y: 290},
  {x: 960, y: 290},
  {x: 1590, y: 290},
  {x: 330, y: 700},
  {x: 960, y: 700},
  {x: 1590, y: 700},
];

// 05 · SEIS TRIBUS — los puntos se reagrupan en seis constelaciones.
export const Escena05SeisTribus: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tribus = COPY_AFICION.tribus.lista;
  const migracion = CENTROS.map((_, i) =>
    spring({frame: frame - 6 - i * 4, fps, config: SPRING_PESO, durationInFrames: 50}),
  );
  const inicioEtiqueta = (i: number) => 44 + i * 20;
  const activa = CENTROS.map((_, i) =>
    spring({frame: frame - inicioEtiqueta(i), fps, config: SPRING_PESO, durationInFrames: 20}),
  );
  const pTitulo = usarEntrada(30);
  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <TribuPuntos
        origen={GRADA_SPLIT}
        centros={CENTROS}
        migracion={migracion}
        activa={activa}
        colorOrigen={(p) => (ladoIzquierdo(p) ? COLOR.rojo : COLOR.hueso)}
      />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 56,
          opacity: pTitulo,
          fontFamily: FUENTE.display,
          fontSize: 64,
          color: COLOR.hueso,
        }}
      >
        {COPY_AFICION.tribus.titulo}
      </div>
      {tribus.map((t, i) => {
        const c = CENTROS[i];
        return (
          <div
            key={t.nombre}
            style={{position: 'absolute', left: c.x - 280, width: 560, top: c.y + 108, textAlign: 'center'}}
          >
            <Texto desde={inicioEtiqueta(i)} tamano={48}>
              {t.nombre}
            </Texto>
            <Texto desde={inicioEtiqueta(i) + 6} tamano={36} display={false} peso={400} style={{marginTop: 8}}>
              {t.pide}
            </Texto>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
