# Reference notes

**Source:** `reference/20261022_LFF_Eagles_HKS.pdf` (140 pages), HKS Concept Pricing Package, Oct 22 2026.
`npm run pages` rasterizes the pages below at 200 DPI (`pdftoppm -png -r 200`) into `reference/pages/`. That folder is git-ignored and can be regenerated. `npm run prep` then derives the runtime assets.

Pixel coordinates below are in 1080p space: the 960 × 540 pt page × 2.

## What was used, page by page

| Page | Content | Used for |
|---|---|---|
| 11 | Materiality / inspiration palette | Overall tone. The dark brick, blackened steel and glass mood |
| 12 | "Exterior Design and Materials" title card | Scene 1 card: the football-player texture (lettering removed in `prep_assets.py`) on midnight green, with the title set live |
| 13 | Material swatch grid with areas | Swatch colours (table below), area figures cross-checked against p19 / p22 |
| 14–18, 20, 21 | Single-material isolations on the white model | The scene 2 "switch-on, rest at 40 %" treatment; massing plan extents; the canopy as long sideline wings |
| 19 | Facade materials table | All scene 2 figures, copied verbatim (`src/data.js` → `FACADE`) |
| 22 | Roof materials table | Scene 4 rows (reflective 365,438.54 SF · 82.2 %, soffit 79,220.39 SF · 17.8 %); PV 9,198 panels · 5.3 MWp |
| 23–25 | Material assemblies with BOD callouts | Scene 3 build-ups and callout text |
| 26–29 | Plaza View, VIP Entry East, Alternate GA, GA West Entry | Massing silhouette, arrival cameras, leader-label text, positions and bands |
| 30–33 | Elevations N / E / S / W | Heights and extents (scale-bar calibrated); scene 6 line art |
| 34, 35 | Long and cross sections | Concourse levels (30 / 58 / 88 ft), bowl rim, canopy struts |
| 66 | Massing axon with both videoboard volumes | Board positions: a trapezoidal volume at each end |
| 73–76 | Existing and proposed site plans (Studio MLA) | Scene 7 site-plan drape (p74), ticketing canopy paths and lengths (p76) |
| 79, 80 | Conditioned vs open-air | Scene 4 overlay: 96 %, and 1,091,547 → 1,285,525 SF conditioned |

## Scale calibration

- The elevation graphic scale bars (p30–33) span 398 px for 200 ft at 200 DPI, which is **1.99 px/ft**. Sections p34/p35 use the same scale. `scripts/prep_assets.py` detects this automatically and writes it to `public/assets/elev.json`.
- Measured drawing extents (building only, excluding the ground line):

| Elevation | Width | Height |
|---|---|---|
| North (p30) | 953 ft | 188 ft (incl. signage) |
| East (p31) | 1,071 ft | 187 ft |
| South (p32) | 927 ft | 185 ft |
| West (p33) | 1,059 ft | 186 ft |

- From the north elevation at 1.065 px/ft on the 1400 px preview:
  - Videoboard: ~210 ft wide, 44 → 164 ft
  - NE circulation tower: X 161–199 ft, ~180 ft tall
  - Canopies: read at 157–172 ft
- Site plan p74: ftPerPx = 1.512 at 200 DPI. This assumes the stadium's N–S extent is the 1,037 ft measured on p31.

## Material swatches (p13, median of each swatch)

| Material | Rendered median | Albedo used (`SWATCH`) | Note |
|---|---|---|---|
| Masonry | `#4A4743` | `#6E655D` + speck `#2E2722` | Iron-spot, 4" × 12" stack-bond module |
| Metal panel | `#4C4F50` | `#4A4643` | Near-black, warm cast; painted (PVDF), so dielectric |
| Fins | `#414245` | `#6B655D` | Dark bronze-grey ACM; painted |
| Glazing | `#77838C` | `#7E8C93` | Cool grey-green, reflective |
| Mesh | `#3E453F` | `#4C5550` | Powder-coated aluminium |
| Soffit | `#2C2C28` (in shade) | `#B4B7B9`, metallic | Brushed aluminium |
| Reflective soffit | `#413A2D` (reflection) | Mirror, 316 SS | Live planar reflection |

The swatch medians are rendered values, lit and partly in shade. Albedos were lifted so the PBR result reads like the swatches.

## Modelling decisions (renderings win over elevations, per the brief)

1. **Canopy wings.** Four planar wings, NE / SE / NW / SW (`kit/CanopyWing.js`).
   - Each is a skewed quad in plan that flares toward the stadium ends.
   - Each rises toward the field edge and toward the ends: y = y0 + gIn·(xout − |x|) + gz·|z|. The high point is the inner end corner, which is the "blade tip" seen on p27, p28 and p29 and matches the brief ("slope upward toward the corners and toward the field edge").
   - The NW wing reaches further north (p26 asymmetry).
   - The east wings' outer edge is held at the facade line (p26, p27).
   - Fascia is 2.5 ft; the space frame is 9 ft deep.
   - **For the team:** the elevations p30–33 draw the canopy as nearly flat at ~157–172 ft, while the renderings show strongly tilted blades. The model follows the renderings: wing high points reach ~200 ft.
2. **Underside split.**
   - The mirror field is the wing quad scaled about its centroid, so the aluminium band is exactly 17.8 % of each underside (p22 ratio).
   - The PV array is exactly **9,198** instanced panels, trimmed from the wing tips.
3. **NE tower.** The elevation shows a 38 ft tower at X 161–199 ft. The p26 rendering shows a ~70 ft fin-clad block further east, which was matched (X 203–269 ft).
4. **East / south / west faces.** These were re-laid to the p27 / p28 / p29 compositions:
   - the VIP pavilion and fin tower near the SE corner
   - a tilted "Soffit" blade over the south-east fin wall
   - the GA West entry canopy under the SW wing tip
5. **Logos.** `LOGO_SLOT` anchors (NE tower, E tower, NW masonry block) carry blank plates only.

## Arrival QA (scene 5)

- **Cameras.** Arrival cameras are 2-point perspective, like the deck renders: level view plus lens shift (`ARRIVALS[].cam` in `src/data.js`). They were tuned with `npm run qa`, which writes these to `./qa/`:
  - `pXX_overlay.png`: the deck page at 50 % over the render
  - `pXX_render.png`
  - `pXX_compare.jpg`: side by side
  - `pXX_edges.jpg`: the render with the page's edges in magenta
- **Match quality.** p26 aligns closely (board, towers, both wings). p29's wing silhouette and entry canopy align on the edge overlay, though the building reads slightly smaller than on the page. p27 matches in composition (corner, fin wall, tower, blade). p28 is the loosest match: the blade-over-the-south-facade composition reads, but the deck model's massing beneath it is not reproduced. `qa/compare_all.jpg` shows all four side by side.
- **Label positions.** Label x positions and band heights come from the PDF text layer (`pdftotext -bbox`). Sky label tops sit at 183 px. Ground label tops sit at 899 / 1013 / 1027 / 993 px on p26 / 27 / 28 / 29.
- **Anchors.** Anchors are fitted automatically (`scenes/anchors.js`):
  1. A material-ID pass is rendered from the arrival camera.
  2. Under each label's x, the first pixel of the labelled material is found.
  3. That pixel is raycast to get the 3D anchor.

  As a result, leaders come out vertical, never cross, and end on the labelled material. Labels that cannot be fitted fall back to the `at` anchors in `data.js`, and a warning is logged in the console.
- **Label size.** The brief asks for 14 px equivalent. Labels use 18 px at 1080p (14 pt ≈ 18.7 px), which matches the deck's label size on p26–29.

## Discrepancies to confirm with the team

1. **Roof total (p22).** The header reads "Roof total 716,408 sf", but the rows sum to **444,658.93 SF**: reflective soffit 365,438.54 + soffit 79,220.39 + solar panels "TBD". The animation shows only the two row values and their percentages.
2. **PV product spelling (p25).** The deck prints "Mitrex **Gensis** Solar series". The on-screen BOD text uses "Genesis". Confirm.
3. **ACM product spelling (p25).** The deck prints "**Alucabond** Axcent ACM panel". The brief and the on-screen text use "Alucobond". Confirm.
4. **Open-air concourse (p79/p80).**
   - Both pages state "96 % of the main concourse stays open to the air, under the new canopy".
   - The p80 bar chart gives the main concourse as 308,435 SF open and 88,452 SF conditioned, which is 77.7 % open.
   - The animation shows the 96 % statement as published.
5. **Rounded headline areas (p14–18, p20).** These pages round some figures: masonry 39,500 SF, glazing 148,900 SF, reflective roof 365,438 SF and soffit 79,220 SF. The animation uses the unrounded p19 / p22 values.
6. **Ticketing canopies (p76).** The dashed paths traced on p76 measure ~1,500 ft and ~550 ft at the site-plan scale, against the published 1,033.5 ft and 491 ft. The drawn paths are scaled to the published lengths, and the dimension strings show the published values.
7. **Orientation.** The deck names the plaza / videoboard side "north" (p26, p30), while the site plans show it on the image's left. Deck naming is used throughout.
8. **Videoboard area.** p13 / p66 give the videoboard area as 224,274 SF. It is not part of the facade or roof totals and is not shown as a figure.

## Interpretation notes

- **"One continuous orbit at a 120 m radius".** The building footprint, including the wing overhangs, is ~264 × 415 m, so a 120 m circle around its centre would pass through the building. The orbit is therefore a rounded-rectangle path held **120 m off the building edge** (`ringPoint()` in `src/director.js`). The camera leaves each arrival frame, rides that ring and settles into the next arrival frame, with no cuts.
- **Scene 5 material beat.** Each arrival lands in white clay, matching the deck rendering. Each labelled material then switches on as its label draws, and the model returns to clay during the next orbit move ("clay is the canvas, material is the event").
- **Scene 5 lighting.** The arrivals use a bright-overcast rig (reduced sun, raised sky light) to match the deck's soft daylight. Scene 4's sun-path sequence uses a moving hard sun so the canopy shadow visibly sweeps the bowl and concourse.
- **End line.** "One language. Every approach." is marked `// PROPOSED COPY` in `src/data.js`.
