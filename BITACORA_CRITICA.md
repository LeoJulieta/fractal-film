# BITACORA CRÍTICA Y REGLAS DE ORO
> Leer SIEMPRE antes de responder.

## Errores a NO repetir
1.  **Rutas:** Siempre usar rutas absolutas (`/content/` en Colab, C:\Users\Usuario\... local). Nunca suponer directorios relativos en entornos volátiles.
2.  **Comandos:** Solo usar comandos nativos de PowerShell en local. No intentar usar `grep`/`awk`/`head` (no existen).
3.  **JSON:** Notebooks `.ipynb` se generan SIEMPRE con `json.dump()` desde Python. Nunca mediante texto plano.
4.  **Confirmación:** No declarar "Entregado" hasta que el usuario confirme la descarga exitosa del archivo final.

## Protocolo de Evolución
- **Verificación previa:** Cada vez que se toque el pipeline, ejecutar `sandbox-check.mjs` para validar existencia.
- **Autonomía:** El modelo debe consultar `BITACORA_CRITICA.md` y `PROGRESO.md` en cada turno.
- **Transparencia:** Si un comando falla (ej. `ls -l` o `curl`), admitirlo y cambiar de estrategia inmediatamente (sin reintentar lo que no funciona).
- **PC como mando, nube como músculo (2026-10-30):** nunca renderizar en local si existe nube
  gratuita. Rutas válidas: Colab (`colab-film.ipynb`), Kaggle (`kaggle-film.ipynb`), GitHub
  Actions (`.github/workflows/render.yml`, disparo por `git push`). Audio con `staticFile`.
- **ExecutionPolicy de Windows:** los `.ps1` locales se ejecutan con
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <script>` (política bloquea ejecución directa).
- **YAML:** validar siempre con `yaml.safe_load` antes de entregar workflows (un `: ` dentro de un scalar rompe el parseo).
- **URL-encoding en Windows:** NUNCA usar `new URL(import.meta.url).pathname` en Node sobre
  Windows (encodea espacios como %20 en rutas como "Proyecto predeterminado"). Usar
  `fileURLToPath(import.meta.url)`. Ya falló en render-auto.mjs y sandbox-check.mjs.
- **Registro perpetuo (2026-10-30):** TODA decisión/avance/error se registra en
  `BITACORA_VIVA.md` (`scripts/registrar.ps1`). Es la memoria entre sesiones y modelos.
- **Ollama local:** gemma4:12b (8 GB) y gemma4:26b (18 GB) NO son viables en esta PC de
  8 GB RAM (swap letal). Último recurso solo sin internet. Preferir modelos gratis en nube.

Actualizado: 2026-10-29.
