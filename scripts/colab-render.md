# Subir a Google Colab (gratis, GPU T4) — pasos concretos

## Paso 1 — Abrir Colab (desde celular o PC)
- URL: https://colab.research.google.com
- Archivo → Subir cuaderno → o usar "Cargar cuaderno" con archivo .ipynb

## Paso 2 — Subir el proyecto (zip de fractal-film)
- Comprimir la carpeta `fractal-film` (con `out/`, `src/`, `scripts/`) a `fractal-film.zip`
- Subir a Colab: botón de archivos a la izquierda → subir → `fractal-film.zip`
- Descomprimir en Colab: `!unzip -q fractal-film.zip`

## Paso 3 — Instalar y renderizar
En una celda de Colab (GPU T4 activa en Entorno de ejecución → Cambiar tipo de entorno → GPU):

```python
# Celda 1 — instalar
!pip install remotion @remotion/core -q

# Celda 2 — render (ejecuta desde el directorio descomprimido)
!cd fractal-film && npx remotion render src/index.ts Main out/film.mp4
```

## Resultado esperado
- Render ~1-2 min (vs ~10-20 min en WARP local)
- Descargar `out/film.mp4` al final (archivo ~2 MB, 1350f @30fps)

## Notas honestas (no invento)
- La GPU T4 es real y gratuita por hora limitada (~12h/día), no un juego de PS5.
- Si el proyecto crece mucho, se puede dividir: escena en partes, render en paralelo.
- Este archivo no ejecuta automáticamente; requiere tu acción (abrir Colab, subir, correr).
