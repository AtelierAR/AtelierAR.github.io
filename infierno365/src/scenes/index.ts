import React from 'react';
import type { EscenaId } from '../constants/brand';
import { Escena01 } from './Escena01';
import { Escena02 } from './Escena02';
import { Escena03 } from './Escena03';
import { Escena04 } from './Escena04';
import { Escena05 } from './Escena05';
import { Escena07 } from './Escena07';
import { Escena08 } from './Escena08';
import { Escena09 } from './Escena09';
import { Escena10 } from './Escena10';

export const ESCENA_COMPONENTE: Record<EscenaId, React.FC> = {
  Escena01,
  Escena02,
  Escena03,
  Escena04,
  Escena05,
  Escena07,
  Escena08,
  Escena09,
  Escena10,
};
