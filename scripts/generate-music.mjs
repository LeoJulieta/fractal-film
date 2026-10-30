/**
 * Score de 45 s para la película fractal — 100% sintetizado, sin samples.
 * Salida: out/audio/music.wav (stereo 44.1 kHz, 16-bit).
 *
 * Capas:
 *  - Drone/sub (fundamental A)贯穿 toda la pieza
 *  - Coro de FORMANTES (aah/ooh) por segmentos, 3-4 notas × 2-3 cantores desafinados
 *  - Impacts (boom sub + transitorio) en los cortes: 11, 21.5, 32.5 s
 *  - Risers (2 s) antes de cada impact
 *  - Swell final hacia la tarjeta (~38-41 s)
 *  - Reverb Schroeder (4 comb + 2 allpass) por send
 *  - Ducking bajo las voces (ventanas conocidas) HORNEADO en la salida
 *
 * Uso (workdir = fractal-film):  node scripts/generate-music.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'out', 'audio', 'music.wav');
const SR = 44100;
const DUR = 45;
const N = SR * DUR;

// ventanas de voz (segundos) — DEBEN coincidir con la colocación en Main.tsx
// [inicio, fin] de cada frase (con margen)
const VOICE_WINDOWS = [
  [3.4, 7.6],
  [12.9, 17.6],
  [23.4, 27.6],
  [34.4, 38.6],
];

// ---------- RNG determinista ----------
let _s = 0x2f6e2b1 >>> 0;
const rnd = () => {
  _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0;
  return _s / 4294967296;
};

// ---------- buffers ----------
const dryL = new Float64Array(N);
const dryR = new Float64Array(N);
const send = new Float64Array(N); // mono → reverb

const t2i = (t) => Math.round(t * SR);

function mixInto(local, startSec, gain, pan /* -1..1 */, sendAmt) {
  const start = t2i(startSec);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < local.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const v = local[i];
    dryL[j] += v * gl;
    dryR[j] += v * gr;
    if (sendAmt > 0) send[j] += v * gain * sendAmt;
  }
}

// ---------- osciladores ----------
// saw ADITIVO limitado (evita aliasing): armónicos hasta maxHz
function sawSample(phase, f0, maxHz) {
  let v = 0;
  let n = 1;
  const lim = Math.min(40, Math.floor(maxHz / f0));
  while (n <= lim) {
    v += Math.sin(2 * Math.PI * phase * n) / n;
    n++;
  }
  return v * (2 / Math.PI);
}

// ---------- formantes (biquad bandpass resonante) ----------
function makeFormantBank(formants, bw, gains) {
  return formants.map((f, k) => {
    const w0 = (2 * Math.PI * f) / SR;
    const Q = f / bw[k];
    const alpha = Math.sin(w0) / (2 * Q);
    const b0 = alpha, b1 = 0, b2 = -alpha;
    const a0 = 1 + alpha, a1 = -2 * Math.cos(w0), a2 = 1 - alpha;
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0, g: gains[k], x1: 0, x2: 0, y1: 0, y2: 0 };
  });
}
function runFormant(bq, x) {
  const y = bq.b0 * x + bq.b1 * bq.x1 + bq.b2 * bq.x2 - bq.a1 * bq.y1 - bq.a2 * bq.y2;
  bq.x2 = bq.x1; bq.x1 = x; bq.y2 = bq.y1; bq.y1 = y;
  return y;
}

// vocales: [F1,F2,F3], bandwidths, gains
const VOW = {
  aah: { f: [730, 1090, 2440], bw: [90, 110, 170], g: [1.0, 0.55, 0.28] },
  ooh: { f: [300, 870, 2240], bw: [60, 90, 120], g: [1.0, 0.5, 0.16] },
  eeh: { f: [530, 1840, 2480], bw: [80, 100, 120], g: [1.0, 0.5, 0.25] },
};

/**
 * Cantor: 1 nota, envolvente con ataque/liberación, vibrato + desafine.
 * Devuelve Float64Array mono.
 */
function singer(f0, dur, vowKey, { detuneCents = 0, vibHz = 5, vibDepth = 0.006, gain = 1, attack = 0.35, release = 0.5, breath = 0.02 } = {}) {
  const n = Math.round(dur * SR);
  const out = new Float64Array(n);
  const vow = VOW[vowKey];
  const bq = makeFormantBank(vow.f, vow.bw, vow.g);
  const f = f0 * Math.pow(2, detuneCents / 1200);
  let ph = rnd();
  let vibPh = rnd();
  const aS = Math.max(1, attack * SR);
  const rS = Math.max(1, release * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    vibPh += (vibHz / SR);
    if (vibPh >= 1) vibPh -= 1;
    const vib = 1 + vibDepth * Math.sin(2 * Math.PI * vibPh);
    const curF = f * vib;
    ph += curF / SR;
    if (ph >= 1) ph -= 1;
    // envolvente ADSR simple
    let env;
    if (i < aS) env = i / aS;
    else if (i > n - rS) env = (n - i) / rS;
    else env = 1;
    env = env * env * (3 - 2 * env); // smoothstep
    // "breath": modulación lenta de amplitud
    env *= 1 - breath + breath * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.7 * t + ph));
    let src = sawSample(ph, curF, 9000);
    src += (rnd() - 0.5) * 0.02; // susurro
    let v = 0;
    for (const bqk of bq) v += runFormant(bqk, src) * bqk.g;
    out[i] = v * env * gain;
  }
  return out;
}

// ---------- coro: acorde = varias notas × cantores ----------
function renderChord({ start, dur, freqs, vow, gain, send: snd = 0.35, spread = 0.5, singersPerNote = 2, atk = 0.6, rel = 1.0 }) {
  for (let ni = 0; ni < freqs.length; ni++) {
    const f0 = freqs[ni];
    for (let s = 0; s < singersPerNote; s++) {
      const det = (s - (singersPerNote - 1) / 2) * (spread * 6) + (rnd() - 0.5) * 4;
      const pan = ((ni / Math.max(1, freqs.length - 1)) * 2 - 1) * 0.6 + (s - 0.5) * 0.2;
      const sig = singer(f0, dur, vow, {
        detuneCents: det,
        vibHz: 4.6 + rnd() * 1.4,
        vibDepth: 0.005 + rnd() * 0.004,
        gain: gain / singersPerNote,
        attack: atk,
        release: rel,
      });
      mixInto(sig, start, 1.0, Math.max(-1, Math.min(1, pan)), snd);
    }
  }
}

// ---------- drone ----------
function renderDrone(start, dur) {
  const n = Math.round(dur * SR);
  const out = new Float64Array(n);
  const f1 = 55, f2 = 110, f3 = 164.81; // A1, A2, E3
  let p1 = 0, p2 = 0, p3 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    p1 += f1 / SR; p2 += f2 / SR; p3 += f3 / SR;
    // amplitud lenta (evolución) + swell general
    const swell = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.045 * t);
    let v = Math.sin(2 * Math.PI * p1) * 0.5;
    v += Math.sin(2 * Math.PI * p2) * 0.22;
    v += Math.sin(2 * Math.PI * p3 + 0.5) * 0.10;
    out[i] = v * swell * 0.5;
  }
  mixInto(out, start, 1.0, 0, 0.12);
}

// ---------- impact (boom sub + transitorio + cola) ----------
function renderImpact(startSec, strength = 1) {
  const dur = 3.2;
  const n = Math.round(dur * SR);
  const out = new Float64Array(n);
  // boom: sine con barrido de frecuencia descendente
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 90 * Math.exp(-t * 3.0) + 34;
    ph += f / SR;
    const env = Math.exp(-t * 2.2);
    out[i] += Math.sin(2 * Math.PI * ph) * env * 0.9;
  }
  // transitorio: ruido filtrado (lowpass simple) decaimiento rápido
  let lp = 0;
  const nzLen = Math.round(0.18 * SR);
  for (let i = 0; i < nzLen && i < n; i++) {
    const t = i / SR;
    const w = (rnd() * 2 - 1);
    lp += (w - lp) * 0.25;
    out[i] += lp * Math.exp(-t * 26) * 0.5;
  }
  // "gong" metálico: pocos parciales inarmónicos con cola media
  const partials = [1, 1.71, 2.43, 3.14, 4.07];
  const base = 130;
  for (const r of partials) {
    let pp = rnd();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      pp += (base * r) / SR;
      out[i] += Math.sin(2 * Math.PI * pp) * Math.exp(-t * 1.3) * 0.06;
    }
  }
  mixInto(out, startSec, strength, 0, 0.5);
}

// ---------- riser (ruido + tono ascendente) ----------
function renderRiser(startSec, dur, strength = 1) {
  const n = Math.round(dur * SR);
  const out = new Float64Array(n);
  let bp = 0, bp2 = 0;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = t / dur; // 0..1
    const env = x * x; // creciente
    // ruido con paso de banda "subiendo" (aproximación 2 polos)
    const w = rnd() * 2 - 1;
    const k = 0.02 + 0.35 * x;
    bp += (w - bp) * k;
    bp2 += (bp - bp2) * k;
    const noise = (bp - bp2) * 3.0;
    // tono ascendente
    const f = 160 * Math.pow(2, x * 2.2);
    ph += f / SR;
    const tone = Math.sin(2 * Math.PI * ph) * 0.25;
    out[i] = (noise * 0.6 + tone) * env * strength;
  }
  mixInto(out, startSec, 1.0, 0, 0.35);
}

// ---------- swell final (riser largo + ruido que culmina) ----------
function renderFinalSwell(startSec, dur) {
  const n = Math.round(dur * SR);
  const out = new Float64Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = t / dur;
    // crece hasta x=0.85 y suave caída
    const env = x < 0.85 ? x / 0.85 : 1 - (x - 0.85) / 0.15;
    const w = rnd() * 2 - 1;
    lp += (w - lp) * (0.06 + 0.2 * x);
    out[i] = lp * env * env * 1.4;
  }
  mixInto(out, startSec, 1.0, 0, 0.5);
}

// ---------- pulso cardíaco tenue (W2, 23-32 s) ----------
function renderPulse(startSec, count, interval) {
  for (let c = 0; c < count; c++) {
    const s = startSec + c * interval;
    const dur = 0.5;
    const n = Math.round(dur * SR);
    const out = new Float64Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = 70 * Math.exp(-t * 8) + 45;
      ph += f / SR;
      out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 9) * 0.5;
    }
    mixInto(out, s, 0.5, c % 2 ? 0.15 : -0.15, 0.15);
  }
}

// ================= ARRANQUE: score =================
// Segmentos de coro (voz, notas en Hz)
const A2 = 110, C3 = 130.81, E3 = 164.81, A3 = 220, C4 = 261.63, E4 = 329.63, F3 = 174.61, A4 = 440, C5 = 523.25, E5 = 659.26, G3 = 196;

renderDrone(0, 45);

// W0 (0-10): aah suave, Am
renderChord({ start: 0.0, dur: 10.5, freqs: [A3, C4, E4], vow: 'aah', gain: 0.16, atk: 1.4, rel: 1.6, singersPerNote: 2 });
// W1 (11-21): ooh, F → tensión creciente
renderChord({ start: 11.0, dur: 6.0, freqs: [F3, A3, C4], vow: 'ooh', gain: 0.15, atk: 1.0, rel: 1.4, singersPerNote: 2 });
renderChord({ start: 17.0, dur: 4.5, freqs: [E3, G3, C4], vow: 'ooh', gain: 0.17, atk: 0.8, rel: 1.2, singersPerNote: 2 });
// W2 (23-32): aah más oscuro, bajos
renderChord({ start: 23.0, dur: 9.5, freqs: [A2, E3, C4], vow: 'aah', gain: 0.17, atk: 1.1, rel: 1.5, singersPerNote: 3 });
// W3 (34-45): clímax aah agudo, hasta tarjeta y resolución
renderChord({ start: 34.0, dur: 8.0, freqs: [A3, E4, A4], vow: 'aah', gain: 0.18, atk: 1.2, rel: 1.0, singersPerNote: 3 });
renderChord({ start: 38.5, dur: 6.0, freqs: [C5, E5], vow: 'aah', gain: 0.10, atk: 1.5, rel: 2.5, singersPerNote: 2 });
renderChord({ start: 41.0, dur: 4.0, freqs: [A3, C4, E4, A4], vow: 'ooh', gain: 0.14, atk: 0.8, rel: 2.8, singersPerNote: 2 });

// impacts en los cortes
renderImpact(11.0, 0.9);
renderImpact(21.5, 1.0);
renderImpact(32.5, 1.05);

// risers antes de cada impact (2 s)
renderRiser(9.0, 2.0, 0.5);
renderRiser(19.5, 2.0, 0.6);
renderRiser(30.5, 2.0, 0.65);

// pulso tenue en W2
renderPulse(23.5, 8, 1.1);

// swell final
renderFinalSwell(37.5, 4.5);

// ================= REVERB Schroeder (4 comb + 2 allpass) =================
function schroeder(input, rt60) {
  const combDelays = [1557, 1617, 1491, 1422];
  const apDelays = [225, 556];
  // comb sum
  const out = new Float64Array(input.length);
  for (const d of combDelays) {
    const g = Math.pow(10, (-3 * d) / (rt60 * SR));
    const buf = new Float64Array(d);
    let idx = 0;
    for (let i = 0; i < input.length; i++) {
      const y = input[i] + g * buf[idx];
      buf[idx] = y;
      idx = (idx + 1) % d;
      out[i] += y * 0.25;
    }
  }
  // allpass
  for (const d of apDelays) {
    const g = 0.5;
    const buf = new Float64Array(d);
    let idx = 0;
    for (let i = 0; i < out.length; i++) {
      const bufOut = buf[idx];
      const y = -g * out[i] + bufOut;
      buf[idx] = out[i] + g * bufOut;
      idx = (idx + 1) % d;
      out[i] = y;
    }
  }
  return out;
}

const wet = schroeder(send, 2.6);
const wetL = new Float64Array(N);
const wetR = new Float64Array(N);
// ligero decorreo estéreo del reverb (delay de 30 ms a un lado)
const d30 = Math.round(0.03 * SR);
for (let i = 0; i < N; i++) {
  wetL[i] = wet[i];
  wetR[i] = i - d30 >= 0 ? wet[i - d30] : 0;
}
const WET = 0.5;
for (let i = 0; i < N; i++) {
  dryL[i] += wetL[i] * WET;
  dryR[i] += wetR[i] * WET;
}

// ================= DUCKING bajo voces =================
// baja la música ~2.6 dB dentro de cada ventana, con ramps suaves
function applyDucking(L, R) {
  const g = 0.55; // factor de atenuación
  const ramp = 0.25 * SR;
  const gainArr = new Float64Array(N).fill(1);
  for (const [a, b] of VOICE_WINDOWS) {
    const ai = t2i(a), bi = t2i(b);
    for (let i = ai; i < bi && i < N; i++) gainArr[i] = Math.min(gainArr[i], g);
    // ramp in
    for (let i = ai; i < ai + ramp && i < N; i++) {
      const x = (i - ai) / ramp;
      gainArr[i] = Math.min(gainArr[i], 1 - (1 - g) * x);
    }
    // ramp out
    for (let i = bi - ramp; i < bi && i < N; i++) {
      if (i < 0) continue;
      const x = (i - (bi - ramp)) / ramp;
      gainArr[i] = Math.min(gainArr[i], g + (1 - g) * x);
    }
  }
  for (let i = 0; i < N; i++) {
    L[i] *= gainArr[i];
    R[i] *= gainArr[i];
  }
}
applyDucking(dryL, dryR);

// ================= soft limit + normalize =================
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(dryL[i]), Math.abs(dryR[i]));
const pre = peak > 0 ? 0.92 / peak : 1;
for (let i = 0; i < N; i++) {
  // soft clip (tanh) suave antes de escalar
  dryL[i] = Math.tanh(dryL[i] * pre * 1.1);
  dryR[i] = Math.tanh(dryR[i] * pre * 1.1);
}

// ================= escribir WAV 16-bit stereo =================
function writeWav(file, L, R, sr) {
  const n = L.length;
  const bytes = n * 2 * 2;
  const buf = Buffer.alloc(44 + bytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + bytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2 * 2, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(bytes, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    let sl = Math.max(-1, Math.min(1, L[i]));
    let sr2 = Math.max(-1, Math.min(1, R[i]));
    buf.writeInt16LE((sl * 32767) | 0, o);
    o += 2;
    buf.writeInt16LE((sr2 * 32767) | 0, o);
    o += 2;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

writeWav(OUT, dryL, dryR, SR);
console.log(`OK music.wav  ${DUR}s  ${SR}Hz stereo  peak_pre=${peak.toFixed(3)}  -> ${OUT}`);
