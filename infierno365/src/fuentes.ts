import { loadFont as cargarAnton } from '@remotion/google-fonts/Anton';
import { loadFont as cargarInter } from '@remotion/google-fonts/Inter';

// Solo los pesos y subconjuntos que se usan (el subconjunto «latin» incluye á é í ó ú ñ ¿ ¡ « » − ·).
cargarAnton('normal', { subsets: ['latin'] });
cargarInter('normal', { weights: ['500', '600', '700'], subsets: ['latin'] });
