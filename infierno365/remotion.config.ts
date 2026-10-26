// Configuración de render de INFIERNO 365.
// Documentación: https://www.remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
// Si tu máquina no puede descargar el navegador de Remotion, apunta a un
// Chrome/Chromium local con la variable REMOTION_BROWSER (ver README).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
