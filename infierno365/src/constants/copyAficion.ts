// ACTO II-B · LA AFICIÓN — todo el texto en pantalla y todas las cifras.
// Edita aquí; las escenas no tienen texto propio.
//
// Regla de fuentes: cada cifra lleva comentario con su fuente. Las cifras
// propias del proyecto INFIERNO 365 van marcadas como [estimación].
// Antes de presentar, verifica temporada y documento exacto de cada fuente.

export const COPY_AFICION = {
  modulo: 'ACTO II-B · LA AFICIÓN',
  pregunta: '¿QUIÉN LLENA EL INFIERNO?',

  // 02 · DE 3 MIL A 14 MIL
  asistencia: {
    // Fuente: Diablos Rojos del México / información a BMV — asistencia
    // promedio por juego en casa, hace una década (Fray Nano) → temporadas
    // recientes en el Estadio Alfredo Harp Helú.
    etapas: [3000, 11694, 14443],
    etiqueta: 'AFICIONADOS POR JUEGO',
    // Fuente: Diablos/BMV — ocupación promedio sobre aforo del estadio.
    ocupacionAntes: 59,
    ocupacionHoy: 72,
    ocupacionEtiqueta: 'OCUPACIÓN',
    golpe: '14 MIL',
    remate: 'EL ESTADIO QUE SE LLENÓ EN UNA DÉCADA.',
  },

  // 03 · LA AFICIÓN MÁS JOVEN
  edad: {
    etiqueta: 'EDAD PROMEDIO DEL AFICIONADO',
    // Fuente: Diablos/BMV — perfil del aficionado (edad promedio antes / hoy).
    antes: 60,
    hoy: 35,
    tagAntes: 'ANTES',
    tagHoy: 'HOY',
    unidad: 'AÑOS',
    // Fuente: Diablos/BMV — perfil del aficionado.
    menores45: 74,
    remate: 'TIENE MENOS DE 45 AÑOS.',
  },

  // 04 · MITAD Y MITAD
  mitad: {
    // Fuente: Diablos/BMV — perfil del aficionado por sexo.
    ellas: 50,
    ellos: 50,
    etiquetaEllas: 'ELLAS',
    etiquetaEllos: 'ELLOS',
    golpe: 'MITAD Y MITAD',
    remate: 'ELLAS YA SON MEDIO ESTADIO.',
  },

  // 05 · SEIS TRIBUS
  // Segmentación cualitativa de INFIERNO 365 [estimación]: no representa
  // proporciones; cada constelación tiene el mismo peso visual.
  tribus: {
    titulo: 'SEIS TRIBUS',
    lista: [
      {nombre: 'GENERACIÓN INFIERNO', pide: 'Terraza, música y la foto que se comparte.'},
      {nombre: 'ELLAS', pide: 'Seguridad, baños dignos y lugares cómodos.'},
      {nombre: 'FAMILIAS', pide: 'Espacio para niños y precios claros.'},
      {nombre: 'LOS DE SIEMPRE', pide: 'Su lugar, su ritual y su beisbol.'},
      {nombre: 'CORPORATIVO', pide: 'Palcos y salas para recibir invitados.'},
      {nombre: 'TURISTA', pide: 'Llegar fácil y llevarse una historia.'},
    ],
  },

  // 06 · EL MUNDO EN CUATRO DIAMANTES
  mundo: {
    titulo: 'EL MUNDO EN CUATRO DIAMANTES',
    lecciones: [
      {
        pais: 'ESTADOS UNIDOS',
        // Fuente: MLB — duración promedio de un juego de nueve entradas con
        // reloj de lanzamiento (temporada más reciente publicada).
        cifra: '2:38',
        minutos: 158,
        leccion: 'RITMO.',
        fuente: 'FUENTE: MLB',
      },
      {
        pais: 'JAPÓN',
        // Fuente: Fighters Sports & Entertainment (F Village, Hokkaido) —
        // duración promedio del juego vs. estancia promedio del visitante.
        juego: '3:12',
        juegoMin: 192,
        estancia: '4:52',
        estanciaMin: 292,
        etiquetaJuego: 'JUEGO',
        etiquetaEstancia: 'ESTANCIA',
        leccion: 'LA VISITA DURA MÁS QUE EL JUEGO.',
        fuente: 'FUENTE: FIGHTERS S&E · F VILLAGE',
      },
      {
        pais: 'COREA',
        // Fuente: KBO — participación de mujeres en la compra de boletos.
        porcentaje: 54,
        leccion: '54% DE LOS BOLETOS, COMPRADOS POR ELLAS.',
        fuente: 'FUENTE: KBO',
      },
      {
        pais: 'REPÚBLICA DOMINICANA',
        // Lección cualitativa (sin cifra).
        leccion: 'LA FIESTA ES EL PRODUCTO.',
        fuente: 'TAMBORA, BAILE Y GRADA',
      },
    ],
  },

  // 07 · UN DÍA EN EL INFIERNO
  dia: {
    titulo: 'UN DÍA EN EL INFIERNO',
    // Duración total de la visita: referencia F Village (4:52, ver arriba).
    totalMin: 292,
    inicio: '0:00',
    fin: '4:52',
    // Minutos por tramo: [estimación] ilustrativa de INFIERNO 365.
    // Deben sumar totalMin.
    tramos: [
      {nombre: 'LLEGADA\nEN METRO', min: 25},
      {nombre: 'PLAZA', min: 25},
      {nombre: 'COMIDA', min: 30},
      {nombre: 'FOTO', min: 12},
      {nombre: 'JUEGO', min: 120, juego: true},
      {nombre: 'SÉPTIMA', min: 15},
      {nombre: 'TERRAZA', min: 30},
      {nombre: 'MÚSICA', min: 25},
      {nombre: 'REGRESO', min: 10},
    ],
    remate1: 'EL JUEGO ES EL CENTRO.',
    remate2: 'LA EXPERIENCIA ES EL DÍA.',
  },

  // 08 · LA META
  meta: {
    titulo: 'LA META',
    // Fuente: Diablos/BMV — promedio actual (ver escena 02).
    desde: 14443,
    // Meta INFIERNO 365 [estimación]: 85 % de ocupación.
    hasta: 17000,
    etiqueta: 'AFICIONADOS POR JUEGO',
    // [estimación] 17,000 × ≈45 fechas en casa ≈ 767 mil.
    temporada: '≈ 767 MIL POR TEMPORADA',
    marca: '[ESTIMACIÓN]',
    ocupacionHoy: 72,
    ocupacionMeta: 85, // [estimación]
    ocupacionEtiqueta: 'OCUPACIÓN',
  },

  // 09 · TRANSICIÓN
  cierre: {
    linea1: 'UNA AFICIÓN QUE NO DEPENDE DE GANAR…',
    linea2a: '…NECESITA UNA CASA QUE',
    linea2b: 'NO DEPENDE DEL CALENDARIO.',
  },
} as const;
