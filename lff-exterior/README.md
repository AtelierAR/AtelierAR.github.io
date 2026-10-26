# Exterior Strategies: The Skin, the Canopy, the Plaza

**Lincoln Financial Field renovation · HKS Sports + Entertainment · Concept Pricing Package (Oct 22 2026)**

An 85-second cinematic explainer (16:9, 1920 × 1080, 60 fps) of the exterior strategy:

- a facade from a kit of five materials
- a sloped canopy with a mirror underside and a solar roof
- four arrivals from the plaza

The animation is built in Vite + Three.js, with a GSAP master timeline driven by a manual clock, `postprocessing` (N8AO, bloom, DOF, 3 % film grain) and a live mirror for the 316 stainless soffit.

Story: *five materials, one language → how each is built → the canopy that shelters and powers → four arrivals → the building from every side → dusk on the plaza.*

## Run it

```bash
npm install
npm run pages      # rasterize the deck pages used (needs poppler-utils) -> reference/pages/
npm run prep       # derive runtime assets (title art, elevation line art, site plan) -> public/assets/
npm run dev        # http://127.0.0.1:5173
```

The reference deck goes in `reference/20261022_LFF_Eagles_HKS.pdf`. In this repo that path is a symlink to the uploaded PDF at the repository root.

### Controls

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` / `→` | Previous / next scene |
| `R` | Restart |
| `H` | Toggle the time / scene HUD (also `?hud=1`) |

### URL parameters

| Parameter | Effect |
|---|---|
| `?t=42` | Open paused at 42 s |
| `?record=1` | Recording mode: no RAF loop; exposes `window.__lff.renderAt(t)` / `renderFrame(i)` |
| `?qa=26` | Arrival camera for p26 with the rasterized page overlaid at 50 % (`&noref` hides it, `&refop=0.3` sets its opacity) |
| `?cam=x,y,z,tx,ty,tz,fov,shiftY` | Free debug camera, in feet |

## Record

```bash
npm run record      # -> out/03_exterior_1080p60.mp4
npm run record:4k   # -> out/03_exterior_2160p60.mp4 (deviceScaleFactor 2)
node scripts/record.mjs --scale=0.5 --step=4   # quick 540p / 15 fps preview
```

How it works:

- `scripts/record.mjs` starts its own Vite server, or takes `--url=`.
- It steps the master clock frame by frame, screenshots every frame with Playwright (PNG to `out/frames_<res><fps>/`) and encodes with ffmpeg (x264, CRF 16, yuv420p, faststart).
- Frames that already exist are skipped, so a long render can be resumed.
- `--from` / `--to` (seconds) render a range.

On a machine with a GPU each frame takes a fraction of a second. On CPU-only WebGL (SwiftShader) expect ~3 s per 1080p frame and ~4× that at 4K.

## QA

```bash
npm run dev & npm run qa     # renders p26–29 arrival frames into ./qa/
```

For each page this writes:

| File | Contents |
|---|---|
| `pXX_overlay.png` | Render with the deck page at 50 % |
| `pXX_render.png` | Render only |
| `pXX_compare.jpg` | Deck page and render side by side |
| `pXX_edges.jpg` | Render with the page's edges in magenta |

## Structure

```
src/
  data.js            every figure, label and layout value, with page citations
  main.js            boot, manual clock, per-frame update, controls, record API
  engine.js          renderer, sky, lights, PMREM environment, post stack, mirror cube camera
  materials.js       category materials: clay <-> PBR switch (uMix), dim-to-40 % (uFade)
  textures.js        procedural PBR textures (brick stack bond, panels, CW, mesh, soffit…)
  director.js        camera shots, time-aware Catmull-Rom splines, 120 m orbit ring
  stadium.js         assembles the building from the kit
  site.js            ground, Studio MLA plan drape, trees, crowd, ticketing canopies
  board.js           videoboard content (abstract, no marks)
  kit/               Tower, CanopyWing, GlazingBand, FinArray, MasonryPlinth, MeshScreen,
                     MetalPanel, VideoBoard, EntryCanopy, Blade, Bowl, GrandStair
  overlay/           DOM/SVG overlay: titles, counters, facade bar, callouts, leader labels
  scenes/            s1_title … s7_dusk, anchors.js (deck-fitted leader anchors)
scripts/             rasterize.sh, prep_assets.py, record.mjs, qa.mjs, qa_edges.py, shot.mjs
```

See `REFERENCE_NOTES.md` for what was taken from each page, the calibration and the discrepancies to confirm with the team. See `CREDITS.md` for licences.
