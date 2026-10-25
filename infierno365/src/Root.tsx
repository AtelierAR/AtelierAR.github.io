import React from 'react';
import { AbsoluteFill, Composition, Folder, useVideoConfig } from 'remotion';
import './fuentes';
import { Apertura } from './Apertura';
import { ALTO, ANCHO, COLOR, DURACION_TOTAL, ESCENAS, FPS, seg } from './constants/brand';
import { Grano } from './components/Grano';
import { ESCENA_COMPONENTE } from './scenes';

/** Escala el lienzo de diseño (1920×1080) al tamaño de la composición (p. ej. 4K). */
const Escalador: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useVideoConfig();
  const k = width / ANCHO;
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <div style={{ width: ANCHO, height: ALTO, transform: `scale(${k})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const AperturaEscalada: React.FC = () => (
  <Escalador>
    <Apertura />
  </Escalador>
);

export const Root: React.FC = () => (
  <>
    <Composition id="Apertura" component={Apertura} durationInFrames={seg(DURACION_TOTAL)} fps={FPS} width={ANCHO} height={ALTO} />
    <Composition id="Apertura4K" component={AperturaEscalada} durationInFrames={seg(DURACION_TOTAL)} fps={FPS} width={ANCHO * 2} height={ALTO * 2} />
    <Folder name="Escenas">
      {ESCENAS.map((e) => {
        const Componente = ESCENA_COMPONENTE[e.id];
        const ConGrano: React.FC = () => (
          <AbsoluteFill>
            <Componente />
            <Grano />
          </AbsoluteFill>
        );
        return <Composition key={e.id} id={e.id} component={ConGrano} durationInFrames={seg(e.dur)} fps={FPS} width={ANCHO} height={ALTO} />;
      })}
    </Folder>
  </>
);
