/**
 * INFIERNO 365 · Constantes de marca, tipografía y tiempos.
 *
 * Este archivo NO importa nada a propósito: también lo leen los scripts de Node
 * (stills y audio marcador). Todos los tiempos están en SEGUNDOS; las escenas
 * los convierten a cuadros con `seg()`.
 */

export const FPS = 30;
export const ANCHO = 1920;
export const ALTO = 1080;

/** Convierte segundos a cuadros (redondeado). */
export const seg = (s: number): number => Math.round(s * FPS);

// ─────────────────────────────────────────────────────────────── PALETA (estricta)
export const COLOR = {
  negro: '#0B0B0B', // Negro Infierno — fondo dominante
  rojo: '#D0021B', // Rojo Diablo — energía, números clave, líneas
  hueso: '#F5F3EF', // Blanco Hueso — texto
  carbon: '#1C1C1C', // apoyo
  grafito: '#2A2A2A', // apoyo
  rojoProfundo: '#8E0A14', // apoyo
  ceniza: '#6B6B6B', // gris ceniza — meses fuera de temporada (07) y arranque sin color (10)
} as const;

/**
 * Contraste (WCAG 2.x, sobre #0B0B0B):
 *  - Blanco Hueso  → 17.9 : 1  ✔ (todo el texto de lectura usa este color)
 *  - Rojo Diablo   →  3.5 : 1  ⚠ Solo se usa en cifras display ≥ 180 px
 *    ("592 MIL", "35", "18", "365"), que cumplen AA de texto grande (≥ 3 : 1)
 *    pero no 4.5 : 1. Ningún rojo puro alcanza 4.5 : 1 sobre negro (máx. 3.7 : 1).
 *    Si el consejo exige 4.5 : 1 estricto, cambia `ROJO_TEXTO` por COLOR.hueso:
 *    las cifras quedan en blanco y el rojo se conserva en filetes y anillos.
 *  - Gris ceniza   →  3.6 : 1  ✘ Nunca se usa para texto.
 */
export const ROJO_TEXTO: string = COLOR.rojo;

// ─────────────────────────────────────────────────────────────── TIPOGRAFÍA
export const TIPO = {
  display: '"Anton", "Bebas Neue", "Oswald", "Impact", "Arial Narrow", sans-serif',
  texto: '"Inter", "Helvetica Neue", "Arial", sans-serif',
  /** Interletraje cerrado para display (em). */
  trackingDisplay: '-0.01em',
  /** Interletraje del texto en mayúsculas (em). */
  trackingTexto: '0.04em',
  /** Tamaño mínimo permitido a 1080p (px). */
  minimo: 36,
} as const;

// ─────────────────────────────────────────────────────────────── LENGUAJE VISUAL
export const VISUAL = {
  anguloCorte: 18, // grados de los cortes diagonales
  filete: 2, // px de los filetes rojos
  granoOpacidad: 0.045, // ≤ 0.06
  /** Spring "con peso": damping alto, sin rebote. */
  spring: { damping: 200, stiffness: 120, mass: 1 },
  /** Spring de golpe: rápido, apenas un 2 % de sobretiro. */
  springGolpe: { damping: 22, stiffness: 260, mass: 0.9 },
} as const;

// ─────────────────────────────────────────────────────────────── STORYBOARD
/** Duración de cada escena en segundos. La suma es la duración total. */
export const ESCENAS = [
  { id: 'Escena01', nombre: 'LATIDO', dur: 4 },
  { id: 'Escena02', nombre: 'LA BRASA', dur: 4 },
  { id: 'Escena03', nombre: 'EL RÉCORD', dur: 8 },
  { id: 'Escena04', nombre: 'LA NUEVA AFICIÓN', dur: 6 },
  { id: 'Escena05', nombre: 'DIECIOCHO CORONAS', dur: 8 },
  { id: 'Escena07', nombre: 'SEIS MESES EN SILENCIO', dur: 8 },
  { id: 'Escena08', nombre: 'EL DISTRITO', dur: 10 },
  { id: 'Escena09', nombre: 'LA PREGUNTA', dur: 13 },
  { id: 'Escena10', nombre: 'INFIERNO 365', dur: 9 },
] as const;

export type EscenaId = (typeof ESCENAS)[number]['id'];

/** Segundo absoluto en que arranca cada escena. */
export const inicioEscena = (id: EscenaId): number => {
  let t = 0;
  for (const e of ESCENAS) {
    if (e.id === id) return t;
    t += e.dur;
  }
  throw new Error(`Escena desconocida: ${id}`);
};

export const DURACION_TOTAL = ESCENAS.reduce((a, e) => a + e.dur, 0);

/**
 * Tiempos internos de cada escena (segundos relativos al inicio de la escena).
 * Regla de lectura: cada texto queda en pantalla ≥ 2 × (palabras ÷ 3 palabras/s).
 */
export const T = {
  e01: { corteSilencio: 4 },
  e02: { subida: 3.6 },
  e03: { contador: 3.0, golpe: 3.0, anio1967: 3.3, tachado: 3.8, anio2025: 4.1, texto: 4.2 },
  e04: { rodillo: 0.8, durRodillo: 1.4, texto: 1.3 },
  e05: { primeraBarra: 0.6, pasoBarra: 0.18, destello: 4.2, golpe: 4.2, texto: 4.2 },
  e07: { anillo: 0.3, durAnillo: 2.4, texto: 1.6 },
  e08: { diamante: 0.2, durDiamante: 2.0, nodos: 1.8, pasoNodo: 0.45, lineas: 3.6, anillo: 5.0, texto: 3.0 },
  e09: { inicio: 0.6, palabrasPorSegundo: 3.0 },
  e10: { anillo: 0.2, durAnillo: 3.0, golpe: 3.4, subtitulo: 4.2, congelar: 6.0 },
} as const;

/** Cuadro "más fuerte" de cada escena (segundo relativo) para los stills del deck. */
export const CUADRO_FUERTE: Record<EscenaId, number> = {
  Escena01: 1.55,
  Escena02: 2.6,
  Escena03: 7.5,
  Escena04: 5.5,
  Escena05: 7.5,
  Escena07: 7.5,
  Escena08: 9.5,
  Escena09: 12.5,
  Escena10: 8.5,
};

// ─────────────────────────────────────────────────────────────── AUDIO / SINCRONÍA
/**
 * Puntos de sincronía para el diseñador de audio. Todo funciona con
 * `habilitado: false` (render mudo). Los archivos de /public/audio son
 * MARCADORES sintéticos: reemplázalos conservando el nombre.
 */
export const AUDIO = {
  habilitado: true,
  archivos: {
    canto: 'audio/canto_aficion.mp3',
    impacto: 'audio/impacto.mp3',
    ambiente: 'audio/ambiente.mp3',
  },
  /** Latidos del canto en la escena 01 (segundos absolutos). La línea late en estos tiempos. */
  latidos: [0.35, 0.75, 1.55, 1.95, 2.75, 3.15],
  /** Corte a silencio absoluto (seg. absoluto). Nada suena hasta `regresaAmbiente`. */
  silencio: 4.0,
  regresaAmbiente: 8.0,
  /** Golpes: los únicos 3 impactos de la pieza (seg. absolutos). */
  golpes: {
    milesRecord: inicioEscenaSeg('Escena03') + 3.0,
    coronas: inicioEscenaSeg('Escena05') + 4.2,
    infierno365: inicioEscenaSeg('Escena10') + 3.4,
  },
  volumen: { canto: 0.9, impacto: 1.0, ambiente: 0.35 },
} as const;

function inicioEscenaSeg(id: string): number {
  let t = 0;
  for (const e of ESCENAS) {
    if (e.id === id) return t;
    t += e.dur;
  }
  return 0;
}
