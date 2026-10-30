/**
 * Línea de tiempo de la película: 45 s @ 30 fps = 1350 frames.
 *
 * 4 mundos fractales con ventanas de morphing (mezcla de DEs) y
 * una cámara en spline Catmull-Rom con keyframes por segmento.
 */

export const FPS = 30;
export const TOTAL = 1350;

/** Ventanas de morphing: durante [start,end) el shader mezcla mundos. */
export const MORPHS: {start: number; end: number}[] = [
  {start: 300, end: 360}, // mundo 0 → 1
  {start: 630, end: 690}, // mundo 1 → 2
  {start: 960, end: 1020}, // mundo 2 → 3
];

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Índice de mundo continuo (fraccional = morphing hacia el siguiente). */
export const worldAt = (frame: number): number => {
  let w = 0;
  for (const m of MORPHS) {
    if (frame >= m.end) {
      w += 1;
    } else if (frame > m.start) {
      w += smooth((frame - m.start) / (m.end - m.start));
      break;
    } else {
      break;
    }
  }
  return w;
};

type Vec3 = [number, number, number];

export type CamKey = {
  f: number;
  pos: Vec3;
  tgt: Vec3;
  fov: number; // grados
};

/**
 * Keyframes de cámara.
 * W0 mandelbulb: órbita → inmersión
 * W1 corredor KIFS: vuelo interior
 * W2 monolitos: dolly lateral entre torres
 * W3 mar/agujas: retroceso + ascenso (plano general final)
 */
export const CAM_KEYS: CamKey[] = [
  // ——— MUNDO 0 ———
  {f: 0, pos: [2.7, 0.9, 2.7], tgt: [0, 0, 0], fov: 50},
  {f: 160, pos: [0.2, 1.5, 3.4], tgt: [0, 0, 0], fov: 47},
  {f: 300, pos: [-2.3, 0.4, 2.2], tgt: [0, 0, 0], fov: 45},
  // ——— morph 0→1 (inmersión al centro) ———
  {f: 360, pos: [-1.5, 0.15, 1.0], tgt: [0.8, 0.1, 0.2], fov: 62},
  // ——— MUNDO 1 ———
  {f: 500, pos: [-0.3, -0.2, 0.5], tgt: [1.8, 0.2, -0.7], fov: 66},
  {f: 630, pos: [1.2, 0.3, -0.5], tgt: [3.2, 0.0, -1.7], fov: 62},
  // ——— morph 1→2 ———
  {f: 690, pos: [1.9, -0.6, -13.0], tgt: [1.9, 0.3, -2.0], fov: 58},
  // ——— MUNDO 2 ———
  {f: 830, pos: [1.9, -0.5, -6.0], tgt: [1.9, 0.35, 5.0], fov: 56},
  {f: 960, pos: [1.9, -0.35, 1.5], tgt: [1.9, 0.5, 12.5], fov: 54},
  // ——— morph 2→3 ———
  {f: 1020, pos: [0.0, 0.5, 7.2], tgt: [0, 1.6, 0], fov: 58},
  // ——— MUNDO 3 ———
  {f: 1190, pos: [2.2, 1.9, 9.6], tgt: [0, 2.1, 0], fov: 50},
  {f: 1350, pos: [4.2, 3.8, 12.8], tgt: [0, 2.7, 0], fov: 44},
];

const cr = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
};

const sampleVec = (get: (k: CamKey) => Vec3, frame: number): Vec3 => {
  const keys = CAM_KEYS;
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].f) i++;
  const k1 = keys[i];
  const k2 = keys[i + 1];
  const k0 = keys[Math.max(0, i - 1)];
  const k3 = keys[Math.min(keys.length - 1, i + 2)];
  const t = Math.min(1, Math.max(0, (frame - k1.f) / Math.max(1, k2.f - k1.f)));
  const a = get(k0);
  const b = get(k1);
  const c = get(k2);
  const d = get(k3);
  return [cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t), cr(a[2], b[2], c[2], d[2], t)];
};

export type Camera = {pos: Vec3; tgt: Vec3; fov: number};

export const cameraAt = (frame: number): Camera => {
  const fovs = sampleVec((k) => [k.fov, 0, 0], frame);
  return {
    pos: sampleVec((k) => k.pos, frame),
    tgt: sampleVec((k) => k.tgt, frame),
    fov: fovs[0],
  };
};
