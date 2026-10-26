#!/usr/bin/env bash
# Convierte el render de Remotion en un MP4 que reproduce cualquier equipo
# sin instalar nada: Windows (Fotos / Películas y TV), macOS (QuickTime),
# iPhone/iPad, Android, PowerPoint, Keynote y navegadores.
#   · H.264 High@4.0, yuv420p rango TV, BT.709 · AAC-LC 48 kHz estéreo
#   · moov al inicio (+faststart): arranca de inmediato, también en streaming
# Usa el ffmpeg que trae Remotion (npx remotion ffmpeg).
set -euo pipefail
cd "$(dirname "$0")/.."
ENTRADA="${1:-out/aficion_bruto.mp4}"
SALIDA="${2:-render/aficion_infierno365_1080p.mp4}"
npx remotion ffmpeg -hide_banner -loglevel error -y -i "$ENTRADA" \
  -vf "scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p" \
  -c:v libx264 -profile:v high -level:v 4.0 -preset slow -crf 18 -maxrate 12M -bufsize 24M -g 60 -r 30 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -brand mp42 "$SALIDA"
echo "✔ $SALIDA"
