# Reference notes: Prompt 4, The Occupiable Videoboard

Source: `reference/20261022_LFF_Eagles_HKS.pdf` (HKS Concept Pricing Package, Oct 22 2026,
140 pages). It was rasterized at 200 DPI into `reference/pages/p-NNN.png` (2667 × 1500) with
`npm run rasterize`. The pages are not committed (≈200 MB); re-create them with that
command. PDF page numbers match the deck's page numbers.

Every number shown on screen comes from `src/data.js`, and each value there cites its
page. Values that are derived rather than printed are marked `DERIVED` and show their
arithmetic.

## Page log: what was read and where it is used

| Page | Content | Used for |
|---|---|---|
| 4 | HOUSE OF ENERGY · HIGHER AMPLITUDE. A dashed TODAY line breaks into a green RENOVATED BOWL zigzag. | The polyline was traced at 200 DPI into `WAVEFORM` in `data.js`. It is drawn as the Scene 1 sound cue (dashed TODAY line), as the Scene 6 waveform across the bottom (amplitude jumps at the score) and as a content programme. |
| 13 | Material palette. VIDEO BOARD 224,274 SF. | Cross-check of the p66 total. The videoboard is treated as a facade material. |
| 26 | Plaza view. The board face is on the plaza side. | Scene 6: the plaza-facing (north) face plays content and a spot light washes the plaza. Also the white-clay trees and towers. |
| 34 | Long section. The board sits between the bowls and plays an eagle-feather image. | The content language: abstract feather streaks in midnight green, teal and silver. Procedural; no imagery copied. |
| 42 | Manifest: TOTAL with SRO 76,660. | Scene 6, outside tag: "76,660 with SRO (p42)" (`CAPACITY`). |
| 51 | North section: SRO levels 1–4, upper level, club level, main concourse, super vom (item 4), occupiable video board (item 5). | Floor elevations, measured at the scale bar (≈2.3 px/ft on the 1400 px page, checked against the 109.5' face). Underside ≈62' above the field. Field-face tilt `a = 0.08` and underside slope `e = −0.12` for the volume fit. Super vom at the main concourse (Scene 5 end). |
| 52 | North Stand existing vs proposed. Existing board on a framed lattice tower. | Scene 1 "existing" board: a flat rectangle on a lattice tower. Proposed: volume over the overbuilt lower bowl. |
| 53 | South section. NEW VIDEOBOARD 215' X 105'. | Tilt `a = 0.12` and underside slope for the south fit, plus underside height ≈66'. See discrepancies. |
| 54 | South Stand. VIDEOBOARD 16:9 (215' x 112.5'). | See discrepancies. Not used for geometry. |
| 63 | North lower bowl, proposed: teal volume cantilevered on columns, three green slab lines inside. | Volume lean and cantilever, columns under the board, line-green slab edges, teal glass massing. QA overlay `qa/p63_overlay.jpg`. |
| 66 | Massing axon, Total Area 224,274 SF. | Scene 2 step 6: both volumes fly into an exterior massing axon and the counter lands on 224,274. Two vertical facade boards are shown as teal glass. |
| 67 | North board: 214' × 109.5', 16:9; Top 26,977 · Bottom 19,726 · North 16,127 · East 12,217 · South 23,433 · West 12,127; depth 155'. | `NORTH` in `data.js`. The volume fit, the Scene 2 box net and the bowl axon of Scene 4 (camera from the south-east). |
| 68 | South board: Top 23,438 · Bottom 16,129 · North 23,433 · East 10,453 · South 16,293 · West 10,453; depth 109'. | `SOUTH` in `data.js`, the volume fit and the Scene 2 labels. |
| 69 | Ribbon boards: 8 runs, 3' high, Upper bowl 801 · Club 375 · President's Club 827 · Lower club 670 LF, with existing/new splits (*existing replaced per FCA). | `RIBBONS`. Each run is modelled at exactly its LF (tested) and centred on the 50. West runs chase south → north, east runs north → south. |
| 70 | North board options: 25' + 164' + 25', 92'-3", 17'-3", option card text. | Face layout (tested), dimension strings, option card (same wording) and the Scene 3 camera. QA overlay `qa/p70_overlay.jpg`, corner RMS 5.5 px. |
| 71 | South board options, same treatment, remaining faces 76,766. | Scene 3 south beat and its camera. QA overlay `qa/p71_overlay.jpg`, corner RMS 45 px; see notes. |
| 87 | Main concourse end zone: IMMERSIVE EXPERIENCES · CONNECTION TO THE BOWL. | Super vom callout at the end of Scene 5. |
| 97 | Club level / video board: CLUB · IMMERSIVE EXPERIENCES · HOSPITALITY FOCUS. | Club callout in Scene 5. |
| 98–99 | Club renders: deep coffered ceiling, floor-to-ceiling curtain wall, curved lounge chairs, bar-height counters at the glass. | `src/world/club.js`: 5' mullion module, an open central bay, deep beams, counters and stools at the glass, lounge clusters. Stylised white figures stand in for guests. |
| 110 | 10-year list. North: club, upper suite and upper concourse levels each get a video board club. South: club-level VB club connects east and west, an upper-suite VB club replaces 14 suites, and a GA+ club sits at the upper concourse inside the board. | Floor labels in Scene 5. |

## Discrepancies and decisions

1. **Face size.** p54 says "215' x 112.5'" and p53 says "215' X 105'". p67, p68, p70 and p71
   all say 214' × 109.5'. **We use 214' × 109.5'.** The face is built from
   164 + 2·25 = 214 and 92.25 + 17.25 = 109.5. This gives 23,433 SF, with
   15,129 + 8,304 = 23,433 (unit-tested).
2. **North West face.** p67 lists West = 12,127 SF. p70's "Remaining Faces Total: 87,264 SF"
   only works if West = 12,217, the same as East. The 90 SF gap looks like a digit
   transposition. **We label the deck value, 12,127, and fit the geometry to it.** That
   makes the model 0.7% asymmetric. A test pins the 90 SF difference. The north volume
   total in Scene 2 uses p70: 23,433 + 87,264 = 110,697.
3. **Total area.** The six listed faces sum to 110,607 (north) and 100,199 (south), so
   210,806 SF. Using p70's total instead gives 210,896. p66 and p13 give **224,274 SF**. The
   13,378 SF difference is not itemised in the deck. p66 shows vertical teal facade boards
   beyond the two volumes, so the Scene 2 counter adds "+ Facade boards (p66)" for the last
   step and never prints the 13,378 figure on its own. It is computed as
   `FACADE_BOARDS_SF` in `data.js` and marked DERIVED.
4. **Volume depths vs. face areas.** No hexahedron satisfies every printed figure at once.
   The constraints are: a 214' × 109.5' rectangular field face, the six face areas, the
   printed depths (155' north, 109' south) and the slopes in the sections. We keep the
   face exact and all six face areas exact (each within 1 SF, tested). The face tilt and
   underside slope are read off p51/p53. The roof slope, plan taper and back lean are
   solved by `scripts/fit-volumes.mjs`. The fitted top depths are 138.1' (north, −11%) and
   120.9' (south, +11%). The animation's dimension strings still read 155' and 109', as
   the deck does. As on p63, the top is larger than the bottom and the side faces flare
   upward.
5. **p71 board overlay.** The p71 board is a 2D overlay drawn on a render. Its four corners
   are not the perspective of one rectangle, so no camera can match them exactly. The best
   on-field camera leaves 45 px RMS. p70 is consistent: 5.5 px RMS.
6. **p63 camera.** The p63 panel is a cutaway render. The QA view uses the solved camera
   with a near-plane cutaway, and corner RMS is 26 px on the panel. The lean, flare, three
   slab lines and cantilever over the lower bowl read the same.
7. **Floor stack.** The prompt lists video board club (club level), video board club (upper
   suite level), GA+ club (upper concourse) and SRO levels 1–4 for the north volume. p110
   puts the GA+ club and the 14-suite replacement in the south board. We follow the
   prompt's labels in the north section cut and note the source of each in `FLOORS`.
   Elevations are approximate (p51 scale).
8. **Ribbon placement.** p69 gives lengths, not fascia heights. The fascias are assigned
   from p69's ordering, outermost to innermost: upper bowl, club, President's Club, lower
   club. In Scene 4 the 3' runs are drawn 3.5× taller so they read from the aerial. The
   labels carry the true LF.
9. **Existing board (Scene 1).** The deck gives no dimensions for it, so it is drawn
   schematically and no figures are shown.
10. **Timing.** The storyboard asks for 3 × 3.5 s north options plus a 4 s south beat
    (14.5 s) inside Scene 3's 12 s window. Scene 3 therefore runs 0:24–0:38.5 and Scene 4
    0:38.5–0:46. Total length is unchanged at 90 s.
11. **Copy.** "A screen you watch." / "A building you enter.", "One continuous digital
    ring with two inhabitable hearts." and the end card are marked `// PROPOSED COPY` in
    `src/timeline.js`. **The end-card claim, "The first occupiable videoboard in the NFL",
    must be verified by the HKS team before the presentation.** A code comment says so.
12. **Marks and brands.** `reference/brand/` and `reference/fonts/` do not exist. No NFL or
    Eagles marks, no "Lincoln Financial Field" roof signage and no end-zone wordmarks are
    drawn; end zones are plain midnight green. Type is Hanken Grotesk, bundled through
    @fontsource. The CSS stack puts "HKS Sans" first, so the font is used automatically
    when it is installed.
13. **Not invented.** No capacities, prices or brand partners are shown for the clubs.
    Figures are white abstractions with no features.

## Open items for the HKS team

- Verify the end-card claim, as noted above.
- Confirm West = 12,127 vs 12,217 on p67.
- Itemise the 13,378 SF of non-volume videoboard in the p66 total.
- Supply HKS Sans and the official marks if they should appear on the content. The
  content shader can composite them through `ContentTexture.setText`'s canvas layer.
