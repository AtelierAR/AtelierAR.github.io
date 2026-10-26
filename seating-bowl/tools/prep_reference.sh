#!/usr/bin/env bash
# Rasterize the deck pages used by the film at 200 DPI into reference/pages/
# and cut the p36 title-card texture. Requires poppler-utils + ImageMagick.
set -euo pipefail
cd "$(dirname "$0")/.."
PDF=reference/20261022_LFF_Eagles_HKS.pdf
mkdir -p reference/pages src/assets
for p in 36 37 38 39 40 41 42 44 45 50 51 52 53 54 55 56 57 58 59 61 62 63 64 67 68 70 71; do
  out=$(printf "reference/pages/p-%03d.png" "$p")
  [ -f "$out" ] || pdftoppm -png -r 200 -f "$p" -l "$p" "$PDF" reference/pages/p
done
# p36 player-silhouette texture (left 62% of the page, without the title type)
convert reference/pages/p-036.png -crop 1650x1500+0+0 +repage -colorspace Gray \
  -level 8%,92% -resize 1600x -quality 82 src/assets/p36_players.jpg
echo "reference pages + assets ready"
