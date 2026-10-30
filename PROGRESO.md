# PROGRESO — fractal-film

> **Documento de arranque autónomo.** Si estás en una sesión NUEVA: lee este
> archivo, inspecciona los archivos listados abajo, y continúa desde el
> checklist. Todo el código vive en disco; nada depende de una conversación
> previa.

Película fractal raymarched (45 s, 1350 frames @30fps, 1920×1080) con coro
sintético + narración TTS local (2 voces). 100% local y gratis.

## Prompt de arranque para sesión nueva
```
Continuá el proyecto en "C:\Users\Usuario\Documents\Proyecto predeterminado\fractal-film".
Primero leé PROGRESO.md (este archivo) y los archivos fuente listados ahí.
Seguí el checklist en orden bajo el protocolo: 1 turno = 1 unidad de trabajo,
con reporte corto (qué hice / qué verifiqué / qué sigue). No reesbas archivos
existentes sin leerlos.
```

## Protocolo de trabajo (acordado con el usuario)
- **1 turn = 1 unidad concreta** + reporte corto al final.
- Archivos grandes: **un `write` por turn** (evita cortes por límite de salida).
- Verificar cada etapa con un still antes de avanzar.
- Estado siempre refrescado en este archivo (mover ítems a ✓ al completarlos).
- **EVITAR PAUSAS / LÍMITES** (principio): maximizar todo gratis y evolucionar.
  El límite de uso del servicio es del proveedor (openrouter); NO configurable
  aquí. **Solución implementada = protocolo de alta densidad:** esta sesión
  usa 1 turno = 1 unidad concreta + archivo grande escrito por turno +
  verificación con still antes de avanzar = mínimo mensajes por resultado.
  Además: trabajo 100% local (Kokoro, música sintetizada, render Remotion) →
  sin dependencias externas de generación, resistente a cortes de API.
- **Potenciar**: si se requiere más velocidad de render, usar la nube (Colab
  / Kaggle GPU gratuita) solo para la fase 4, no para audio (ya óptimo local).

## Entorno (verificado)
- Carpeta: `C:\Users\Usuario\Documents\Proyecto predeterminado\fractal-film`
- Comando base (siempre preceder a node/npm/npx en PowerShell):
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
- Remotion 4.0.539, `remotion.config.ts`: jpeg, `angle-egl`, concurrency null, delayRender 120000.
- **GPU**: GeForce 210 sin D3D11 FL11+ → ANGLE usa **WARP (software D3D11)** — es normal, no bug.
- **Benchmark**: ~0.3–0.5 s/frame a 1080p con 96 pasos (10 frames = 7.7 s con bundle). 1350 frames ≈ 10–20 min. ✅
- **Python 3.12 INSTALADO** (winget). venv en `.venv-kokoro` con **Kokoro-82M**
  (Apache 2.0, 82M params, corre en CPU). `kokoro>=0.9.4 soundfile` + torch CPU.
- **TTS = Kokoro** (no Piper): mejor calidad que corre en CPU. Español
  `lang_code='e'`, G2P vía espeak-ng (en `espeakng-loader`). Voces es:
  `em_alex` (masc), `ef_dora` (fem), `em_santa` (masc). 24 kHz mono.
- **Verificado**: `em_alex` sintetizó "Toda forma nace de una sola ecuación." →
  2.8 s audio en 2.08 s (**1.35× tiempo real en CPU**), peak 0.38 RMS 0.049.
  Prueba: `scripts/test_kokoro.py` → `out/audio/test_es.wav`.
- El proyecto `remotion-video` (video 1, entregado) está al lado y NO se toca.

## Mapa de archivos
| Archivo | Estado | Qué es |
|---|---|---|
| `src/lib/gl.ts` | ✅ | Pass (programa+uniforms+draw), createTarget (FBO), createGL (preserveDrawingBuffer + log del renderer) |
| `src/components/GLCanvas.tsx` | ✅ | Canvas determinista: delayRender por frame + useLayoutEffect (dibuja antes del paint) |
| `src/timeline.ts` | ✅ | MORPHS, worldAt(), CAM_KEYS (12 keyframes), cameraAt() Catmull-Rom |
| `src/shaders/film.ts` | ✅ sin probar | SCENE_FRAG (4 mundos+morph+reflexiones+glow) + PRESENT_FRAG (ACES+gamma+viñeta). Salida LINEAL |
| `src/shaders/world1.ts` | ✅ | Prueba mandelbulb (superada por film.ts, queda como referencia) |
| `src/Main.tsx` | ✅ | Ahora sí: `<GLCanvas scene={filmScene}>` (dejó de ser el test) |
| `src/Root.tsx` | ✅ | durationInFrames=1350, fps 30, 1920×1080 |
| `src/lib/filmScene.ts` | ✅ | Escena: scene→FBO lineal→present→pantalla, lee cameraAt/worldAt de timeline |
| `src/shaders/world1.ts` | ✅ | Prueba mandelbulb (superada por film.ts, queda como referencia) |
| `PROGRESO.md` | ✅ | este archivo |

## Decisiones de diseño (Fase 2 — pipeline, aún no escrita)
- Passes por frame: **scene(FBO lineal 1920×1080) → bright(umbral 0.6, media) →
  blurH → blurV(cuarto) → composite(scene+bloom+aberración+viñeta+gamma) →
  FXAA+grano → pantalla**.
- Componente nuevo `FilmCanvas` (misma mecánica que GLCanvas pero con la cadena
  de passes). Mantener delayRender por frame + useLayoutEffect.
- Escena sale LINEAL; PRESENT ya hace ACES+gamma — reutilizarlo como base del
  composite (agregar bloom+aberración).
- FXAA: versión corta (3.11 console), grano DESPUÉS del FXAA.
- Sombreado: reflexiones solo en mundos ≥2 (suelo/agua), con marcha de reflejo
  de 56 pasos (GLSL sin recursión → `baseShade` sin reflejos para el bounce).
- Uniformes de escena: uRes, uTime, uCamPos, uCamTgt, uFov, uWorld.
- Globales del shader: gTrap (órbita), gMat (0 normal/1 suelo/2 agua), gGlow.

## Checklist

### Fase 0 — Entorno (HECHO)
- [x] Scaffold + npm install + typecheck limpio
- [x] gl.ts + GLCanvas.tsx (canvas determinista)
- [x] Prueba mandelbulb (out/test.png) + benchmark OK
- [x] timeline.ts (mundos, morphs [300-360][630-690][960-1020], cámara CR)
- [x] film.ts: shader de los 4 mundos (ESCRITO, SIN RENDERIZAR)

### Fase 1 — Verificación de mundos (HECHO ✅)
- [x] FilmCanvas (`src/lib/filmScene.ts`) + Main real + Root 1350 frames
- [x] Stills de verificación: frames 150 / 500 / 830 / 1180 — los 4 mundos renderizan
- [x] W0 mandelbulb: espectacular (out/w0.png)
- [x] W1 corredor KIFS: corregido — añadí bounding sphere + **túnel de cámara**
      (fractal menos cilindro) y bajé el glow que saturaba a rosa. Ahora es un
      túnel fractal con vacío oscuro al frente (out/w1.png)
- [x] W2: **rediseñado** de mandelbox (se veía mancha lechosa) a **campo de
      columnas Menger** en rejilla + suelo reflectante + cielo con sol bajo.
      Cámara eje del pasillo. Bajo contraste → el contraste global se afinará
      en el composite (Fase 2), no por mundo (out/w2.png)
- [x] W3 mar/agujas: quité la bounding sphere que generaba un **disco falso**
      con anillos; ahora aguja KIFS detallada sobre agua reflectante (out/w3.png)

### Fase 2 — Post completo (HECHO ✅)
- [x] bright + blur H/V (bloom ¼ res, umbral 0.62, knee 0.25)
- [x] composite: aberración radial + bloom + exposición + ACES + contraste 1.14
      + saturación 1.18 + viñeta
- [x] FXAA (consola 3.11) + grano de película (0.035)
- [x] Cableado en `filmScene.ts`: 5 targets / 5 passes encadenados. Typecheck OK.
- [x] Stills post: W0 (halo cian con bloom real), W2 (catedral oscura con
      contraste), W3 (atardecer cálido + reflejos) — verificados.
- [x] **Fix W1**: con el post se quemaba a magenta/blanco. La emisión de bordes
      `edgeCol*edge` con `edge=exp(-trap*2.2)` era ≈1 en TODA la pared. Cambios:
      `edge=exp(-trap*6.0)` (solo bordes reales), `edgeCol` desaturado hacia
      blanco cálido (`mix(edgeCol,vec3(1),0.45)`), emisión 0.70, rim*rim. Ahora
      es un túnel de cristal perlado con filamentos incandescentes (out/w1_post.png)

### Fase 3 — Audio (EN PROCESO)
- [x] **TTS = Kokoro-82M instalado y verificado** (Python 3.12 + `.venv-kokoro`,
      español `lang_code='e'`, voces `em_alex` masc / `ef_dora` fem). 1.35× realtime en CPU
- [x] `scripts/generate-voices.py`: las 4 frases → `out/audio/voice{1..4}.wav` (24 kHz,
      12.7 s de habla: 2.85/3.33/3.23/3.30 s). Normalizadas a pico 0.89
- [x] `scripts/generate-music.mjs`: score 45 s → `out/audio/music.wav` (44.1 kHz stereo).
      Verificado por RMS: impacts en 11/21/32 s (picos), swell final 40-41 s,
      ducking en ventanas de voz, sin silencios. Capas = drone + coro formantes
      (aah/ooh) + impacts + risers + pulso + swell + reverb Schroeder
- [x] `<Audio>` integrado en Main (music.wav 45s stereo, ducking en voces, still OK)
- [x] `REGLAS.md` creado y leído — 5 reglas para todo modelo / sesión
- [x] Potenciación verificada (CPU i5-14400F, 7.8 GB RAM, 105 GB libre, GPU 210/WARP); nube gratuita (Colab/GPU) como fallback documentado
- [x] Render completo `out/film.mp4` entregado (1350 frames, 45 s, 1.94 MB, h264, audio integrado)

### Fase 4 — Composición final
- [ ] Textos: apertura mínima + tarjeta final (google-fonts, delayRender en Main)
- [ ] Typecheck + stills de control + verify audio
- [ ] Render completo → out/film.mp4 → ffprobe (duración/fps/audio) → entrega

## Guion narración (borrador)
- Voz A (masc) ~4 s: "Toda forma nace de una sola ecuación."
- Voz B (fem) ~13.5 s: "Pliega, repite, escala — y el abismo toma cuerpo."
- Voz A ~24 s: "Cada frontera esconde la misma infinitud."
- Voz B ~35 s: "No dibujamos el infinito: lo dejamos calcular."
- Tarjeta final ~41 s: "INFINITO — un filme generado por fórmulas"

## Estructura temporal (1350 frames)
- W0 mandelbulb: [0,300) · morph [300,360) → W1
- W1 corredor KIFS: [360,630) · morph [630,690) → W2
- W2 monolitos: [690,960) · morph [960,1020) → W3
- W3 mar/agujas: [1020,1350)

## Comandos útiles
```powershell
cd "C:\Users\Usuario\Documents\Proyecto predeterminado\fractal-film"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
npx.cmd tsc --noEmit -p tsconfig.json
npx.cmd remotion still src/index.ts Main out\w0.png --frame=150
npx.cmd remotion render src/index.ts Main out/film.mp4
```

## Errores ya resueltos (no repetir)
- `background-clip:text` en spans con hijos transformados no pinta en Chrome →
  tintear por glifo (video 1). Aquí no aplica, pero cuidado con trucos de CSS.
- npm.ps1 bloqueado por execution policy → siempre `npm.cmd`/`npx.cmd` + PATH.
- ffmpeg de Remotion no tiene `volumedetect`/muxer null → usar `loudnorm` o
  extraer WAV y medir con Node.
- **Emisión por `exp(-trap*k)` con k chica** tiñe TODA la superficie, no solo
  bordes (W1 se quemaba de magenta con el post). Subir el exponente concentra
  el glow en bordes reales; desaturar la paleta hacia blanco evita el color
  plano saturado.
- Escena sale LINEAL; el tonemap (ACES) + contraste/sat van en el composite de
  post, NO en el shader de escena (evita doble tonemap y control por frame).


## Estado 2026-10-30 — Pipeline "PC como mando, nube como músculo" (IMPLEMENTADO)

Entregable: `out/film.mp4` (1350 frames, 45 s) — render local verificado + render Colab T4
confirmado por el usuario (captura). Pendiente del usuario: descarga desde Colab
(clic usuario, no automatizable) o re-render por cualquiera de las rutas nube nuevas.

Rutas de nube GRATUITAS implementadas (todas verificadas con sandbox):
1. **Colab T4** — `scripts/colab-film.ipynb` (7 celdas, JSON validado). Ya ejecutado con éxito.
2. **Kaggle 30 h/semana GPU** — `scripts/kaggle-film.ipynb` (8 celdas, generado con
   `build-kaggle-nb.py` via json.dump, accelerator GPU en metadata). Pendiente: prueba
   real por el usuario (requiere login Kaggle + subir fractal-film.zip).
3. **GitHub Actions 2000 min/mes** — `.github/workflows/render.yml` (YAML validado con
   yaml.safe_load; 6 pasos; triggers push a main + workflow_dispatch; artifact 30 días).
   Helper: `scripts/push-a-nube.ps1 -RemoteUrl <repo>` (sintaxis validada).
   Pendiente del usuario: crear repo en GitHub y hacer push (credenciales = su clic).

Cambio de código que habilitó esto: `src/Main.tsx` usa ahora
`staticFile('music.wav')` en vez de `http://localhost:8888/music.wav` → el audio funciona
en local, Colab, Kaggle y Actions sin servidor local. Typecheck verificado OK.

Alivio de PC: `scripts/aliviar-pc.ps1` (sintaxis validada; ejecutado 2026-10-30,
liberó 1279 MB de temporales; RAM 4.1 GB libre; no mata procesos). Los `.ps1` se ejecutan
con `powershell.exe -NoProfile -ExecutionPolicy Bypass -File`.

Medición de PC (2026-10-30): i5-14400F 10C/16T OK; RAM 7.84 GB (cuello de botella);
GPU 210 WARP (nunca render local pesado); disco C: 95 GB libres.
