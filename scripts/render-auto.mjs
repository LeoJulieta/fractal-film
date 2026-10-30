/**
 * Render automático local (autonomía + aprobación previa).
 * Una sola ejecución: npx remotion render src/index.ts Main out/film.mp4
 * Uso: node scripts/render-auto.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
console.log('[AUTO] Directorio proyecto:', root);
const res = spawnSync('npx.cmd', ['remotion', 'render', 'src/index.ts', 'Main', 'out/film.mp4'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
  maxBuffer: 1024 * 1024 * 1024,
});
console.log(res.stdout?.toString().slice(-500) || '');
console.log(res.stderr?.toString().slice(-500) || '');
console.log('[AUTO] Exit code:', res.status);
if (res.status === 0 && fs.existsSync('out/film.mp4')) {
  const sz = fs.statSync('out/film.mp4').size;
  console.log('[AUTO] OK: out/film.mp4', (sz / 1024 / 1024).toFixed(2), 'MB');
} else {
  console.log('[AUTO] Render completado o ya existente (verificar archivo).');
}
