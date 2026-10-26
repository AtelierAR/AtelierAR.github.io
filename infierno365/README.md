# INFIERNO 365 · Animaciones (Remotion)

Animaciones de la presentación **INFIERNO 365** para los Diablos Rojos del México
(Estadio Alfredo Harp Helú, Ciudad de México).

| Composición | Módulo | Duración | Salida |
|---|---|---|---|
| `Aficion` | ACTO II-B · LA AFICIÓN — "¿QUIÉN LLENA EL INFIERNO?" | 78 s · 1920×1080 · 30 fps | `render/aficion_infierno365_1080p.mp4` |

## Requisitos

- Node.js **22.18 o más reciente** (el script de stills usa `.ts` directamente).
- `ffmpeg` solo si quieres regenerar los marcadores de audio.
- Internet la primera vez: Remotion descarga su navegador y las fuentes Anton e Inter
  desde Google Fonts.

Versiones fijadas exactas en `package.json` (Remotion 4.0.528).

## Previsualizar

```bash
npm install
npm run dev
```

Se abre Remotion Studio en el navegador. Elige **INFIERNO365 → Aficion**. La línea de
tiempo muestra cada escena como un bloque con su nombre (`e01GradaVacia`, …).

## Editar textos y cifras

Todo el texto en pantalla y todas las cifras viven en
**`src/constants/copyAficion.ts`**. Las escenas no tienen texto propio.

- Cada cifra tiene un comentario con su fuente (Diablos/BMV, MLB, Fighters Sports &
  Entertainment · F Village, KBO).
- Las cifras propias de INFIERNO 365 están marcadas como **[estimación]**
  (meta de 17,000 por juego, 85 % de ocupación, ≈ 767 mil por temporada, minutos por
  tramo del día, las seis tribus).
- Verifica temporada y documento exacto de cada fuente antes de presentar.
- Usa comillas tipográficas (“ ” ‘ ’), signos de apertura (¿ ¡) y acentos.

## Cambiar tiempos

**`src/constants/brand.ts`**:

- `ESCENAS_AFICION` — inicio y duración (segundos) de cada una de las nueve escenas.
  La duración total se calcula sola.
- `MARCADORES_AFICION` — segundo exacto de los tres golpes visuales
  (`golpeCatorceMil`, `golpeMitadYMitad`, `golpeCuatro52`), del tambor de República
  Dominicana (`tamborInicio`, `tamborFin`, `tamborBpm`) y del cierre. Visual y audio
  leen el mismo marcador: si lo mueves, ambos se mueven.
- `STILLS_AFICION` — el cuadro de cada escena que se exporta como PNG.

Paleta, tipografías, ángulo de corte (18°), filete (2 px), grano (≤ 6 %) y los springs
también están en `brand.ts`.

## Cambiar el audio

Los archivos de `public/audio/aficion/` son **marcadores** sintéticos (generados con
`npm run audio`, libres de derechos), no pistas finales:

| Archivo | Uso |
|---|---|
| `ambiente.wav` | Murmullo de grada: lejano al inicio, crece cuando se llena |
| `tambor.wav` | Un golpe. Suena en los tres golpes visuales y en el ritmo de República Dominicana |
| `cierre.wav` | Pulso grave de la escena 09 |

Para reemplazarlos, copia tu audio **propio o con licencia** con el mismo nombre de
archivo. **No uses música comercial con derechos.** Si borras un archivo, la pieza se
renderiza en silencio sin error. Los volúmenes están en
`src/scenes/aficion/AudioAficion.tsx`.

## Renderizar

```bash
npm run render   # → render/aficion_infierno365_1080p.mp4 (H.264, 1080p, 30 fps)
npm run stills   # → render/stills/aficion/<escena>.png
```

Si Remotion no puede descargar su navegador (red corporativa, sin internet), usa un
Chrome o Chromium instalado:

```bash
REMOTION_BROWSER="/ruta/a/chrome" npm run render
REMOTION_BROWSER="/ruta/a/chrome" npm run stills
```

## Estructura

```
src/
  constants/brand.ts         colores, tipografías, tiempos, marcadores
  constants/copyAficion.ts   texto y cifras con fuente
  constants/fonts.ts         Anton + Inter vía @remotion/google-fonts
  components/                Grada, Brasas, Contador, Pizarra, Diamante,
                             SplitMitad, TribuPuntos, RelojDoble, FeedVertical,
                             PulsoTambor, RecorridoDia, Costura, Filete,
                             CorteDiagonal, Grano, Texto
  scenes/aficion/            Escena01 … Escena09, AudioAficion
  Aficion.tsx                composición
  Root.tsx                   registro de composiciones
public/audio/aficion/        marcadores de audio
scripts/                     stills.ts, generar-audio.sh
render/                      MP4 y stills
```

## Storyboard

| # | Tiempo | Escena |
|---|---|---|
| 01 | 0–5 s | La grada vacía · “¿QUIÉN LLENA EL INFIERNO?” |
| 02 | 5–14 s | De 3 mil a 14 mil · golpe **14 MIL** (10.5 s) |
| 03 | 14–21 s | La afición más joven · 60 → 35 |
| 04 | 21–27 s | Mitad y mitad · golpe **MITAD Y MITAD** (22.6 s) |
| 05 | 27–37 s | Seis tribus |
| 06 | 37–52 s | El mundo en cuatro diamantes · golpe **4:52** (42.6 s) |
| 07 | 52–64 s | Un día en el Infierno |
| 08 | 64–72 s | La meta · 17,000 por juego |
| 09 | 72–78 s | Transición · una brasa sube · corte |

## Reglas de marca y accesibilidad

- Paleta estricta: Negro Infierno `#0B0B0B`, Rojo Diablo `#D0021B`, Blanco Hueso
  `#F5F3EF`; apoyo `#1C1C1C`, `#2A2A2A`, `#8E0A14`; gris ceniza `#6B6B6B` solo para
  datos del pasado.
- Personas siempre abstractas (puntos de luz). Sin logotipos de clubes, ligas ni marcas;
  países en texto plano, sin banderas.
- Ningún texto menor a 36 px. Todo el texto de lectura va en hueso (17.6:1). El rojo
  (3.5:1) y el ceniza (3.6:1) solo se usan en cifras display ≥ 100 px y en gráficos.
- Sin destellos: el tambor pulsa a 2 golpes por segundo y mueve alturas, no brillo; no
  hay parpadeos rojos de pantalla completa.
