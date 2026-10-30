# GUÍA LLMS — agente siempre activo con modelos 100% gratuitos
> Objetivo del usuario: que el agente NUNCA se detenga por límite de cuota, sin pagar nada
> y sin cargar la PC local. Mediciones reales 2026-10-30 (API de OpenCode, nada inventado).

## 1. Rotación de modelos gratis en NUBE (plan principal — 0 USD, 0 carga local)

El provider `opencode` tiene 6 modelos activos GRATIS (verificado con la API de modelos):

| Modelo ID | Nombre | Rol sugerido |
|---|---|---|
| `opencode/mimo-v2.6-flash-free` | MiMo-V2.6-Flash Free | Principal (coding rápido) |
| `opencode/deepseek-v4.1-flash-free` | DeepSeek V4.1 Flash Free | Alternativa 1 (razonamiento) |
| `opencode/glm-5.3-flash-free` | GLM-5.3-Flash Free | Alternativa 2 |
| `opencode/flint-40b-free` | Flint 40B Free | Alternativa 3 |
| `opencode/beam-free` | Beam Free | Alternativa 4 |
| `opencode/nemotron-3.5-super-vl-free` | Nemotron 3.5 Super VL Free | Alternativa 5 (con visión) |

**Protocolo de rotación (si el modelo actual llega a su límite):**
1. No perder el hilo: el contexto vive en disco (`BITACORA_VIVA.md`, `PROGRESO.md`,
   `REGLAS.md`) y se carga solo en toda sesión nueva gracias a `opencode.json`
   (campo `instructions`) — el modelo entrante arranca con las reglas y la bitácora.
2. Ejecutar `/models` en OpenCode y elegir el siguiente de la lista (p. ej. deepseek-v4.1-flash-free).
3. Continuar desde lo que indique `BITACORA_VIVA.md` (última entrada con fecha).
4. Retomar sesiones previas: `/sessions` o `Ctrl+X` luego `L` (recientes).

**Nota honesta:** OpenCode no tiene cambio automático de modelo al agotar cuota (las docs
V2 no definen fallback automático). La rotación es un clic (`/models`) y la continuidad
está garantizada por la bitácora, no por el modelo. Esto cumple el objetivo práctico:
el AGENTE (el proyecto + sus registros + cualquier modelo) sigue evolucionando sin pausa.

## 2. Ollama local — ÚLTIMO RECURSO (solo sin internet)

Medido en esta PC (2026-10-30):
- Instalado: `gemma4:12b` (8 GB) y `gemma4:26b` (18 GB) en puerto 11434.
- RAM total de la PC: 7.84 GB. **gemma4:26b es imposible** (18 GB > RAM total).
  **gemma4:12b saturaría** la RAM y forzaría swap continuo → PC inutilizable.
- Conclusión: NO usar Ollama como plan principal (violaría REGLAS regla 3: aliviar la PC).
  Solo si no hay internet, y esperando lentitud. OpenCode lo detecta solo como
  `ollama/gemma4:12b` si se necesita.

## 3. Configuración ya implementada (no repetir)

- `opencode.json` en la raíz del proyecto (`C:\Users\Usuario\Documents\Proyecto predeterminado\`):
  modelo por defecto `opencode/mimo-v2.6-flash-free` + `instructions` que cargan
  REGLAS.md, BITACORA_CRITICA.md y BITACORA_VIVA.md en TODA sesión (cualquier modelo).
  → Soluciona el problema del usuario de "perder el hilo al cambiar de modelo/cuenta".
- `fractal-film/BITACORA_VIVA.md`: registro perpetuo (regla 7 de REGLAS.md).
- `fractal-film/scripts/registrar.ps1`: helper de registro con fecha automática.
