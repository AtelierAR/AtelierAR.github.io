import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {COLOR, ESCENAS_AFICION, EscenaAficion, s} from './constants/brand';
import {Grano} from './components/Grano';
import {CorteDiagonal} from './components/CorteDiagonal';
import {Escena01GradaVacia} from './scenes/aficion/Escena01GradaVacia';
import {Escena02DeTresACatorce} from './scenes/aficion/Escena02DeTresACatorce';
import {Escena03MasJoven} from './scenes/aficion/Escena03MasJoven';
import {Escena04MitadYMitad} from './scenes/aficion/Escena04MitadYMitad';
import {Escena05SeisTribus} from './scenes/aficion/Escena05SeisTribus';
import {Escena06CuatroDiamantes} from './scenes/aficion/Escena06CuatroDiamantes';
import {Escena07UnDia} from './scenes/aficion/Escena07UnDia';
import {Escena08LaMeta} from './scenes/aficion/Escena08LaMeta';
import {Escena09Transicion} from './scenes/aficion/Escena09Transicion';
import {AudioAficion} from './scenes/aficion/AudioAficion';

// Escenas que entran con corte diagonal a 18°. Las demás continúan la
// grada de la escena anterior y entran por corte directo.
const ESCENAS: {id: EscenaAficion; Componente: React.FC; corte: boolean}[] = [
  {id: 'e01GradaVacia', Componente: Escena01GradaVacia, corte: false},
  {id: 'e02DeTresACatorce', Componente: Escena02DeTresACatorce, corte: false},
  {id: 'e03MasJoven', Componente: Escena03MasJoven, corte: true},
  {id: 'e04MitadYMitad', Componente: Escena04MitadYMitad, corte: true},
  {id: 'e05SeisTribus', Componente: Escena05SeisTribus, corte: false},
  {id: 'e06CuatroDiamantes', Componente: Escena06CuatroDiamantes, corte: true},
  {id: 'e07UnDia', Componente: Escena07UnDia, corte: true},
  {id: 'e08LaMeta', Componente: Escena08LaMeta, corte: true},
  {id: 'e09Transicion', Componente: Escena09Transicion, corte: false},
];

/** ACTO II-B · LA AFICIÓN — "¿QUIÉN LLENA EL INFIERNO?" */
export const Aficion: React.FC = () => (
  <AbsoluteFill style={{background: COLOR.negro}}>
    {ESCENAS.map(({id, Componente, corte}) => {
      const e = ESCENAS_AFICION[id];
      return (
        <Sequence key={id} name={id} from={s(e.inicio)} durationInFrames={s(e.duracion)}>
          {corte ? (
            <CorteDiagonal>
              <Componente />
            </CorteDiagonal>
          ) : (
            <Componente />
          )}
        </Sequence>
      );
    })}
    <Grano />
    <AudioAficion />
  </AbsoluteFill>
);
