#!/usr/bin/env bash
# Genera los MARCADORES de audio de "Aficion" con ffmpeg (síntesis pura,
# libres de derechos). Son guías de sincronía, no pistas finales: el
# presentador debe reemplazarlos por audio propio o con licencia.
set -euo pipefail
cd "$(dirname "$0")/../public/audio/aficion"

# Murmullo de grada: ruido café grave + ruido rosa filtrado con leve trémolo.
ffmpeg -y -loglevel error \
  -f lavfi -i "anoisesrc=d=80:c=brown:a=0.6:seed=7" \
  -f lavfi -i "anoisesrc=d=80:c=pink:a=0.25:seed=11" \
  -filter_complex "[0]lowpass=f=260[a];[1]bandpass=f=650:width_type=h:w=600,tremolo=f=2.3:d=0.35[b];[a][b]amix=inputs=2:normalize=0,afade=t=in:d=2,afade=t=out:st=77:d=3,volume=0.8" \
  -ar 24000 -ac 1 ambiente.wav

# Un golpe de tambor: tono grave con caída de afinación + ataque de ruido.
ffmpeg -y -loglevel error \
  -f lavfi -i "aevalsrc=0.9*sin(2*PI*(48+90*exp(-t*18))*t)*exp(-t*7)+0.25*(random(0)*2-1)*exp(-t*40):s=48000:d=0.9" \
  -ac 2 tambor.wav

# Cierre: un pulso grave que crece y se corta.
ffmpeg -y -loglevel error \
  -f lavfi -i "aevalsrc=(0.5*sin(2*PI*44*t)+0.25*sin(2*PI*88*t))*min(t/4\,1)*if(lt(t\,5.9)\,1\,0):s=48000:d=6" \
  -af "afade=t=in:d=0.5" -ac 2 cierre.wav
ls -la
