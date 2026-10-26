# The Nest — architectural concept film

Lincoln Financial Field renovation · HKS Sports + Entertainment · concept pricing package (Oct 22, 2026).
A single-camera, presentation-grade animation (16:9, 1920×1080, 60 fps, ≈ 81 s) built with Vite,
Three.js, one master GSAP timeline and `postprocessing` (N8AO, bloom, depth of field, grain).

## Run

```bash
npm install
npm run dev            # http://localhost:5173 — plays full-screen
```

| Key | Action |
|---|---|
| Space | pause / play |
| ← / → | previous / next scene |
| R | restart |

URL options: `?t=37` start at a time · `?record=1` deterministic clock (driven by the record
script) · `?still=p26` / `?still=p29` finished massing from the deck's camera · `?motion` ignore
`prefers-reduced-motion`. With reduced motion requested, the page opens a static storyboard
(twelve key frames with captions) and a button to play.

## Record

```bash
npm run record                       # PNGs → out/frames_1080/, then out/01_the_nest_1080p60.mp4
npm run record -- --workers 3        # split frames across browsers
npm run record:4k                    # 3840×2160 → out/01_the_nest_2160p60.mp4
npm run record -- --gpu              # use the host GPU instead of SwiftShader
```

Each frame is rendered by `window.__nest.frame(i)` at exactly `t = i / 60` and is a pure function of
that time, so any frame can be re-rendered identically, workers take round-robin blocks of frames,
and an interrupted run resumes where it stopped (delete the PNGs of a passage to re-render just that
passage). Encoding (also run
automatically once all frames exist):

```bash
ffmpeg -y -framerate 60 -i out/frames_1080/%05d.png -c:v libx264 -preset slow -crf 16 \
  -pix_fmt yuv420p -profile:v high -movflags +faststart out/01_the_nest_1080p60.mp4
```

`npm run check` verifies the brief's reading rules for the p9 paragraph without a browser (every
sentence fully legible ≥ 0.4 s per word, ≤ 60 characters per line, two lines per chunk, chunks never
overlapping). `npm run qa -- 12.4 58 79` renders stills at given times into `qa/frames/` (`--every 2` for a sweep,
`--still=p26` for the deck comparisons).

## Reference material

The deck lives at the repo root (`20261022_LFF_Eagles_HKS_compressed.pdf`). `npm run refs`
(Python 3 with Pillow, numpy, opencv-python-headless; `pdftoppm`) rasterizes the reference pages to
`reference/pages/` and cuts the plates in `public/ref/` (photographs with the slide typography
inpainted out, and the p6 neighbourhood linework). What was taken from each page — palette samples,
traced coordinates, scale assumptions and simplifications — is in `REFERENCE_NOTES.md`.

All copy and timing is in `src/data.js`, each line citing its page. Nothing is invented; new lines
would be marked `// PROPOSED COPY` (there are none).

**Logos.** No team marks are drawn. `reference/brand/README.md` explains where to put a supplied
file; until then the `LOGO_SLOT` plane in "Our Identity" stays an empty frame.

## Structure

```
src/data.js            copy, scene times, reading-time rule (0.4 s/word)
src/ref.js             geometry traced from the deck (p4 waveform, p34 section, p26 elevations)
src/palette.js         sampled colours
src/core/              timeline (master GSAP), DOM type layer, fat lines, photo plates, PBR materials
src/scenes/s1_energy   House of Energy: dashed line → zigzag → p34 section
src/scenes/s2_ambition section extrudes into the bowl; responds to the four p2 lines
src/scenes/s3_drivers  Generational Grit · Hyper Local · Give More Than You Take
src/scenes/s4_nest     title card, era frames → material tiles, City › Architecture › Identity
src/scenes/s5_reveal   tiles build the p26 massing, leader labels, crane, end card
```

## Timing

| Scene | Time | |
|---|---|---|
| 1 House of Energy | 0:00–0:12.6 | |
| 2 The ambition | 0:12.6–0:23 | |
| 3 Design drivers | 0:23–0:37 | three 4.4–5.2 s beats |
| 4 The Nest | 0:37–1:05 | |
| 5 Assembly and reveal | 1:05–1:21 | end card 1:16, fade 1:20.4 |

The film runs ≈ 81 s instead of 75 s because the brief's own reading rule (every sentence on screen
≥ 0.4 s per word) needs ≥ 32.4 s of fully legible time for the 81-word p9 paragraph; it is shown
two lines at a time from 0:37.6, and its last sentence carries into Scene 5 (top-left, clear of the
p26 labels).
