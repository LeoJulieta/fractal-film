import time, os, soundfile as sf
from kokoro import KPipeline

os.makedirs('out/audio', exist_ok=True)
pipe = KPipeline(lang_code='e')  # 'e' = español

t0 = time.time()
text = "Toda forma nace de una sola ecuación."
gen = pipe(text, voice='em_alex', speed=0.95)
chunks = []
for i, (gs, ps, audio) in enumerate(gen):
    chunks.append(audio)
    print(f"  chunk {i}: samples={len(audio)}")
import numpy as np
audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
sf.write('out/audio/test_es.wav', audio, 24000)
dt = time.time() - t0
dur = len(audio) / 24000
print(f"OK  texto={len(text)} chars  audio={dur:.2f}s  gen_time={dt:.2f}s  speed={dur/dt:.2f}x realtime")
