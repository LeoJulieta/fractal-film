/**
 * Sandbox / verificación previa: confirma que el archivo entregado existe
 * antes de intentar cualquier render. No inventa; solo mide.
 * Requiere aprobacion previa para ejecutar render real.
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// fileURLToPath: en Windows, new URL().pathname encodea espacios (%20) y falla
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out', 'film.mp4');

console.log('[SANDBOX] Verificando archivo entregado con aprobacion previa...');
if (fs.existsSync(file)) {
  const sz = fs.statSync(file).size;
  console.log('[SANDBOX] CONFIRMADO: out/film.mp4 existe, ' + (sz / 1024 / 1024).toFixed(2) + ' MB');
  console.log('[SANDBOX] Estado: lista para usar como referencia; Colab (T4) es el paso siguiente si se requiere aceleracion.');
} else {
  console.log('[SANDBOX] ALERTA: out/film.mp4 no encontrado. No se avanza sin confirmacion.');
  process.exit(1);
}
