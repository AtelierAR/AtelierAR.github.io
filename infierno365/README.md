# INFIERNO 365 · Animación de apertura

Pieza de apertura (~70 s) para la propuesta de renovación y ampliación del
Estadio Alfredo Harp Helú a los Diablos Rojos del México.
Hecha en **Remotion 4.0.528** (React + TypeScript), 1920×1080 a 30 fps, con versión 4K desde el mismo código.

## Requisitos

- Node.js 18 o superior (probado con Node 22). Los scripts de stills y audio necesitan Node ≥ 22.18 (leen `brand.ts` directamente).
- Conexión a internet en el primer render: Remotion descarga su Chrome Headless Shell y las fuentes
  Anton e Inter desde Google Fonts (`@remotion/google-fonts`).
- `ffmpeg` solo si quieres regenerar las pistas de audio marcador.

## Previsualizar

```bash
npm install
npm run dev
```

Se abre Remotion Studio en el navegador. Composiciones disponibles:

| Composición     | Qué es                                                      |
|-----------------|-------------------------------------------------------------|
| `Apertura`      | La pieza completa, 1920×1080, con grano y audio             |
| `Apertura4K`    | La misma pieza escalada a 3840×2160 (todo es vectorial)     |
| `Escenas/…`     | Cada escena por separado (`Escena01` … `Escena10`; la 06 se retiró), para revisar o iterar una sola |

## Cambiar textos y cifras

**Todo** el texto vive en `src/constants/copy.ts`. Las escenas no tienen texto propio.

- Cada cifra lleva un comentario con su fuente. Las marcadas **«POR VALIDAR»** vienen del brief y
  deben confirmarse con el club / la LMB antes de presentar (asistencia 592,153; récord de 1967;
  edad 60 → 35; los 18 años de campeonato; los 500 m).
- Usa comillas tipográficas (« » “ ”), acentos y signos de apertura (¿ ¡). El subconjunto de fuente
  cargado los incluye.
- Un `\n` dentro de un texto fuerza el salto de línea (se usa en la escena 08).
- Si alargas mucho un texto, revisa la escena en Studio: los tamaños son fijos (nunca menores a 36 px).

## Ajustar tiempos, colores y tipografía

`src/constants/brand.ts`:

- `ESCENAS` — duración de cada escena (segundos). La suma es la duración total.
- `T` — tiempos internos de cada escena (cuándo entra cada texto, golpes, etc.).
- `CUADRO_FUERTE` — el segundo de cada escena que se exporta como still para el deck.
- `COLOR`, `TIPO`, `VISUAL` — paleta, familias y fallbacks, ángulo de corte (18°), filetes (2 px),
  opacidad del grano (≤ 6 %), springs.
- `ROJO_TEXTO` — color de las cifras rojas (ver *Accesibilidad*).

## Audio

Las pistas de `public/audio/` son **marcadores sintéticos** (generados con ffmpeg, sin derechos de terceros):

| Archivo              | Uso                                                              |
|----------------------|------------------------------------------------------------------|
| `canto_aficion.mp3`  | 0–4 s. Ritmo del canto; la línea del ECG late en `AUDIO.latidos`  |
| `impacto.mp3`        | Los 3 golpes: «592 MIL», «18 CORONAS», «INFIERNO 365»            |
| `ambiente.mp3`       | Rumor de estadio desde los 8 s; se apaga en el hold final |

Para reemplazarlas, sustituye los archivos **con el mismo nombre**. Los puntos de sincronía están en
`AUDIO` dentro de `brand.ts`:

- `latidos` — segundos de cada pulso del ECG (escena 01). Ajústalos al canto real.
- `silencio` (4.0 s) — corte en seco a silencio absoluto; `regresaAmbiente` (8.0 s) — vuelve el ambiente.
- `golpes` — segundo exacto de cada impacto (se calculan desde los tiempos de escena).
- `volumen` — niveles de cada pista.

Para un render mudo: `AUDIO.habilitado = false`. Todo funciona sin audio.
Para regenerar los marcadores (p. ej. tras mover los latidos): `npm run audio:marcadores`.

## Renderizar

```bash
npm run render       # → render/apertura_infierno365_1080p.mp4  (H.264, 1080p, 30 fps)
npm run render:4k    # → render/apertura_infierno365_2160p.mp4  (opcional, 3840×2160)
npm run stills       # → render/stills/NN_escena.png (cuadro más fuerte de cada escena)
```

Si tu red usa un proxy corporativo o no permite descargar Chrome, apunta Remotion a un Chrome/Chromium
local: `npm run render -- --browser-executable=/ruta/a/chrome` (también funciona con `npm run stills -- …`).

## Estructura

```
src/
  constants/brand.ts   colores, tipografías, tiempos, sincronía de audio
  constants/copy.ts    todo el texto en pantalla (con fuentes de cada cifra)
  scenes/Escena01…10   una composición por escena
  components/          Brasas, Contador, Anillo365, Diamante, Pizarra (rodillo + barras),
                       MapaDistrito, Grano, Texto (revelado a 18°, golpe), Lineas (filetes, costura, luminaria)
  Apertura.tsx         las 10 escenas en serie + grano + audio
  Root.tsx             registro de composiciones (1080p, 4K y escenas sueltas)
public/audio/          pistas marcador
scripts/               stills y generador de audio marcador
render/                MP4 final y stills
```

## Accesibilidad y reglas de marca

- **Fotosensibilidad:** ningún elemento destella más de 3 veces por segundo. Los únicos pulsos de
  luz son los 3 golpes (separados por varios segundos) y el destello único de las barras 2024 · 2025.
- **Tamaño:** ningún texto es menor a 36 px a 1080p.
- **Contraste:** todo el texto de lectura es Blanco Hueso sobre Negro Infierno (17.9 : 1).
  Las cifras display en Rojo Diablo (#D0021B) dan 3.5 : 1 sobre negro: cumplen AA para texto grande
  (≥ 3 : 1), pero **no 4.5 : 1** — ningún rojo de esa familia lo alcanza sobre negro. Si se exige 4.5 : 1
  estricto, pon `ROJO_TEXTO = COLOR.hueso` en `brand.ts`: las cifras pasan a blanco y el rojo queda en
  filetes, barras y anillos.
- **Marcas:** no se recrea ningún logotipo (club, LMB, MLB, FIFA, F1). El cierre no lleva logos.
- **Mapas:** el distrito es un diagrama abstracto de nodos y líneas; posiciones no cartográficas.
