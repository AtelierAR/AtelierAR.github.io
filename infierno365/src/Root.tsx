import React from 'react';
import {Composition, Folder} from 'remotion';
import './constants/fonts';
import {DURACION_AFICION, VIDEO, s} from './constants/brand';
import {Aficion} from './Aficion';

export const RemotionRoot: React.FC = () => (
  <Folder name="INFIERNO365">
    <Composition
      id="Aficion"
      component={Aficion}
      durationInFrames={s(DURACION_AFICION)}
      fps={VIDEO.fps}
      width={VIDEO.ancho}
      height={VIDEO.alto}
    />
  </Folder>
);
