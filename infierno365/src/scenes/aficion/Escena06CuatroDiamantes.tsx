import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR, FUENTE, MARCADORES_AFICION, SPRING_GOLPE, marcadorLocal} from '../../constants/brand';
import {COPY_AFICION} from '../../constants/copyAficion';
import {Diamante} from '../../components/Diamante';
import {Reloj, RelojDoble} from '../../components/RelojDoble';
import {FeedVertical} from '../../components/FeedVertical';
import {PulsoTambor} from '../../components/PulsoTambor';
import {Texto, usarEntrada} from '../../components/Texto';

const CELDA = {alto: 460, ancho: 960, arriba: 140};
const DURACION_LECCION = 105; // ≈ 3.5 s
const INICIO_LECCION = (i: number) => 20 + i * DURACION_LECCION;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Celda: React.FC<{
  indice: number;
  pais: string;
  leccion: string;
  fuente: string;
  children: (centro: {x: number; y: number}, inicio: number) => React.ReactNode;
}> = ({indice, pais, leccion, fuente, children}) => {
  const frame = useCurrentFrame();
  const inicio = INICIO_LECCION(indice);
  const x0 = (indice % 2) * CELDA.ancho;
  const y0 = CELDA.arriba + Math.floor(indice / 2) * CELDA.alto;
  const centro = {x: x0 + 270, y: y0 + 215};
  const dibujo = interpolate(frame, [inicio, inicio + 30], [0, 1], clamp);
  const pFilete = usarEntrada(inicio + 14);
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <Diamante cx={centro.x} cy={centro.y} radio={190} progreso={dibujo} />
        {frame >= inicio ? children(centro, inicio) : null}
      </svg>
      <div style={{position: 'absolute', left: x0 + 500, top: y0 + 40, width: 420}}>
        <div style={{width: 120 * pFilete, height: 2, background: COLOR.rojo, marginBottom: 14}} />
        <Texto desde={inicio + 14} tamano={36} display={false} peso={700} espaciado="0.1em">
          {pais}
        </Texto>
        <Texto desde={inicio + 22} tamano={50} style={{marginTop: 14}}>
          {leccion}
        </Texto>
        <Texto
          desde={inicio + 30}
          tamano={36}
          display={false}
          peso={400}
          color="rgba(245,243,239,0.72)"
          style={{marginTop: 16}}
        >
          {fuente}
        </Texto>
      </div>
    </>
  );
};

// 06 · EL MUNDO EN CUATRO DIAMANTES — una lección por país.
export const Escena06CuatroDiamantes: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [eu, jp, kr, rd] = COPY_AFICION.mundo.lecciones;
  const golpe = marcadorLocal('golpeCuatro52', 'e06CuatroDiamantes');
  const tamborInicio = marcadorLocal('tamborInicio', 'e06CuatroDiamantes');
  const tamborFin = marcadorLocal('tamborFin', 'e06CuatroDiamantes');
  const paso = (fps * 60) / MARCADORES_AFICION.tamborBpm;
  const beats: number[] = [];
  for (let b = tamborInicio; b < tamborFin; b += paso) beats.push(Math.round(b));

  return (
    <AbsoluteFill style={{background: COLOR.negro}}>
      <div style={{position: 'absolute', left: 96, top: 52, opacity: usarEntrada(2), fontFamily: FUENTE.display, fontSize: 60, color: COLOR.hueso}}>
        {COPY_AFICION.mundo.titulo}
      </div>
      {/* Filetes de la cuadrícula */}
      <div style={{position: 'absolute', left: 959, top: 170, width: 2, height: 860 * usarEntrada(6, 30), background: COLOR.grafito}} />
      <div style={{position: 'absolute', left: 96, top: 140 + CELDA.alto - 1, width: 1728 * usarEntrada(6, 30), height: 2, background: COLOR.grafito}} />

      <Celda indice={0} pais={eu.pais} leccion={eu.leccion} fuente={eu.fuente}>
        {(c, inicio) => (
          <Reloj
            cx={c.x}
            cy={c.y}
            radio={104}
            minutos={interpolate(frame, [inicio + 12, inicio + 58], [0, eu.minutos], clamp)}
            color={COLOR.hueso}
            tamanoCifra={66}
          />
        )}
      </Celda>

      <Celda indice={1} pais={jp.pais} leccion={jp.leccion} fuente={jp.fuente}>
        {(c, inicio) => (
          <RelojDoble
            cx={c.x}
            cy={c.y}
            minutosJuego={interpolate(frame, [inicio + 12, inicio + 40], [0, jp.juegoMin], clamp)}
            minutosEstancia={interpolate(frame, [inicio + 16, golpe], [0, jp.estanciaMin], clamp)}
            etiquetaJuego={jp.etiquetaJuego}
            etiquetaEstancia={jp.etiquetaEstancia}
            crecimiento={spring({frame: frame - golpe, fps, config: SPRING_GOLPE})}
          />
        )}
      </Celda>

      <Celda indice={2} pais={kr.pais} leccion={kr.leccion} fuente={kr.fuente}>
        {(c, inicio) => (
          <FeedVertical
            cx={c.x}
            cy={c.y}
            desplazamiento={Math.max(0, frame - inicio - 10) * 3.4}
            opacidad={interpolate(frame, [inicio + 8, inicio + 22], [0, 1], clamp)}
          />
        )}
      </Celda>

      <Celda indice={3} pais={rd.pais} leccion={rd.leccion} fuente={rd.fuente}>
        {(c, inicio) => (
          <PulsoTambor
            cx={c.x}
            cy={c.y}
            frame={frame}
            beats={beats}
            aparicion={interpolate(frame, [inicio + 6, inicio + 20], [0, 1], clamp)}
          />
        )}
      </Celda>
    </AbsoluteFill>
  );
};
