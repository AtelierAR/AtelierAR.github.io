# Credits and sources

## Textures

All material textures are **procedural**, generated at runtime in `src/textures.js` (iron-spot brick in stack bond, blackened aluminium plate, ACM fin wrap, unitized curtain wall, tensioned mesh, brushed aluminium soffit, 316 stainless plate joints, PVC membrane, polar-white PV module). No third-party textures were downloaded, so no CC0 attributions are needed. If CC0 maps from ambientCG or Poly Haven are swapped in later, list each asset here with its URL and licence.

Swatch colours were sampled from the deck: p11 (inspiration palette) and p13 (material swatches). The samples are logged in `REFERENCE_NOTES.md`.

## Reference imagery (internal, from the HKS deck)

Source: `reference/20261022_LFF_Eagles_HKS.pdf`, the HKS Concept Pricing Package of Oct 22 2026. The following are derived by `scripts/prep_assets.py` and are for internal team use only:

| Runtime asset | Page | Use |
|---|---|---|
| `public/assets/title_players.jpg` | p12 | Title-card football-player texture, with the deck's lettering removed |
| `public/assets/elev_{n,e,s,w}.png` | p30–33 | Elevation line art drawn in scene 6, at true scale from the scale bars |
| `public/assets/siteplan.jpg` | p74 | Studio MLA proposed site plan, draped under the model in scene 7 |

The site plan and landscape design are by **Studio MLA**, as credited in the deck.

## Fonts

- **Hanken Grotesk**, SIL Open Font License 1.1, via `@fontsource/hanken-grotesk` 5.2.8. The setup also accepts HKS Sans if it is supplied in `reference/fonts/`.

## Software

| Package | Version | Licence |
|---|---|---|
| three.js | 0.178.0 | MIT |
| postprocessing | 6.37.8 | Zlib |
| n8ao (N8AO ambient occlusion) | 1.10.1 | ISC |
| GSAP | 3.13.0 | GSAP Standard "no charge" licence |
| Vite | 6.3.5 | MIT |
| Playwright (recording) | 1.63 | Apache-2.0 |
| FFmpeg (encoding) | 6.1 | LGPL/GPL |

No manufacturer logos appear anywhere in the animation. Basis-of-design products are named in text only, as in the deck. The `LOGO_SLOT` anchors on the towers carry blank plates.
