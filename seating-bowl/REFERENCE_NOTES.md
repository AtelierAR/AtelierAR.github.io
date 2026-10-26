# Reference notes — Seating Bowl film

Source: `reference/20261022_LFF_Eagles_HKS.pdf` (HKS Concept Pricing Package, Oct 22 2026; a symlink to the compressed deck committed at the repo root, 140 pages, 960 × 540 pt). PDF page numbers match the deck page numbers used in the brief.

`npm run prep` rasterizes every page used at 200 DPI (`pdftoppm -png -r 200`, 2667 × 1500 px) into `reference/pages/` (git-ignored) and cuts the p36 title texture. All pixel coordinates below are in those 200-DPI rasters.

## Pages used

| Page | What it gave the film |
|---|---|
| 36 | Title card: midnight-green ground, player-silhouette photo texture (left 62 % of the page, greyscale, faint, parallaxing). The page title type is not reused. |
| 37 | Existing manifest figures, the plan colour coding (bowl teal, club grey, CS suites maroon, LS loge green, M mezzanine purple, RZS salmon, terraces orange, press blue), and the plan geometry: six traced rings (`src/geometry/plan_rings.json`). |
| 38–41 | Demolition and new-construction areas. Used to place what gets demolished (north bowl above the main concourse, south upper/club) and what gets overbuilt. The 10-year-scenario pages repeat the same figures. None of their SF figures appear on screen. |
| 42 | New manifest figures, p42 plan colours, new lower-bowl front and back rings, and the VIDEOBOARD CLUB outlines. |
| 44 | Existing product ladder: headline "8 CLUBS · 175 SUITES · 19% PREMIUM" (the "before" side of scene 7). |
| 45 | New product ladder: tier membership, exact product spellings, tier seat totals and percentages, and the headline "11 CLUBS · 205 SUITES · 32.4% PREMIUM". |
| 50 | East/West section: five moves (wording), level labels, traced section (`section_ew_p50.json`). |
| 51 | North section: traced section, board polygon, SRO LEVEL 1–4, "50 ROWS ON NORTH" (`section_north_p51.json`). It is the scene 4 inset. |
| 52 | North Stand existing/proposed lists and the axon camera angle. |
| 53 | South section: board polygon, demo callout "DEMO CLUB SEATS (-6 ROWS @ 19,540SF)" (`section_south_p53.json`). |
| 54 | South Stand existing/proposed lists and the axon camera angle. |
| 55–59 | Fan-eye renders (white clay, blue-grey sky). Scene 9 uses p56, p57, p58 and p59. p55 is a second "South endzone view" and is not used. |
| 61 | Lower-bowl field heights: three cases, overbuild rows and SF, fans/goalpost, blue overbuild highlight, thumbnails (`field_heights_p61.json`). |
| 62–64 | North lower bowl alternate vs proposed. Figures were read from the **rasterized** p62 because its text layer is jumbled. |
| 67, 68 | Board size 214′ × 109.5′, ratio 16:9 (also p70–71 canvas). |

## Calibration

Tracing is reproducible: `tools/build_geometry.mjs` holds every anchor in raster pixels with its calibration and writes `src/geometry/*.json` (`npm run geometry`). `tools/gridcrop.py` produces labelled-grid crops for reading the anchors.

| Drawing | Calibration | Cross-checks |
|---|---|---|
| p37 / p42 plan | Field incl. end zones 360 ft = 527 px (end-zone outer edges x = 1125 / 1652) → **1.464 px/ft**. Centre (1388, 754). | Field width 232 px = 158.5 ft (vs 160, 1 %). 90′ scale bar gives 1.43 px/ft (2.5 %). |
| p50 E/W section | **6.2 px/ft**, from the 80 ft half-field (goalpost centre x = 411 → SIDELINE x = 908) and the 4′-0″ drop (CURRENT y = 1213, NEW y = 1240). | Crossbar 10 ft = 58 px (5.8 px/ft); uprights 18.5 ft apart = 102 px (5.5). |
| p51 / p53 sections | **4.45 px/ft**, from the 4′ field drop (18 px). | Board front height: 483 px (p51) / 483 px (p53) → 108.5 ft, vs 109.5 ft on p67 (1 %). |
| p61 | Drawn as a normalised inset. The anchors are x positions on the 2000-px-wide display of the page. | Crossbar 10 ft ≈ 62 px; fan figures ~30 px. |

The 3D bowl is a parametric sweep between the traced plan rings (12 corresponding vertices per ring; seat rows are interpolated between rings). Elevations come from the sections and are re-based on **y = 0 = existing field**, so the proposed field sits at y = −4. The 3D model does not reproduce seat counts. Every figure on screen comes from `src/data.js`.

## Discrepancies (logged, not silently resolved)

1. **Videoboard size.** p54 prints `215′ x 112.5′`. p53 prints `NEW VIDEOBOARD 215′ X 105′`. p67 and p68 print `214′ x 109.5′`, ratio 16:9, which is consistent with the 16:9 canvas on p70–71. **The film uses 214′ × 109.5′** as the brief instructs. The traced board heights on p51/p53 (108.5 ft) also agree with 109.5.
2. **p42 TOTAL with SRO.** 70,874 + 5,787 = 76,661, but the page prints **76,660**. Shown as printed.
3. **p62 alternate total.** 6,532 + 2,128 = 8,660, but the page prints **7,034**. The printed seat delta 1,628 equals 8,662 − 7,034, so it is consistent with the printed totals. Shown as printed.
4. **Existing suites.** The p37 manifest lists 174 suites (plus 5 mini-suites). The p44 ladder headline says 175 SUITES. The manifest scenes use p37 and the ladder headline uses p44, as the brief cites.
5. **Neighborhood Social tier.** On p45 "BEER HALL · Plaza · NEIGHBORHOOD SOCIAL" sits inside the **GA** band, and only THE GARDEN SOCIETY sits in the GA+ band. The brief lists Neighborhood Social under GA+. The film follows the page (GA). If the brief's grouping is intended, move it in `PRODUCT_TIERS` in `src/data.js`.
6. **GA+ seats.** p45 prints "–" and "-%" for GA+, so no counter rolls for it. The p45 tier totals (A–GA) sum to 73,164. That differs from the p42 totals because p45 counts concourse capacity; the two are not reconciled.
7. **p50 numbering.** The drawing carries six numbered dots and their order does not match the five-item list (for example, dot 4 sits on the front rows and dot 6 on the club). The film places one dot per listed move on the element that move describes. Move 5 ("DEMO AND RAISE CLUB LEVEL 8′") is red on the page because it starts with DEMO, and the film keeps it red.
8. **Scale bars.** p50's bar is unlabelled and does not match the field (it implies 3.86 px/ft against the measured 6.2). The 30′/90′/150′ bars on p51/p53 also imply 3.86 px/ft against the 4.45 px/ft that both the 4′ drop and the board height give. **The scale bars were not used.**
9. **Sideline to first row.** p37 puts the existing first row about 61 ft from the sideline at the 50 and p42 about 44 ft. The p50 section puts the new field-suite front about 30 ft out. The 3D bowl uses the plans; the 2D section uses p50.
10. **Rakes.** Measured on p50: lower bowl 12.8°, club 26.4°, upper 34.1°. The stated proposed rakes (p62) are 15° and 27°. The redrawn section uses the stated angles, starting from the traced front row over the traced run.
11. **p52 typo.** "DEMO EXISITNG NORTH BOWL…" is displayed as "Demo existing north bowl above main concourse", as written in the brief.
12. **Order of the north moves.** p51 lists "1 DEMO / 2 LOWER THE FIELD" while p52 lists "1 LOWER THE FIELD / 2 DEMO". The film follows p52 (the axon page the brief cites).
13. **South wording.** p53 says "ADD 4 ROWS TO BACK OF LOWER BOWL" and "LOWER BOWL +6 ROWS". p54 says "ADDING NEW ROWS ON THE BACK". The film uses the p54 wording.
14. **Existing linework on p50** is drawn as grey elevation, not as cut lines. The film's "existing" section lines are inferred from the five moves: field +4′, lower bowl before restrike starting 4 rows further back, club 8′ lower. They read as existing (silver dashed) and are not a survey.
15. **"Add field suites (10)".** p50 shows the suites as a glazed band under the front rows, and the film models them that way. The 10 suites are not drawn individually.

## Assets and type

- `reference/brand/` is not supplied. The end zones are painted with the word **EAGLES** in Hanken Grotesk Black, and the midfield is left as an empty `LOGO_SLOT` (`src/three/field.js`). No NFL or Eagles marks are redrawn.
- `reference/fonts/` is not supplied (no HKS Sans), so the film uses **Hanken Grotesk** (bundled via @fontsource). Its digits are tabular by default; measured widths of "1111" and "0000" are identical. `tnum`/`lnum` are still requested.
- Tagline "Closer. Louder. Unmistakably Eagles." is **PROPOSED COPY** (marked in `src/data.js`); it is not in the deck.

## Fan-eye camera matching (scene 9)

Each hold was placed by rendering it with `?qa=<page>`, which overlays the deck render at 50 %, and adjusting until the board, field and goalposts registered. The proposed model is massed rather than detailed, so the match is to composition, not pixel-exact. `npm run qa` writes `qa/fan_pNN_overlay.png`, `qa/fan_pNN_side.png` (render | deck) and a keyframe contact sheet.

| Page | Camera (ft, datum = existing field) | Notes |
|---|---|---|
| p56 NW lower bowl | (−206, 17, 134) → target (80, 24, −70), fov 62 | Board centre-right and north goalpost left, as on the page. |
| p57 SW lower bowl 50 yd | (8, 13, 158) → (8, 32, −300), fov 62 | Straight across at the 50. |
| p58 South end zone | (300, 64, 122) → (−170, −6, −92), fov 62 | West side of the south end, raised; board and EAGLES end zone overlap the page within ~30 px. |
| p59 South upper bowl | (296, 122, −236) → (−190, 6, 40), fov 58 | SE upper corner. The board registers within about 100 px. The tagline closes on this view. |
