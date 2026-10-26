"""Rasterize the reference pages of the deck and cut the plates the animation uses.

    python3 scripts/extract_refs.py            # needs pdftoppm, Pillow, numpy, opencv-python-headless

Writes:
    reference/pages/p-NNN.png   200 DPI rasters of the pages listed in PAGES (git-ignored)
    public/ref/*.jpg|png        plates loaded by the animation (committed)

All boxes are in "2000-wide" page coordinates (the deck is 960x540 pt; at 200 DPI the
raster is 2667x1500, so every box is multiplied by S = 2667/2000).
"""
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(ROOT, "reference", "pages")
OUT = os.path.join(ROOT, "public", "ref")
PDF_CANDIDATES = [
    os.path.join(ROOT, "reference", "20261022_LFF_Eagles_HKS.pdf"),
    os.path.join(ROOT, "..", "20261022_LFF_Eagles_HKS_compressed.pdf"),
]
PAGES = [2, 4, 5, 6, 7, 9, 10, 11, 26, 27, 28, 29, 34, 35]
S = 2667 / 2000


def find_pdf():
    for p in PDF_CANDIDATES:
        if os.path.exists(p):
            return p
    sys.exit("Deck not found. Put it at reference/20261022_LFF_Eagles_HKS.pdf")


def rasterize(pdf):
    os.makedirs(PAGES_DIR, exist_ok=True)
    for n in PAGES:
        target = os.path.join(PAGES_DIR, f"p-{n:03d}.png")
        if os.path.exists(target):
            continue
        subprocess.run(["pdftoppm", "-png", "-r", "200", "-f", str(n), "-l", str(n), pdf,
                        os.path.join(PAGES_DIR, "p")], check=True)


def page(n):
    return cv2.imread(os.path.join(PAGES_DIR, f"p-{n:03d}.png"), cv2.IMREAD_COLOR)


def box(img, x0, y0, x1, y1):
    return img[int(y0 * S):int(y1 * S), int(x0 * S):int(x1 * S)].copy()


def rect_mask(shape, rects):
    m = np.zeros(shape[:2], np.uint8)
    for x0, y0, x1, y1 in rects:
        m[int(y0 * S):int(y1 * S), int(x0 * S):int(x1 * S)] = 255
    return m


def save(name, img, q=88):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    if name.endswith(".jpg"):
        cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, q])
    else:
        cv2.imwrite(path, img)
    print("wrote", os.path.relpath(path, ROOT), img.shape[1], "x", img.shape[0])


def remove_overlay(img, rects, light=150, also=None):
    """Inpaint the slide's own typography/linework out of a photo so our animated
    copy can sit on top without doubling. `rects` limit where light pixels count as text."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    region = rect_mask(img.shape, rects)
    m = ((gray > light) & (region > 0)).astype(np.uint8) * 255
    if also is not None:
        m |= also
    m = cv2.dilate(m, np.ones((7, 7), np.uint8), iterations=2)
    return cv2.inpaint(img, m, 9, cv2.INPAINT_TELEA)


def p4_crowd():
    img = page(4)
    b, g, r = [img[..., i].astype(int) for i in range(3)]
    line = (((g - r) > 30) & (g > 120)).astype(np.uint8) * 255          # green zigzag
    line &= rect_mask(img.shape, [(990, 600, 1900, 960)])
    clean = remove_overlay(img, [(95, 180, 1240, 370), (95, 400, 1510, 495),
                                 (130, 700, 1010, 840), (1030, 935, 1330, 975),
                                 (990, 630, 1006, 955)], light=120, also=line)
    save("p04_crowd.jpg", clean)


def p5_collage():
    img = page(5)
    clean = remove_overlay(img, [(670, 545, 1330, 612)], light=170)
    quads = {
        "p05_sign.jpg": (0, 28, 695, 628),
        "p05_fan.jpg": (697, 28, 2000, 628),
        "p05_train.jpg": (0, 630, 695, 1125),
        "p05_cityhall.jpg": (697, 630, 2000, 1125),
    }
    for name, bb in quads.items():
        save(name, box(clean, *bb))


# City outline traced by hand from p6 (2000-wide page coords). The deck's white stroke
# is open along the Delaware, so flood-filling it leaks; this polygon closes it.
P6_CITY = [(770, 282), (862, 340), (885, 315), (1055, 440), (1085, 440), (1140, 250), (1270, 140),
           (1410, 205), (1432, 240), (1430, 300), (1450, 380), (1440, 388), (1280, 510), (1210, 560),
           (1150, 620), (1060, 670), (1010, 700), (985, 750), (975, 800), (1000, 860), (1010, 900),
           (985, 950), (930, 960), (850, 975), (760, 1000), (680, 1000), (670, 960), (715, 880),
           (708, 790), (710, 720), (690, 700), (632, 676), (735, 610), (820, 555), (668, 408)]


def p6_hyperlocal():
    img = page(6)
    y0 = int(198 * S)
    save("p06_aerial.jpg", img[y0:])
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    poly = np.array([(int(x * S), int(y * S)) for x, y in P6_CITY])
    city = np.zeros_like(gray)
    cv2.fillPoly(city, [poly], 255)
    # Neighbourhoods are flat fills of different tone: drop labels and arterials,
    # cluster the fills, and keep the cluster boundaries inside the city.
    white = ((gray > 190) & (hsv[..., 1] < 70)).astype(np.uint8) * 255
    roads = ((gray < 75) & (hsv[..., 1] < 90)).astype(np.uint8) * 255
    holes = cv2.dilate(white, np.ones((3, 3), np.uint8), iterations=2) | cv2.dilate(roads, np.ones((3, 3), np.uint8))
    flat = cv2.medianBlur(cv2.inpaint(img, holes, 6, cv2.INPAINT_TELEA), 17)
    lab = cv2.cvtColor(flat, cv2.COLOR_BGR2LAB).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.3)
    cv2.setRNGSeed(7)
    _, _, cent = cv2.kmeans(lab[city > 0][::9].copy(), 8, None, crit, 4, cv2.KMEANS_PP_CENTERS)
    cluster = ((lab[..., None, :] - cent[None, None]) ** 2).sum(-1).argmin(-1).astype(np.uint8)
    cluster = cv2.medianBlur(cluster, 11)
    edge = np.zeros_like(gray)
    edge[:-1, :] |= (cluster[:-1, :] != cluster[1:, :]).astype(np.uint8) * 255
    edge[:, :-1] |= (cluster[:, :-1] != cluster[:, 1:]).astype(np.uint8) * 255
    edge &= cv2.erode(city, np.ones((9, 9), np.uint8))
    edge = drop_small(edge, 90)
    rim = np.zeros_like(gray)
    cv2.polylines(rim, [poly], True, 255, 4, cv2.LINE_AA)
    river = ((hsv[..., 0] > 78) & (hsv[..., 0] < 102) & (hsv[..., 1] > 100) & (hsv[..., 2] > 70)).astype(np.uint8) * 255
    river &= ~cv2.erode(city, np.ones((15, 15), np.uint8))
    river &= cv2.dilate(city, np.ones((121, 121), np.uint8))
    river = drop_small(cv2.morphologyEx(river, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)), 600)
    # channels (as RGB in the browser): R = neighbourhood boundaries, G = city rim, B = rivers
    save("p06_map_lines.png", np.dstack([river, rim, edge])[y0:])


def drop_small(mask, min_area):
    n, cc, st, _ = cv2.connectedComponentsWithStats(mask, 8)
    keep = np.where(st[:, cv2.CC_STAT_AREA] > min_area)[0]
    return np.isin(cc, keep[keep > 0]).astype(np.uint8) * 255


def p7_skyline():
    # Skyline band only: everything above y 505 is the slide's own typography, and the
    # stadium at right carries a logo, so the crop stops at x 1480.
    save("p07_skyline.jpg", box(page(7), 0, 505, 1480, 745))


def p9_title():
    img = page(9)
    b, g, r = [img[..., i].astype(int) for i in range(3)]
    tinted = (((g - r) > 45) & (g > 110)).astype(np.uint8) * 255      # green sub-line, teal dots
    tinted &= rect_mask(img.shape, [(205, 545, 845, 585), (1900, 440, 1975, 470)])
    clean = remove_overlay(img, [(205, 235, 780, 335), (415, 405, 1975, 470),
                                 (205, 680, 1310, 1045)], light=150, also=tinted)
    save("p09_bg.jpg", clean)


def p10_eras():
    img = page(10)
    panels = {
        "p10_past.jpg": (71, 262, 523, 765),
        "p10_contemporary.jpg": (537, 257, 989, 766),
        "p10_future.jpg": (1003, 257, 1456, 766),
        "p10_faithful.jpg": (1474, 257, 1928, 765),
        "p10_city.jpg": (858, 845, 1150, 1075),
        "p10_architecture.jpg": (1200, 815, 1495, 1075),
    }
    for name, bb in panels.items():
        save(name, box(img, *bb))


if __name__ == "__main__":
    rasterize(find_pdf())
    p4_crowd()
    p5_collage()
    p6_hyperlocal()
    p7_skyline()
    p9_title()
    p10_eras()
