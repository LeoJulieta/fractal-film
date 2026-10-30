# -*- coding: utf-8 -*-
"""Genera scripts/kaggle-film.ipynb validando JSON con json.dump (BITACORA_CRITICA.md regla 3)."""
import json
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_path = os.path.join(root, "scripts", "kaggle-film.ipynb")

def code_cell(src):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": src.splitlines(keepends=True)}

def md_cell(src):
    return {"cell_type": "markdown", "metadata": {}, "source": src.splitlines(keepends=True)}

cells = [
    md_cell(
        "# Fractal Film — Render en Kaggle (gratis, GPU)\n"
        "Prioridad: nube gratuita > PC local (REGLAS.md). En Kaggle: **Settings → Accelerator → GPU (T4 x2 o P100)**.\n"
        "Flujo: subir `fractal-film.zip` a `/kaggle/working/` (botón 'Add data' o arrastrar) → Ejecutar todas → descargar de la pestaña **Output**."
    ),
    code_cell(
        "# 1. Verificar zip subido en /kaggle/working\n"
        "!ls -l /kaggle/working/fractal-film.zip 2>/dev/null || echo 'SUBE fractal-film.zip a /kaggle/working (Add data > Upload files)'"
    ),
    code_cell(
        "# 2. Descomprimir proyecto\n"
        "!rm -rf /kaggle/working/fractal-film\n"
        "!mkdir -p /kaggle/working/fractal-film\n"
        "!unzip -q /kaggle/working/fractal-film.zip -d /kaggle/working/fractal-film\n"
        "!ls /kaggle/working/fractal-film/src/index.ts 2>/dev/null || echo 'ERROR: src/index.ts no encontrado. Verifica la estructura del zip (debe contener la carpeta del proyecto).'"
    ),
    code_cell(
        "# 3. Node.js (incluido en las imágenes de Kaggle)\n"
        "!node --version && npm --version || (echo 'Instalando node...' && apt-get update -qq && apt-get install -y -qq nodejs npm > /dev/null && node --version)"
    ),
    code_cell(
        "# 4. Dependencias del proyecto (nube, cero carga local)\n"
        "!cd /kaggle/working/fractal-film && npm install --no-audit --no-fund 2>&1 | tail -n 3"
    ),
    code_cell(
        "# 5. Audio: garantizar public/music.wav\n"
        "!mkdir -p /kaggle/working/fractal-film/public\n"
        "!cp /kaggle/working/fractal-film/out/audio/music.wav /kaggle/working/fractal-film/public/music.wav 2>/dev/null || echo 'public/music.wav ya incluido en el zip (staticFile lo lee de public/)'"
        "\n!ls -lh /kaggle/working/fractal-film/public/music.wav"
    ),
    code_cell(
        "# 6. Render completo (1350 frames @30fps = 45 s). --gl=swangle: render por software en Linux (GPU no disponible para WebGL en runners)\n"
        "!cd /kaggle/working/fractal-film && npx remotion render src/index.ts Main out/film.mp4 --gl=swangle --concurrency=4 2>&1 | tail -n 8"
    ),
    code_cell(
        "# 7. Verificar + enlace de descarga (pestaña Output / Kaggle Files)\n"
        "!ls -lh /kaggle/working/fractal-film/out/film.mp4 && echo 'Duracion: 1350 frames @30fps = 45 s'\n"
        "from IPython.display import FileLink, display\n"
        "display(FileLink('/kaggle/working/fractal-film/out/film.mp4'))"
    ),
]

nb = {
    "cells": cells,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.10.12"},
        "accelerator": "GPU",
    },
    "nbformat": 4,
    "nbformat_minor": 4,
}

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

# Validacion inmediata (leer lo recien escrito)
with open(out_path, "r", encoding="utf-8") as f:
    data = json.load(f)
print("OK notebook generado y validado:", out_path)
print("Celdas:", len(data["cells"]), "(markdown:", sum(1 for c in data["cells"] if c["cell_type"] == "markdown"), "| code:", sum(1 for c in data["cells"] if c["cell_type"] == "code"), ")")
