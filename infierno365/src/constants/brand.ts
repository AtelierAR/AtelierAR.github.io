// INFIERNO 365 · Constantes de marca compartidas por todas las piezas.
// Paleta, tipografías, reglas de movimiento y tiempos. Si cambias algo aquí,
// cambia en todas las composiciones.

export const COLOR = {
  negro: '#0B0B0B', // Negro Infierno · fondo
  rojo: '#D0021B', // Rojo Diablo · acento, cifras protagonistas
  hueso: '#F5F3EF', // Blanco Hueso · todo el texto de lectura
  carbon: '#1C1C1C', // apoyo
  grafito: '#2A2A2A', // apoyo · asientos apagados
  vino: '#8E0A14', // apoyo · rojo profundo
  ceniza: '#6B6B6B', // gris ceniza · SOLO datos del pasado
} as const;

// Contraste sobre Negro Infierno (WCAG):
//   hueso 17.6:1 ✔ · rojo 3.5:1 · ceniza 3.6:1
// Por eso el rojo y el ceniza solo se usan en cifras display ≥ 100 px y en
// gráficos; todo texto de lectura va en hueso (o hueso sobre rojo, 5.1:1).

export const FUENTE = {
  display: '"Anton", "Impact", "Arial Narrow", sans-serif',
  texto: '"Inter", "Helvetica Neue", Arial, sans-serif',
} as const;

// Ningún texto por debajo de 36 px a 1080p.
export const TAMANO_MIN = 36;

export const VIDEO = {
  ancho: 1920,
  alto: 1080,
  fps: 30,
} as const;

/** Segundos → frames. */
export const s = (segundos: number) => Math.round(segundos * VIDEO.fps);

// Lenguaje visual
export const ANGULO_CORTE = 18; // grados · cortes diagonales y división de la grada
export const FILETE = 2; // px · filetes rojos
export const GRANO = 0.05; // opacidad del grano fílmico (≤ 6 %)

// Movimiento con peso: spring con damping alto (sin rebote).
export const SPRING_PESO = {damping: 200, stiffness: 120, mass: 1};
// Golpe visual (solo tres momentos): entra rápido, se asienta sin rebotar.
export const SPRING_GOLPE = {damping: 26, stiffness: 260, mass: 0.9};

// ── ACTO II-B · LA AFICIÓN ─────────────────────────────────────────────
// Storyboard en segundos. Ajusta inicio/duración y todo se recalcula.
export const ESCENAS_AFICION = {
  e01GradaVacia: {inicio: 0, duracion: 5},
  e02DeTresACatorce: {inicio: 5, duracion: 9},
  e03MasJoven: {inicio: 14, duracion: 7},
  e04MitadYMitad: {inicio: 21, duracion: 6},
  e05SeisTribus: {inicio: 27, duracion: 10},
  e06CuatroDiamantes: {inicio: 37, duracion: 15},
  e07UnDia: {inicio: 52, duracion: 12},
  e08LaMeta: {inicio: 64, duracion: 8},
  e09Transicion: {inicio: 72, duracion: 6},
} as const;

export type EscenaAficion = keyof typeof ESCENAS_AFICION;

export const DURACION_AFICION = Object.values(ESCENAS_AFICION).reduce(
  (max, e) => Math.max(max, e.inicio + e.duracion),
  0,
); // 78 s

// Marcadores de sincronía (segundos absolutos en la pieza). Los visuales
// y el audio leen de aquí: mueve un marcador y ambos se mueven juntos.
export const MARCADORES_AFICION = {
  golpeCatorceMil: 10.5, // escena 02 · se asienta "14 MIL"
  golpeMitadYMitad: 22.6, // escena 04 · "MITAD Y MITAD"
  golpeCuatro52: 42.6, // escena 06 · el reloj de estancia llega a 4:52
  tamborInicio: 48.2, // escena 06 · República Dominicana
  tamborFin: 52,
  tamborBpm: 120, // 2 golpes por segundo (< 3 destellos/s)
  cierre: 72, // escena 09
} as const;

/** Frame absoluto de un marcador. */
export const marcador = (m: keyof typeof MARCADORES_AFICION) =>
  s(MARCADORES_AFICION[m]);

/** Frame de un marcador relativo al inicio de una escena. */
export const marcadorLocal = (
  m: keyof typeof MARCADORES_AFICION,
  escena: EscenaAficion,
) => s(MARCADORES_AFICION[m] - ESCENAS_AFICION[escena].inicio);

// Audio (marcadores, no pistas finales). Rutas relativas a /public.
export const AUDIO_AFICION = {
  ambiente: 'audio/aficion/ambiente.wav',
  tambor: 'audio/aficion/tambor.wav',
  cierre: 'audio/aficion/cierre.wav',
} as const;

// Cuadro "más fuerte" de cada escena (segundos absolutos) para los stills.
export const STILLS_AFICION: Record<EscenaAficion, number> = {
  e01GradaVacia: 3.8,
  e02DeTresACatorce: 12.6,
  e03MasJoven: 19.5,
  e04MitadYMitad: 25.5,
  e05SeisTribus: 36.0,
  e06CuatroDiamantes: 51.0,
  e07UnDia: 62.8,
  e08LaMeta: 70.5,
  e09Transicion: 77.0,
};
