# REGLAS — aplicación obligatoria para cualquier modelo/agente
> Leer ANTES de iniciar cualquier tarea. Actualizado con aprobación previa.

## 1. Costo cero (gratis) — prioridad absoluta
- Todo debe ser 100% gratis (local u opcionalmente nube gratuita).
- No usar servicios de pago (no APIs pagas, no cloud pago, no licencias de costo).

## 2. Actualizar base de modelos / herramientas
- Siempre verificar versiones nuevas de herramientas usadas (Kokoro, Remotion, WebGL).
- Mantener listado de modelos/tools gratuitos actualizado.

## 3. Potenciar (prioridad: nube gratuita > esta PC como fallback)
- Buscar primero servicios gratuitos de nube (Colab GPU, Kaggle, GitHub Actions).
- Esta PC (i5-14400F / GPU 210 WARP / 8 GB RAM) es fallback confiable, NO prioridad.
- Siempre buscar mejora antes de usar lo local.
- **Pipeline "PC como mando, nube como músculo" (2026-10-30):** la PC local solo hace
  `git push` / sube zip y recibe el mp4. Todo cómputo (render, TTS, música) va a nube:
  1. Colab T4 (ya probado) — `scripts/colab-film.ipynb`
  2. Kaggle (30 h/semana GPU gratis) — `scripts/kaggle-film.ipynb` (generado con json.dump)
  3. GitHub Actions (2000 min/mes gratis, sin GPU) — `.github/workflows/render.yml` + `scripts/push-a-nube.ps1`
- Audio del proyecto usa `staticFile('music.wav')` → funciona en local, Colab, Kaggle y Actions sin servidor local.
- Alivio local: `scripts/aliviar-pc.ps1` (limpia temporales, reporta RAM, no mata procesos).

## 4. Proactividad — proponer mejoras
- Si hay algo que puede ser mejor, proponerlo y documentarlo.
- No esperar a que se pida; sugerir y, si es gratuito, implementar.

## 5. Autonomía con aprobación previa + minimizar acciones manuales
- Hacer pasos disponibles sin esperar instrucciones, siempre con aprobación previa antes de acciones irreversibles.
- Minimizar acciones manuales del usuario (automatización, scripts).

## 6. Verificación previa obligatoria (sandbox / simulación)
- Siempre confirmar con sandbox / simulación que todo funciona antes de entregar.
- No entregar sin verificar archivo, duración, audio, post, etc.
- Minimizar cualquier posibilidad de error (revisar rutas, JSON, dependencias).

## 7. Registro perpetuo (OBLIGATORIO)
- Cada pensamiento, decisión, avance, error y verificación queda registrado en
  `BITACORA_VIVA.md` con fecha y tipo (decision/avance/error/verificacion).
- Helper: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\registrar.ps1 -Tipo avance -Mensaje "..."`
- Registrar ANTES de terminar cada turno, incluso si el turno es corto.
- Propósito: que cualquier modelo/sesión futura retome sin perder el hilo ni repetir trabajo.

## 8. LLM siempre activo (rotación de modelos gratuitos)
- Si el modelo actual llega a su límite de cuota, rotar con `/models` a otro modelo
  gratuito (lista en `scripts/GUIA_LLMS.md`: deepseek-v4.1-flash-free, glm-5.3-flash-free,
  flint-40b-free, beam-free, nemotron-3.5-super-vl-free, mimo-v2.6-flash-free).
- Ollama local (gemma4:12b/26b) SOLO como último recurso sin internet: 8 GB de RAM no
  sostienen esos tamaños sin swap letal (medido 2026-10-30).
- La configuración `opencode.json` (raíz del proyecto) carga REGLAS + BITACORAs como
  `instructions` en toda sesión: cualquier modelo arranca con el contexto completo.

## 9. Modo máximo (petición explícita del usuario 2026-10-30)
- El usuario pide: hacer MÁS, leer MÁS, ver MÁS, usar la PC para potenciarnos, "casi sin límites".
- Permiso amplio para: leer/inspeccionar/medir cualquier cosa (archivos, procesos, versiones,
  hardware, red), instalar herramientas GRATUITAS, actualizar software, escribir/editar
  código y docs, ejecutar scripts de desarrollo y verificación — SIN pedir permiso previo.
- Aprobación previa se pide SOLO para: borrados de datos del usuario, `git push`/publicación,
  acciones destructivas/irreversibles, y todo lo que cueste dinero (nada de esto debería
  existir: regla 1 = gratis).
- Proactividad máxima: diagnósticos, mejoras y propuestas sin esperar a que se pida.

## Flujo obligatorio (nube gratuita PRIMERO, PC local SOLO como fallback)
- Todo render debe intentar Colab (GPU T4) antes de usar PC local.
- PC local solo si Colab falla o para desarrollo rápido.
- No saltar sin confirmación.

---
Nota: Regla 6 agregada con aprobación previa tras verificación de errores previos (JSON Colab, rutas, audio). Todo verificado con sandbox antes de entrega final.
Actualizado: 2026-10-29
Autor: protocolo del proyecto fractal-film (REGLAS.md)
