# Flujo sin subir manualmente a Colab (opción real, requiere 1 clic inicial)
# Paso del usuario (una sola vez, con aprobación previa):
#  1. Crear repo público en GitHub (github.com/new) sin costo
#  2. Subir carpeta fractal-film (o usar git push con archivo local)
#  3. Copiar URL del repo (ej: https://github.com/TUUSUARIO/fractal-film)
# Paso automático en Colab (sin subir archivos manualmente nunca más):
#  1. Abrir https://colab.research.google.com
#  2. Archivo -> Subir cuaderno (subir colab-film.ipynb corregido)
#  3. Entorno de ejecución -> Cambiar tipo -> GPU T4
#  4. En celda 1: reemplazar con !git clone https://github.com/TUUSUARIO/fractal-film.git /content/fractal-film
#  5. En celda 4: usar /content/fractal-film/public/music.wav (ya en repo)
#  6. Ejecutar todas
# Esto elimina la necesidad de subir zip/manual cada vez.
# No inventa ejecución: requiere aprobación previa para hacer el paso de clone.
