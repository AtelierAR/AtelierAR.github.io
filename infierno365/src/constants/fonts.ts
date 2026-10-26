// Carga de tipografías vía @remotion/google-fonts (con fallbacks en brand.ts).
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

loadAnton('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
loadInter('normal', {weights: ['400', '600', '700'], subsets: ['latin', 'latin-ext']});
