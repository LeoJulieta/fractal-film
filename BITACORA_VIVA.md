# BITÁCORA VIVA — registro perpetuo del proyecto
> Regla de oro (REGLAS.md): TODO pensamiento, decisión, avance y error queda registrado
> aquí con fecha. Leer al iniciar cualquier sesión para retomar sin perder el hilo.
> Formato: `- [fecha hora] [tipo] mensaje` — tipos: decision, avance, error, verificacion.

## 2026-10-30 — Sesión "potenciar PC + nube + registro perpetuo"

- [2026-10-30 00:00] [decision] El usuario pide 3 frentes: (A) registro perpetuo de todo,
  (B) agente SIEMPRE activo con LLM gratuito (FreeLLMAPI/otro), (C) guía paso a paso para
  activar Kaggle y GitHub Actions.
- [2026-10-30 00:01] [verificacion] PC medida en vivo: i5-14400F 10C/16T (OK), RAM 7.84 GB
  (cuello de botella), GPU 210 WARP (nunca render local), disco C: 95 GB libres.
- [2026-10-30 00:02] [avance] `src/Main.tsx` migrado de `http://localhost:8888/music.wav`
  a `staticFile('music.wav')` → audio funciona en local + Colab + Kaggle + Actions sin
  servidor local. Typecheck OK.
- [2026-10-30 00:03] [avance] `scripts/kaggle-film.ipynb` generado con `build-kaggle-nb.py`
  (json.dump, BITACORA regla 3). 8 celdas, GPU declarada, paths /kaggle/working.
- [2026-10-30 00:04] [avance] `.github/workflows/render.yml` creado (6 pasos, triggers
  push+manual, artifact 30 días) + `push-a-nube.ps1` + `.gitignore`.
- [2026-10-30 00:05] [error] YAML rompió `yaml.safe_load` por un `: ` dentro de un scalar
  plano (línea run con echo "...: ..."). Corregido con comillas. Lección: validar YAML siempre.
- [2026-10-30 00:06] [avance] `scripts/aliviar-pc.ps1` ejecutado: liberó 1279.2 MB de
  temporales; RAM quedó 4.1 GB libre. No mató procesos (por diseño).
- [2026-10-30 00:07] [error] `sandbox-check.mjs` fallaba en Windows: `new URL().pathname`
  encodea espacios como %20 en rutas ("Proyecto predeterminado"). Corregido con
  `fileURLToPath`. Re-ejecutado: CONFIRMADO film.mp4 1.94 MB. Mismo bug ya visto en
  render-auto.mjs — regla: NUNCA usar new URL().pathname en Windows, usar fileURLToPath.
- [2026-10-30 00:08] [error] `.ps1` no ejecuta directo: ExecutionPolicy deshabilitada en
  este Windows. Solución: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <script>`.
- [2026-10-30 00:09] [decision] FreeLLMAPI resultó ser **Ollama** instalado localmente
  (puerto 11434) con gemma4:12b (8 GB) y gemma4:26b (18 GB). Análisis honesto: en una PC
  de 8 GB RAM esos modelos NO son viables (swap letal). Ollama queda como último recurso
  extremo (solo sin internet), no como plan principal.
- [2026-10-30 00:10] [avance] Medido vía API de OpenCode: 6 modelos GRATIS en nube
  (provider opencode): mimo-v2.6-flash-free, deepseek-v4.1-flash-free, glm-5.3-flash-free,
  flint-40b-free, nemotron-3.5-super-vl-free, beam-free. Rotación entre ellos = agente
  siempre activo sin cargar la PC. Documentado en scripts/GUIA_LLMS.md.
- [2026-10-30 00:11] [decision] Creado este registro perpetuo (BITACORA_VIVA.md) +
  helper `scripts/registrar.ps1` + config `opencode.json` con `instructions` para que TODO
  modelo/sesión cargue automáticamente REGLAS + BITACORAs (soluciona "perder el hilo" al
  cambiar de modelo).
- [2026-10-30 10:37] [verificacion] opencode.json validado (JSON OK, 3 instructions EXISTEN); instrucciones ya cargadas automaticamente en sesion viva. Config efectiva.
- [2026-10-30 10:38] [avance] GUIA_NUBE.md creada (Kaggle + Actions paso a paso). Corregido detalle del zip: src/index.ts vive en src/, no en raiz. Toda la Unit C entregada.
- [2026-10-30 10:38] [decision] Unidades A (registro perpetuo) y B (LLM siempre activo: 6 modelos gratis nube + Ollama ultimo recurso) completadas y verificadas.
- [2026-10-30 10:49] [decision] REGLAS.md regla 9 'Modo-maximo' agregada por peticion del usuario: inspeccion/lectura/instalacion gratis/edicion sin pedir permiso; aprobacion SOLO para borrados, push, destructivo o pago.
- [2026-10-30 10:49] [verificacion] Barrida PC completa: Git NO instalado (bloquea Ruta B GitHub). Node v24.22.1 (ultima LTS; winget ofrece 26), npm 11.19.1, winget v1.29.380, Kokoro 0.9.4, Remotion 4.0.539 = ULTIMA version ya instalada. 18 actualizaciones winget disponibles (GitHub CLI, Ollama, Node, opencode...). RAM libre 3.87 GB, disco 96.1 GB.
- [2026-10-30 10:54] [avance] Git 2.56 instalado (winget). GH CLI YA autenticado como LeoJulieta. Repo local listo: init + config (LeoJulieta@users.noreply.github.com) + commit e9a7d86, 44 archivos 7.8MB, node_modules/out excluidos. FALTA aprobacion: gh repo create + git push (publicacion).
- [2026-10-30 11:12] [verificacion] Repo publico creado: https://github.com/LeoJulieta/fractal-film. Push RECHAZADO: token gh sin scope 'workflow' (no puede subir .github/workflows/). gh auth refresh -s workflow corriendo en background esperando autorizacion del usuario en github.com/login/device (codigo en su portapapeles).
- [2026-10-30 11:12] [decision] REGLAS.md regla 10 'Autonomia creciente' agregada: depender menos del usuario, agrupar aprobaciones en 1 clic por sesion, dejar siguiente paso preparado.
