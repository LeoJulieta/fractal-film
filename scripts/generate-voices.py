"""
Genera las 4 frases de la narración con Kokoro TTS (español).
Voces: em_alex (A, masc) / ef_dora (B, fem). Salida 24 kHz mono WAV por frase.

Uso (workdir = fractal-film):
  .\\.venv-kokoro\\Scripts\\python.exe scripts\\generate-voices.py
"""
import os
import time
import numpy as np
import soundfile as sf
from kokoro import KPipeline

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "out", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

# (archivo, voz kokoro, velocidad, texto)  — guion de PROGRESO.md
LINES = [
    ("voice1_a.wav", "em_alex", 0.92, "Toda forma nace de una sola ecuación."),
    ("voice2_b.wav", "ef_dora", 0.95, "Pliega, repite, escala — y el abismo toma cuerpo."),
    ("voice3_a.wav", "em_alex", 0.92, "Cada frontera esconde la misma infinitud."),
    ("voice4_b.wav", "ef_dora", 0.95, "No dibujamos el infinito: lo dejamos calcular."),
]


def synth(pipe, text, voice, speed):
    """Sintetiza y concatena chunks; normaliza a pico ~0.9 para headroom de mezcla."""
    parts = [a for (_, _, a) in pipe(text, voice=voice, speed=speed)]
    audio = np.concatenate(parts) if len(parts) > 1 else parts[0]
    if hasattr(audio, "numpy"):  # torch.Tensor -> numpy
        audio = audio.numpy()
    audio = np.asarray(audio, dtype=np.float32)
    peak = float(np.abs(audio).max()) or 1.0
    audio = audio / peak * 0.89
    return audio


def main():
    pipe = KPipeline(lang_code="e")  # 'e' = español
    total = 0.0
    for fname, voice, speed, text in LINES:
        t0 = time.time()
        audio = synth(pipe, text, voice, speed)
        dur = len(audio) / 24000
        sf.write(os.path.join(OUT_DIR, fname), audio, 24000)
        total += dur
        print(f"  {fname}  [{voice}] {dur:5.2f}s  ({time.time()-t0:.1f}s gen)  {text!r}")
    print(f"OK 4 frases, {total:.1f}s de habla total -> {OUT_DIR}")


if __name__ == "__main__":
    main()
