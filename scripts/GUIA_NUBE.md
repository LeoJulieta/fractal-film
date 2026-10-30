# GUÍA NUBE — activar Kaggle y GitHub Actions (paso a paso, 0 USD)
> Regla 3: nube gratuita PRIMERO, PC local SOLO como fallback. Estas dos rutas completan
> a Colab T4 (ya probada). La PC solo hace clics de subida/descarga; NUNCA renderiza.

---

## RUTA A — KAGGLE (30 h/semana GPU gratis)

Archivos listos: `scripts/kaggle-film.ipynb` (8 celdas, JSON validado, GPU declarada).

1. Crear cuenta gratis en https://www.kaggle.com (con Google o email).
2. Abrir https://www.kaggle.com/code → **New Notebook**.
3. **Acelerador**: menú superior derecho **Settings → Accelerator → GPU (T4 x2 o P100)**.
   (Si sale "Internet: Off", activarlo: **Settings → Internet → On** — necesario para npm.)
4. Crear el zip del proyecto (SOLO la carpeta del proyecto, sin node_modules):
   PowerShell (la ruta tiene espacios; respetar comillas):
   ```powershell
   cd "C:\Users\Usuario\Documents\Proyecto predeterminado\fractal-film"
   Compress-Archive -Path src,public,scripts,package.json,package-lock.json,tsconfig.json,remotion.config.ts -DestinationPath fractal-film.zip -Force
   ```
   (verificado 2026-10-30: `src/index.ts` vive dentro de `src/`, así que incluir la carpeta
   `src` completa es suficiente; `out/` y `node_modules/` NO se incluyen — el render corre
   entero en la nube).
5. En Kaggle: pestaña **Add data** (izquierda) → **Upload files** → subir `fractal-film.zip`.
6. **Reemplazar las celdas del notebook** por las de `scripts/kaggle-film.ipynb`
   (copiar/pegar celda por celda, o subir el .ipynb desde Add data y abrirlo).
7. **Run → Run all**. La celda 6 renderiza con `--gl=swangle` en la GPU de Kaggle.
8. Descarga: celda 7 muestra un **FileLink**; también la pestaña **Output** (ícono de
   archivos a la izquierda) → `fractal-film/out/film.mp4` → Descargar.
9. Verificar locally tras bajar: `sandbox-check.mjs` (o comparar tamaño ~2 MB).

---

## RUTA B — GITHUB ACTIONS (2000 min/mes gratis, render por git push)

Archivos listos: `.github/workflows/render.yml` (YAML validado), `scripts/push-a-nube.ps1`,
`.gitignore` (excluye node_modules/out/.venv-kokoro).

1. Crear cuenta gratis en https://github.com (si no existe).
2. Crear un repo VACÍO: **+ → New repository** → nombre `fractal-film` → **Private**
   (recomendado) o Public → **Create repository** (NO marcar "Add README").
3. Copiar la URL que muestra GitHub (algo como `https://github.com/TU_USUARIO/fractal-film.git`).
4. Ejecutar el helper (reemplaza TU_USUARIO):
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Usuario\Documents\Proyecto predeterminado\fractal-film\scripts\push-a-nube.ps1" -RemoteUrl https://github.com/TU_USUARIO/fractal-film.git
   ```
5. El helper prepara todo; luego hacer el push (pide login de GitHub la primera vez —
   Git Credential Manager abrirá una ventana; iniciar sesión en el navegador):
   ```powershell
   cd "C:\Users\Usuario\Documents\Proyecto predeterminado\fractal-film"
   git push -u origin main
   ```
6. En GitHub: pestaña **Actions** → workflow `render-film` → se ejecuta solo (trigger
   push a main). Renderiza 1350 frames en Ubuntu (sin GPU, más lento que T4) y sube
   `film-mp4` como artifact con 30 días de retención.
7. Descarga: **Actions** → run completado → **Artifacts → film-mp4** → Download (1 clic,
   sin errores de backend como el de Colab).
8. Re-render futuro: cualquier `git push` con cambios en `src/` o `public/` re-renderiza
   automáticamente. También se dispara manual con **workflow_dispatch** (botón "Run workflow").

---

## Comparación honesta (medida/estimada)

| Ruta | GPU | Coste | Carga en tu PC | Nota |
|---|---|---|---|---|
| Colab T4 | T4 | 0 USD | 0 | Ya probada. Descarga a veces falla por backend → usar `files.download()` |
| Kaggle | T4 x2 / P100 | 0 USD | 0 | 30 h/semana; requiere login + subir zip |
| Actions | Sin GPU (CPU 4 vCPU) | 0 USD | 0 | Lento (~×2-4 vs T4) pero descarga por artifact siempre funciona y es 1 clic |
