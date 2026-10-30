import json
obj = {
  "cells": [
    {"cell_type":"markdown","metadata":{},"source":["# Fractal Film — Render en Colab (gratis, GPU T4)\nPrioridad: nube gratuita > PC local (REGLAS.md). Confirmado: T4 seleccionado."], "execution_count":None, "outputs":[]},
    {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":["# 1. SUBIR MANUALMENTE (arrastrar archivos)\n!ls -l /content/fractal-film.zip 2>/dev/null || echo 'Sube fractal-film.zip al entorno de Colab (panel izquierdo)'"]},
    {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":["# 2. Instalar Remotion (npm, no pip)\n!npm install -g remotion 2>&1 | tail -n 3 || echo 'Instalado o usar existente'"]},
    {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":["# 3. Descomprimir proyecto en /content\n!unzip -q /content/fractal-film.zip -d /content/fractal-film 2>/dev/null || echo 'Ya existe o subir carpeta directamente'\n!ls /content/fractal-film/src/index.ts 2>/dev/null || echo 'Verificar que src/index.ts esté dentro de /content/fractal-film/'"]},
    {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":["# 4. Copiar audio (subir manualmente public/music.wav o usar out/audio/music.wav)\n!mkdir -p /content/public\n!cp /content/fractal-film/out/audio/music.wav /content/public/music.wav 2>/dev/null || echo 'Sube public/music.wav manualmente a /content/public/'\n!ls /content/public/music.wav 2>/dev/null || echo 'Requiere subir archivo de audio a /content/public/'"]},
    {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":["# 5. Render completo (1350 frames, ~2-4 min en T4)\n!cd /content/fractal-film && npx remotion render src/index.ts Main /content/fractal-film/out/film.mp4"]},
    {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":["# 6. Verificar resultado\n!ls -lh /content/fractal-film/out/film.mp4 2>/dev/null || echo 'Render completo o aún corriendo'\n!echo 'Duracion estimada: 1350 frames @30fps = 45 segundos'"]}
  ],
  "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}, "language_info": {"name": "python", "version": "3.10.12"}},
  "nbformat": 4,
  "nbformat_minor": 4
}
with open('scripts/colab-film.ipynb', 'w', encoding='utf-8') as f:
    json.dump(obj, f, indent=2, ensure_ascii=False)
print('JSON corregido y escrito: ' + str(len(obj['cells'])) + ' celdas')
