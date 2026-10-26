import React from 'react';
import {Audio, Sequence, getStaticFiles, interpolate, staticFile} from 'remotion';
import {AUDIO_AFICION, ESCENAS_AFICION, MARCADORES_AFICION, VIDEO, marcador, s} from '../../constants/brand';

// AUDIO · MARCADORES, NO PISTAS FINALES.
// Los archivos de /public/audio/aficion/ son marcadores sintéticos libres de
// derechos (generados con scripts/generar-audio.sh). El presentador debe
// reemplazarlos por audio propio o con licencia, con el mismo nombre de
// archivo. NUNCA usar música comercial con derechos.
// Si un archivo no existe, la pieza se renderiza en silencio sin error.

const existe = (ruta: string) => getStaticFiles().some((f) => f.name === ruta);

export const AudioAficion: React.FC = () => {
  const total = s(Object.values(ESCENAS_AFICION).reduce((m, e) => Math.max(m, e.inicio + e.duracion), 0));
  const fin02 = s(ESCENAS_AFICION.e02DeTresACatorce.inicio + ESCENAS_AFICION.e02DeTresACatorce.duracion);
  const cierre = marcador('cierre');
  const paso = (VIDEO.fps * 60) / MARCADORES_AFICION.tamborBpm;
  const tambores: number[] = [];
  for (let b = marcador('tamborInicio'); b < marcador('tamborFin'); b += paso) tambores.push(Math.round(b));
  const golpes = [marcador('golpeCatorceMil'), marcador('golpeMitadYMitad'), marcador('golpeCuatro52')];

  return (
    <>
      {existe(AUDIO_AFICION.ambiente) ? (
        <Audio
          src={staticFile(AUDIO_AFICION.ambiente)}
          // Murmullo lejano en la grada vacía; crece cuando se llena; se apaga en el cierre.
          volume={(f) =>
            interpolate(f, [0, s(5), fin02, cierre - s(1), cierre + s(1), total], [0.15, 0.25, 0.6, 0.45, 0, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
      {existe(AUDIO_AFICION.tambor)
        ? [...golpes.map((f) => ({f, v: 1})), ...tambores.map((f) => ({f, v: 0.7}))].map(({f, v}) => (
            <Sequence key={`tambor-${f}`} from={f} durationInFrames={s(1)} layout="none">
              <Audio src={staticFile(AUDIO_AFICION.tambor)} volume={v} />
            </Sequence>
          ))
        : null}
      {existe(AUDIO_AFICION.cierre) ? (
        <Sequence from={cierre} layout="none">
          <Audio src={staticFile(AUDIO_AFICION.cierre)} volume={0.9} />
        </Sequence>
      ) : null}
    </>
  );
};
