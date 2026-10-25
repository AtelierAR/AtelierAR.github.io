/**
 * Genera las pistas MARCADOR de /public/audio con ffmpeg (100 % sintéticas, sin derechos de terceros).
 * Lee los latidos de src/constants/brand.ts para que el canto marcador coincida con el ECG.
 *   node scripts/audio-marcadores.mjs
 * El diseñador de audio debe reemplazar estos archivos conservando los nombres.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { AUDIO, DURACION_TOTAL } from '../src/constants/brand.ts';

const dir = 'public/audio';
mkdirSync(dir, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });

// Canto marcador: bombo grave + golpe de palmas en cada latido.
const golpe = (b) =>
  `between(t,${b},${b + 0.6})*(` +
  `0.9*exp(-(t-${b})*9)*sin(2*PI*52*(t-${b})+18*(1-exp(-(t-${b})*25)))` +
  `+0.25*exp(-(t-${b})*38)*(random(0)*2-1))`;
const canto = AUDIO.latidos.map(golpe).join('+');
ff(['-f', 'lavfi', '-i', `aevalsrc='${canto}':s=48000:d=${AUDIO.silencio}`, '-af', 'highpass=f=30,alimiter=limit=0.9', '-ac', '2', '-b:a', '192k', `${dir}/canto_aficion.mp3`]);

// Impacto marcador: sub grave con transitorio.
ff([
  '-f', 'lavfi', '-i',
  `aevalsrc='0.95*exp(-t*2.4)*sin(2*PI*(36+50*exp(-t*9))*t)+0.35*exp(-t*28)*(random(0)*2-1)':s=48000:d=2.5`,
  '-af', 'lowpass=f=2500,alimiter=limit=0.95', '-ac', '2', '-b:a', '192k', `${dir}/impacto.mp3`,
]);

// Ambiente marcador: rumor grave de estadio (ruido marrón filtrado con respiración lenta).
const dur = Math.ceil(DURACION_TOTAL - AUDIO.regresaAmbiente) + 2;
ff([
  '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.5:d=${dur}:seed=365`,
  '-af', `lowpass=f=420,highpass=f=40,volume='0.8+0.2*sin(2*PI*t/7)':eval=frame,afade=t=in:d=1.5`,
  '-ac', '2', '-b:a', '160k', `${dir}/ambiente.mp3`,
]);
console.log('Pistas marcador generadas en', dir);
