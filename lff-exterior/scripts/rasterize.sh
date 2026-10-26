#!/usr/bin/env bash
# Rasterize the reference pages used by this animation at 200 DPI.
# Usage: npm run pages   (expects ./reference/20261022_LFF_Eagles_HKS.pdf)
set -euo pipefail
cd "$(dirname "$0")/.."
PDF=reference/20261022_LFF_Eagles_HKS.pdf
mkdir -p reference/pages
for p in 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 66 73 74 75 76 79 80; do
  pdftoppm -png -r 200 -f "$p" -l "$p" "$PDF" reference/pages/p
done
ls reference/pages
