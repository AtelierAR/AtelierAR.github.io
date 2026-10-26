# Reference notes — The Nest

Source: `20261022_LFF_Eagles_HKS_compressed.pdf` (repo root; 140 pages, 960×540 pt).
`npm run refs` rasterizes the pages below at 200 DPI into `reference/pages/` (2667×1500 px) and cuts
the plates in `public/ref/`. **All coordinates below are in "2000-wide" page units**
(raster px ÷ 1.3335). Screen px at 1080p = page units × 0.96.

## Sampled palette (vs. brief)

| Use | Brief | Sampled | Where | Used |
|---|---|---|---|---|
| Midnight field | `#0F4A52` | `#053C43` (body), `#024B52` (left rail) | p2 | `#0B3F46` field, `#062E33` shadow |
| Eagles midnight green | `#004C54` | `#024B52` | p2 left rail | `#004C54` |
| Line green | `#3CCB5A` | `#31B674` | p2 "TRANSFORMATION", p9 sub-line | **`#31B674`** (sample differs → sample wins) |
| Section linework | — | strong green `#1E8B3E`-ish strokes | p34/p35 | uses line green |
| Render sky | `#8D96AD` → `#E3E6EC` | `#70768A` top → `#B8BFCE` horizon | p26 | `#7E869C` → `#D9DDE6` (between brief & sample) |
| Clay ground | `#F1F2F4` | `#EBEAEF` | p26 | `#EEEEF2` |
| p10 duotone | `#0B3B41` / `#B9CFD3` | `#5F737E` / `#D6E0E4` | p10 panels | panels kept as shot (already duotone) |
| Masonry | — | `#533B2F` avg, `#2F271F`→`#6C6258` | p10 swatch | dark iron-spot brick |
| Steel | — | `#303336` | p10 swatch | blackened steel |
| Digital | — | `#0C1B1D` with teal dots | p10 swatch | LED dot matrix |
| Reflective | — | `#837F7C` | p10 swatch | polished stainless |
| p6 map | — | fills `#063736`, rivers `#157977`, parks `#6B9951`, title `#033A3D` on band `#C8C8BF` | p6 | map lines + title band |

## Page by page

**p2 — A Generational Transformation.** Midnight-green field with a 1 px vertical rule at x≈95 and the
rotated eyebrow "02 · HKS STRATEGY". Eyebrow "HKS AMBITION" (light, x 213 y 112). Headline in two
lines, medium weight caps: "A GENERATIONAL" white (cap top y 245, baseline 325), "TRANSFORMATION" line
green (y 380–460). Four lines in light sentence case, each between hairline rules spanning x 211–1254;
rules at y 556 / 642 / 727 / 813 / 899 (86 px pitch), text baselines ≈ 40 px below each rule.
→ Scene 2 copy and layout (rules drawn one by one, same pitch).

**p4 — House of Energy · Higher Amplitude.** Crowd photo darkened to ~30 % under a midnight wash.
Headline x 100: "HOUSE OF" thin/light white + "ENERGY ·" black weight (cap y 190–262), the "·" is a
green square dot; "HIGHER AMPLITUDE" black (y 290–360). Body two lines x 103, baselines y 423/472.
Waveform traced from the raster:
- `TODAY` label (letter-spaced bold caps) at x 145, y 725.
- Dashed silver line: (145,795) (290,768) (440,828) (580,776) (735,815) (870,782) (995,805).
  Dash ≈ 22, gap ≈ 10.
- Vertical dotted divider at x 998, y 635→950.
- Green zigzag: (998,805) (1082,680) (1165,920) (1250,662) (1333,935) (1415,650) (1500,922)
  (1582,675) (1665,905) (1750,712) (1855,798) — five sharp peaks plus the shoulder; peak-to-trough
  ≈ 285 px = **25 % of frame height** (the brief says ≈ 35 %; the deck shape is used and the roar
  envelope pushes it to ≈ 30 % at full roar).
- `RENOVATED BOWL` label x 1040–1315, y 955.
→ Scene 1 waveform positions are these points × 0.96. Plate: `p04_crowd.jpg` (type and lines inpainted out).

**p5 — Generational Grit.** 2×2 collage, top black bar 0–28: City of Brotherly Love sign (0–695 × 28–628),
face-painted fan (697–2000 × 28–628), el train + PHILADELPHIA mural (0–695 × 630–1125), City Hall
with confetti (697–2000 × 630–1125). Heavy cool-green grade, crushed blacks. "GENERATIONAL GRIT."
white black-weight caps centred at y 578. → Scene 3 beat 1, four torn-paper plates.

**p6 — Hyper Local.** Condensed bold title "HYPER LOCAL" in `#033A3D` on a light band (y 0–198);
Philadelphia neighbourhood map (teal-green fills, white city outline, teal rivers, lime parks) over a
dusk aerial. "STADIUM DISTRICT" at (920, 905) → stadium pulse point. Network access to OpenDataPhilly
was not available, so boundaries are **traced from p6**: city outline polygon hand-traced
(`P6_CITY` in `scripts/extract_refs.py`), neighbourhood boundaries = colour-cluster edges of the map
fills with labels/roads removed. Output `p06_map_lines.png` (R boundaries, G city rim, B rivers).

**p7 — Give More Than You Take.** Eyebrow "PHILADELPHIA EAGLES" (wide-tracked); headline in tall condensed
caps, two lines "GIVE MORE" / "THAN YOU TAKE"; sub-line "FOR THE CITY. FOR THE TEAM. FOR EACH OTHER."
(tracked caps). Left column x 60–430 with a short dash before each pillar: BUILT FOR MORE — "Designing
spaces that inspire, unite, and uplift generations."; ROOTED IN COMMUNITY — "Listening, learning, and
building together."; CREATING LASTING IMPACT — "Beyond the game. Beyond today. For tomorrow."
→ Scene 3 beat 3 (Oswald 600). Plate: `p07_skyline.jpg` (skyline band only, below the baked-in type).

**p9 — The Nest.** "THE NEST" white medium caps (x 213, y 245–330); "GENERATIONAL FABRIC OF PHILADELPHIA"
white semibold (x 422, y 410–465) followed by a teal "…"; "THE NEW HOME FOR EAGLES NATION." line green,
light (x 213, y 565); paragraph semibold between hairline rules (x 211–1254, rules y 684 and 1041).
Painted crowd/fist illustration on the right. → Scene 4 title card. Plate `p09_bg.jpg` (type inpainted).

**p10 — the structural page for Scene 4.** Off-white `#EFECEA` slide. Four duotone frames with labels
above in tracked black caps: THE PAST… (71–523 × 262–765, a machine hall), THE CONTEMPORARY…
(skyline + museum garden), THE FUTURE… (outdoor screening, towers), PHILLY FAITHFUL… (helmet facemask
reflecting the crowd). MATERIAL LANGUAGE strip, five square swatches with name + three-beat caption:
MASONRY "Solid. Enduring. Rooted in the City." · STEEL "Industrial. Strong. Built to Last." · GLASS
"Transparent. Vertical. Forward Looking." · DIGITAL "Dynamic. Intelligent. Future Ready." · REFLECTIVE
"Unity. Pride. Mirror of the City." "A REFLECTION OF PHILADELPHIA": OUR CITY (chimney, brick mill,
gantry) › OUR ARCHITECTURE (cylindrical cluster of ~60 tall glass fins, uneven tops) › OUR IDENTITY
(Center City skyline with the two Liberty Place towers, logo in front), all three standing on one
reflective water line. → Scene 4 panels, tiles and triptych morph. The identity image's logo is
**not** reproduced; `LOGO_SLOT` stands in.

**p11 — Materiality / inspiration palette.** Dark vertical fins over a reflecting pool; red-brown brick
with black steel windows; riveted steel truss; black corrugated/fin facade; mirror canopy reflecting a
plaza; green marble, copper, walnut. → finishes: brick is dark and warm not orange, steel is
blackened with a soft sheen, stainless reads as a near-perfect mirror of the plaza.

**Material assemblies (text pages after p11).** Masonry BOD "Endicott Dark Iron Spot 'Utility' brick
unit 3 5/8" × 11 5/8", stack bond pattern" → masonry tile is stack bond at that 1:3.2 unit ratio.
Soffit: "316 stainless steel soffit plate, where mirror finish is required". Fins: "Fin depth 6–8'".

**p26 — Plaza View (primary massing reference).** Near-frontal, eye at plaza level, horizon y ≈ 640.
Scale assumption 0.6 ft per page unit (whole frontage ≈ 1,180 ft, matching the p34 overall length).
Centre x 965, grade y 750. Read off:
- Video board: keystone trapezoid, top 768–1163 @ y 432, bottom 778–1150 @ y 648 (≈ 237 × 130 ft),
  floating over the grand stair (860–1070, y 690–750).
- Left tower 450–605 × 278–750 (≈ 93 × 283 ft): mullion grid on the left face, vertical fins on the
  right third (548–605), logo boss near the top (not reproduced).
- Right fin cluster 1500–1655 × 398–610 above a masonry block 1590–1780 × 610–750.
- Horizontal glazing bands, three levels, 605–770 and 1160–1470 × 498–615.
- Masonry bases y 680–750 across 40–750 and 1240–1800; low glazing 470–690.
- Right entry canopy slab 1240–1590 × 615–660 on slender columns.
- Left canopy wing low and short (275–710 × 440–500); right wing huge, striated, rising to a sharp tip
  at (1985, 335); a far-left low roof at y 548.
- Labels: top row y 209 (Reflective Soffit, Fins, Glazing, Video Board, Glazing, Reflective Soffit,
  Fins), bottom row y 955 (Masonry, Glazing, Masonry … Masonry, Glazing, Masonry), each with a 1 px
  vertical leader to the element. → Scene 5 leader-line labels copy this grammar.

**p27 — VIP Entry East.** The wings are vast flat triangular cantilevers with striated (banded)
tops and plain soffits; fin colonnades step in height; masonry walls read as fine horizontal coursing;
a tall gridded tower with fins. → wing striations and fin spacing.

**p28 — Alternate GA.** Wing seen from below: a single huge triangle, ~20 parallel bands, rising to the
corner. → wing is modelled as one triangular slab with banded top and mirror underside.

**p29 — GA West Entry.** Same wing from the west: the high corner tip, sloping down toward the centre.
Mesh/grate volumes and fin screens. → confirms the canopies rise toward the corners.

**p34 — Long section (profile for the morph).** Scale bar 1471→1771 = 200 ft ⇒ **1.5 page units / ft**.
Grade y 731, field y 752 (14 ft below grade). Traced green linework (page units):
podium 236–290 @ y 552; left canopy outer tip (290,433), top (360,405)–(640,400), inner tip (705,432);
upper rake (365,462)→(520,553), lower rake (585,690)→(782,750); field 782–1258; right lower rake
(1258,750)→(1460,692), upper rake (1520,560)→(1650,472); right canopy inner tip (1340,432), top
(1430,405)–(1615,405), outer tip (1705,432); podium 1708–1786 @ y 552; tower 1790–1850 to y 455.
Canopy top ≈ 220 ft above grade; overall ≈ 1,187 ft. Video board 818–1220 × 415–620 (behind the cut).
→ `src/ref.js` `SECTION_P34`; world units are feet, x from the board centre (x 1019), y from grade.

**p35 — Cross section.** Same scale. Field 720–1290 (≈ 380 ft), angled wedge volumes at both
ends, tower at left. → long-axis half-width of the field edge for the Scene 2 sweep (190 ft); the
p34 field width (159 ft half) gives the other axis.

## Simplifications (flag for design review)

- Scene 2 sweeps the p34 half-profile around a rounded rectangle (159 × 190 ft half-widths, 90 ft
  corner radius). The real bowl has open corners and differing end/side profiles.
- Scene 5 depth (z) dimensions are not given by any single page; they are inferred from p27–p29 and
  the p34/p35 sections. Frontal proportions are from p26.
- Running time is ~81 s rather than 75 s: the brief's 0.4 s/word minimum on the p9 paragraph
  (81 words ⇒ ≥ 32.4 s) does not fit inside the 24 s Scene 4 slot, so Scene 4 is 28 s and the last
  sentence carries into Scene 5.
