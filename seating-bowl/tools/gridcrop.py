"""Crop a rasterized deck page and overlay a labelled pixel grid (original 200-DPI px).
Usage: python3 -I gridcrop.py page.png x0 y0 x1 y1 step out.png [scale]"""
import sys
from PIL import Image, ImageDraw
src, x0, y0, x1, y1, step, out = sys.argv[1], *map(int, sys.argv[2:7]), sys.argv[7]
scale = float(sys.argv[8]) if len(sys.argv) > 8 else 1.0
im = Image.open(src).convert("RGB").crop((x0, y0, x1, y1))
if scale != 1.0:
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
d = ImageDraw.Draw(im)
for gx in range((x0 // step + 1) * step, x1, step):
    X = (gx - x0) * scale
    d.line([(X, 0), (X, im.height)], fill=(255, 0, 255), width=1)
    d.text((X + 2, 2), str(gx), fill=(200, 0, 200))
for gy in range((y0 // step + 1) * step, y1, step):
    Y = (gy - y0) * scale
    d.line([(0, Y), (im.width, Y)], fill=(0, 120, 255), width=1)
    d.text((2, Y + 2), str(gy), fill=(0, 80, 220))
im.save(out)
