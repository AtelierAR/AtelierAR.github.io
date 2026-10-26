/**
 * INFIERNO 365 · Todo el texto en pantalla (español de México).
 *
 * Edita aquí; las escenas no contienen texto propio.
 * ⚠ CIFRAS: cada dato lleva su fuente. Las marcadas «POR VALIDAR» vienen del
 *   brief y deben confirmarse con el club / la LMB antes de presentar.
 */

export const COPY = {
  // 03 · EL RÉCORD
  record: {
    /** Asistencia total de temporada regular 2025 en el Estadio Alfredo Harp Helú.
     *  Fuente: brief del cliente / comunicado del club, temporada 2025. POR VALIDAR. */
    asistencia: 592153,
    /** Cómo se asienta el contador. */
    asentado: '592 MIL',
    /** Año del récord anterior. Fuente: brief del cliente. POR VALIDAR. */
    anioAnterior: '1967',
    anioNuevo: '2025',
    /** 2025 − 1967 = 58 */
    texto: 'UN RÉCORD QUE DURÓ 58 AÑOS.',
  },

  // 04 · LA NUEVA AFICIÓN
  aficion: {
    /** Edad promedio de la afición, antes y hoy.
     *  Fuente: brief del cliente (estudio de perfil de aficionado del club). POR VALIDAR. */
    edadAntes: '60',
    edadHoy: '35',
    etiquetaAntes: 'ANTES',
    etiquetaHoy: 'HOY',
    texto: 'LA AFICIÓN ESCARLATA HOY TIENE 35 AÑOS.',
  },

  // 05 · DIECIOCHO CORONAS
  coronas: {
    /** Campeonatos de Serie del Rey / LMB de los Diablos Rojos del México.
     *  Fuente: palmarés oficial LMB. POR VALIDAR (18 títulos al cierre de 2025). */
    anios: [
      '1956', '1964', '1968', '1973', '1974', '1976', '1981', '1985', '1987',
      '1988', '1994', '1999', '2002', '2003', '2008', '2014', '2024', '2025',
    ],
    desde: '1940',
    hasta: 'HOY',
    destacado: '2024 · 2025',
    numero: '18',
    texto: 'DIECIOCHO CORONAS.',
  },

  // 07 · SEIS MESES EN SILENCIO
  meses: {
    /** Abril → marzo, en el orden del anillo. Los 6 primeros son temporada. */
    nombres: ['ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC', 'ENE', 'FEB', 'MAR'],
    mesesTemporada: 6,
    leyendaTemporada: 'TEMPORADA',
    leyendaSilencio: 'SIN JUEGO',
    texto: ['LA TEMPORADA DURA SEIS MESES.', 'LA CIUDAD, DOCE.'],
  },

  // 08 · EL DISTRITO
  distrito: {
    nodos: ['AUTÓDROMO', 'PALACIO DE LOS DEPORTES', 'ESTADIO GNP', 'METRO LÍNEA 9'],
    /** Distancia aproximada del estadio a los recintos vecinos.
     *  Fuente: medición propia sobre cartografía pública (radio desde home plate). POR VALIDAR. */
    /** El salto de línea (\n) es intencional: controla dónde corta la frase. */
    texto: 'EL DISTRITO DE EVENTOS MÁS PODEROSO DEL PAÍS,\nA 500 METROS.',
    radio: '500 M',
  },

  // 09 · LA PREGUNTA
  pregunta:
    '¿CÓMO CONVERTIMOS LA CASA DE LA DINASTÍA EN EL LUGAR DONDE LA CIUDAD DE MÉXICO QUIERE ESTAR, HAYA JUEGO O NO?',

  // 10 · INFIERNO 365
  cierre: {
    palabra: 'INFIERNO',
    numero: '365',
    subtitulo: 'UNA VISIÓN PARA LA CASA DE LA DINASTÍA ESCARLATA.',
  },
} as const;
