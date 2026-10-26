"""Derive runtime textures from the rasterized reference pages (run `npm run pages` first).

Outputs to public/assets/:
  elev_{n,e,s,w}.png   line art of p30-33, alpha = ink, cropped to the drawing
  elev.json            crop metadata + scale calibration (px per ft from the scale bars)
  title_players.jpg    p12 football-player texture with the title lettering removed
  siteplan.jpg         p74 proposed site plan (Studio MLA), cropped to the map
  siteplan.json        stadium centre in px and ft/px used to drape it under the model
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, 'reference', 'pages')
OUT = os.path.join(ROOT, 'public', 'assets')
os.makedirs(OUT, exist_ok=True)


def page(n, mode='RGB'):
    return Image.open(os.path.join(PAGES, f'p-{n:03d}.png')).convert(mode)


def blur(x, r, passes=3):
    """Separable box blur repeated -> approximately Gaussian (float arrays)."""
    for _ in range(passes):
        for ax in (0, 1):
            c = np.cumsum(np.pad(x, [(r + 1, r) if i == ax else (0, 0) for i in range(x.ndim)], mode='edge'), axis=ax)
            hi = np.take(c, range(2 * r + 1, c.shape[ax]), axis=ax)
            lo = np.take(c, range(0, c.shape[ax] - 2 * r - 1), axis=ax)
            x = (hi - lo) / (2 * r + 1)
    return x


def scale_bar_px_per_ft(gray):
    """The deck's graphic scale bar is a stepped bar 0-200 ft in the lower right."""
    H, W = gray.shape
    best = None
    for y in range(int(H * 0.68), int(H * 0.78)):
        xs = np.where(gray[y, int(W * 0.6):int(W * 0.95)] < 100)[0]
        if len(xs) > 150:
            x0, x1 = xs.min(), xs.max()
            best = (x0, x1) if best is None else (min(best[0], x0), max(best[1], x1))
    x0, x1 = best
    return (x1 - x0) / 200.0


meta = {}
for key, n in [('n', 30), ('e', 31), ('s', 32), ('w', 33)]:
    g = np.asarray(page(n, 'L')).astype(np.int32)
    H, W = g.shape
    ppf = scale_bar_px_per_ft(g)
    region = g[int(H * 0.15):int(H * 0.70), :]
    ink = region < 170
    # ground line = row with the longest run of ink
    row_counts = ink.sum(axis=1)
    gy = int(np.argmax(row_counts))
    above = ink[:gy - 2, :]
    ys, xs = np.where(above)
    bx0, bx1, by0 = int(xs.min()), int(xs.max()), int(ys.min())
    gxs = np.where(ink[gy])[0]
    cx0, cx1 = int(min(gxs.min(), bx0)) - 8, int(max(gxs.max(), bx1)) + 8
    cy0, cy1 = by0 - 8, gy + 10
    crop = region[cy0:cy1, cx0:cx1]
    alpha = np.clip((235 - crop) * 255 / 200, 0, 255).astype(np.uint8)
    img = Image.fromarray(np.dstack([np.full_like(alpha, 255)] * 3 + [alpha]).astype(np.uint8), 'RGBA')
    img.save(os.path.join(OUT, f'elev_{key}.png'), optimize=True)
    meta[key] = {
        'page': n, 'w': img.width, 'h': img.height, 'pxPerFt': round(float(ppf), 4),
        'groundY': gy - cy0, 'buildingX0': bx0 - cx0, 'buildingX1': bx1 - cx0, 'topY': by0 - cy0,
        'widthFt': round(float((bx1 - bx0) / ppf), 1), 'heightFt': round(float((gy - by0) / ppf), 1),
    }
    print(key, meta[key])
json.dump(meta, open(os.path.join(OUT, 'elev.json'), 'w'), indent=2)

# --- p12 title card: remove the lettering so we can set the title live -------------
im = page(12)
a = np.asarray(im).astype(np.float32)
W, H = im.size
lum = a.mean(axis=2)
mask = np.zeros(lum.shape, bool)
x0, x1, y0, y1 = int(W * 0.50), int(W * 0.985), int(H * 0.43), int(H * 0.66)
mask[y0:y1, x0:x1] = lum[y0:y1, x0:x1] > 120
m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
mask = np.asarray(m) > 0
keep = (~mask).astype(np.float32)
num = np.stack([blur(a[..., c] * keep, 16) for c in range(3)], -1)
den = blur(keep, 16)[..., None]
fill = num / np.maximum(den, 1e-3)
out = np.where(mask[..., None], fill, a).clip(0, 255).astype(np.uint8)
Image.fromarray(out).resize((1920, 1080), Image.LANCZOS).save(os.path.join(OUT, 'title_players.jpg'), quality=88)

# --- p74 proposed site plan ---------------------------------------------------------
sp = page(74)
W, H = sp.size
k = W / 1400.0
box = (int(87 * k), 0, int(1208 * k), int(725 * k))
crop = sp.crop(box)
arr = np.asarray(crop).astype(np.int32)
# locate the playing field (saturated green) to anchor the stadium centre
r, g_, b = arr[..., 0], arr[..., 1], arr[..., 2]
field = (g_ > 150) & (g_ - r > 40) & (g_ - b > 40)
ys, xs = np.where(field)
# keep the largest blob roughly: restrict to the stadium zone (right half)
sel = xs > crop.width * 0.55
fx0, fx1, fy0, fy1 = xs[sel].min(), xs[sel].max(), ys[sel].min(), ys[sel].max()
crop.save(os.path.join(OUT, 'siteplan.jpg'), quality=86)
stadium_px = (1020 - 660) * k  # N-S extent of the stadium roof outline on p74 (1400px preview coords)
spmeta = {
    'page': 74, 'w': crop.width, 'h': crop.height,
    'fieldCenterPx': [float((fx0 + fx1) / 2), float((fy0 + fy1) / 2)],
    'fieldBoxPx': [int(fx0), int(fy0), int(fx1), int(fy1)],
    'ftPerPx': round(1037.0 / stadium_px, 4),
    'note': 'image left = deck north (plaza); image up = deck east. ftPerPx assumes the 1,037 ft N-S extent measured on the east elevation (p31).',
}
json.dump(spmeta, open(os.path.join(OUT, 'siteplan.json'), 'w'), indent=2)
print(spmeta)
