import React from 'react';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, Series, staticFile } from 'remotion';
import { AUDIO, COLOR, DURACION_TOTAL, ESCENAS, inicioEscena, seg, T } from './constants/brand';
import { Grano } from './components/Grano';
import { ESCENA_COMPONENTE } from './scenes';

/** Pistas marcador sincronizadas con los puntos definidos en brand.ts. */
const Pistas: React.FC = () => {
  if (!AUDIO.habilitado) return null;
  const totalAmbiente = seg(DURACION_TOTAL - AUDIO.regresaAmbiente);
  const { ambiente } = AUDIO.volumen;
  return (
    <>
      {/* 01 · canto: se corta en seco al llegar el silencio */}
      <Sequence from={0} durationInFrames={seg(AUDIO.silencio)} name="Audio · canto">
        <Html5Audio src={staticFile(AUDIO.archivos.canto)} volume={AUDIO.volumen.canto} />
      </Sequence>
      {/* ambiente: regresa tras el silencio, se apaga en el hold final */}
      <Sequence from={seg(AUDIO.regresaAmbiente)} durationInFrames={totalAmbiente} name="Audio · ambiente">
        <Html5Audio
          src={staticFile(AUDIO.archivos.ambiente)}
          loop
          volume={(f) =>
            interpolate(
              f,
              [0, 20, totalAmbiente - 90, totalAmbiente],
              [0, ambiente, ambiente, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
          }
        />
      </Sequence>
      {Object.entries(AUDIO.golpes).map(([nombre, s]) => (
        <Sequence key={nombre} from={seg(s)} durationInFrames={seg(3)} name={`Audio · golpe ${nombre}`}>
          <Html5Audio src={staticFile(AUDIO.archivos.impacto)} volume={AUDIO.volumen.impacto} />
        </Sequence>
      ))}
    </>
  );
};

/** Composición completa: las 10 escenas en serie + grano + audio. */
export const Apertura: React.FC = () => {
  const congelarGrano = seg(inicioEscena('Escena10') + T.e10.congelar);
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Series>
        {ESCENAS.map((e) => {
          const Componente = ESCENA_COMPONENTE[e.id];
          return (
            <Series.Sequence key={e.id} durationInFrames={seg(e.dur)} name={`${e.id} · ${e.nombre}`}>
              <Componente />
            </Series.Sequence>
          );
        })}
      </Series>
      <Grano congelarEn={congelarGrano} />
      <Pistas />
    </AbsoluteFill>
  );
};
