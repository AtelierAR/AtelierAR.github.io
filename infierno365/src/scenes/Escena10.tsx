import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLOR, ROJO_TEXTO, seg, T, TIPO } from '../constants/brand';
import { COPY } from '../constants/copy';
import { Anillo365 } from '../components/Anillo365';
import { Brasas } from '../components/Brasas';
import { Diamante } from '../components/Diamante';
import { Luminaria } from '../components/Lineas';
import { estiloDisplay, estiloTexto, Golpe, Revelar } from '../components/Texto';
import { entrada, lerp, mezclar, tramo } from '../components/utilidades';

const MarcoLogo: React.FC<{ texto: string }> = ({ texto }) => (
  <div
    style={{
      width: 340,
      height: 120,
      border: `2px dashed ${COLOR.hueso}`,
      background: COLOR.negro,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...estiloTexto(36),
    }}
  >
    {texto}
  </div>
);

/** 10 · INFIERNO 365 — el anillo de 365 marcas se llena, el color regresa, golpe final. */
export const Escena10: React.FC = () => {
  const real = useCurrentFrame();
  const congelar = seg(T.e10.congelar);
  // A partir de `congelar` el cuadro queda 100 % estático (3 s de hold).
  const frame = Math.min(real, congelar);
  const cx = 960;
  const cy = 470;
  const llenado = tramo(frame, seg(T.e10.anillo), seg(T.e10.anillo + T.e10.durAnillo));
  const color = tramo(frame, seg(T.e10.anillo + 0.4), seg(T.e10.anillo + T.e10.durAnillo));
  const fGolpe = seg(T.e10.golpe);
  const tras = entrada(frame, fGolpe, 26);
  // Tras el golpe, el anillo crece y se atenúa para dar aire al texto.
  const radio = lerp(330, 720, tras);
  const opAnillo = lerp(1, 0.55, tras);
  const brasas = entrada(frame, seg(T.e10.anillo + 0.6), 50);
  const resplandor = real >= fGolpe ? Math.max(0, 1 - (frame - fGolpe) / 26) : 0;

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 48%, ${mezclar(COLOR.negro, COLOR.rojoProfundo, color * 0.55)} 0%, rgba(11,11,11,0) 70%)`,
        }}
      />
      <Luminaria x={200} y={20} radio={520} intensidad={0.14 * color} congelarEn={congelar} />
      <Luminaria x={1720} y={20} radio={520} intensidad={0.14 * color} fase={1.2} congelarEn={congelar} />
      <Brasas cantidad={60} semilla="e10" intensidad={brasas} congelarEn={congelar} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <Anillo365 cx={cx} cy={cy} radio={radio} progreso={llenado} color={color} opacidad={opAnillo} largo={lerp(34, 44, tras)} />
        <g opacity={lerp(1, 0.0, tras)}>
          <Diamante cx={cx} cy={cy} escala={0.78} trazo={1} outfield={1} cierre={1} color={mezclar(COLOR.ceniza, COLOR.hueso, color)} colorAnillo={mezclar(COLOR.ceniza, COLOR.rojo, color)} />
        </g>
      </svg>
      <AbsoluteFill style={{ background: `rgba(142,10,20,${0.35 * resplandor})` }} />

      {real >= fGolpe && (
        <div style={{ position: 'absolute', top: cy - 135, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <Golpe en={fGolpe}>
            <div style={{ display: 'flex', gap: '0.22em', ...estiloDisplay(270), lineHeight: 1 }}>
              <span style={{ color: COLOR.hueso }}>{COPY.cierre.palabra}</span>
              <span style={{ color: ROJO_TEXTO }}>{COPY.cierre.numero}</span>
            </div>
          </Golpe>
        </div>
      )}
      <div style={{ position: 'absolute', top: cy + 190, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Revelar desde={seg(T.e10.subtitulo)}>
          <div style={{ ...estiloTexto(42), fontFamily: TIPO.texto }}>{COPY.cierre.subtitulo}</div>
        </Revelar>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 72,
          left: 96,
          right: 96,
          display: 'flex',
          justifyContent: 'space-between',
          opacity: entrada(frame, seg(T.e10.logos), 24),
        }}
      >
        <MarcoLogo texto={COPY.cierre.logoCliente} />
        <MarcoLogo texto={COPY.cierre.logoFirma} />
      </div>
    </AbsoluteFill>
  );
};
