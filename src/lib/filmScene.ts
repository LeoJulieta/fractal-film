import {GL, Pass, Target, createTarget} from './gl';
import {SCENE_FRAG} from '../shaders/film';
import {BRIGHT_FRAG, BLUR_FRAG, COMPOSITE_FRAG, FXAA_FRAG} from '../shaders/post';
import {FPS, cameraAt, worldAt} from '../timeline';

type GlScene = {
  setup: (gl: GL) => (frame: number) => void;
};

// escala de resolución del bloom (1/4 → barato y amplio)
const BLOOM_SCALE = 0.25;

/**
 * Cadena de post de la película (Fase 2):
 * scene (FBO lineal) → bright(umbral) → blurH → blurV →
 * composite (aberración + bloom + ACES + contraste/sat + viñeta) → FXAA+grano → pantalla.
 */
export const filmScene: GlScene = {
  setup: (gl: GL) => {
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    const bw = Math.max(2, Math.round(W * BLOOM_SCALE));
    const bh = Math.max(2, Math.round(H * BLOOM_SCALE));

    // targets
    const sceneT: Target = createTarget(gl, W, H);
    const brightT: Target = createTarget(gl, bw, bh);
    const blurHT: Target = createTarget(gl, bw, bh);
    const blurVT: Target = createTarget(gl, bw, bh);
    const ldrT: Target = createTarget(gl, W, H);

    // passes
    const scenePass = new Pass(gl, SCENE_FRAG);
    const brightPass = new Pass(gl, BRIGHT_FRAG);
    const blurPass = new Pass(gl, BLUR_FRAG);
    const compPass = new Pass(gl, COMPOSITE_FRAG);
    const fxaaPass = new Pass(gl, FXAA_FRAG);

    return (frame: number) => {
      const t = frame / FPS;
      const cam = cameraAt(frame);
      const world = worldAt(frame);

      // 1) escena → FBO lineal
      scenePass.use();
      scenePass.v2('uRes', W, H);
      scenePass.f('uTime', t);
      scenePass.v3('uCamPos', cam.pos[0], cam.pos[1], cam.pos[2]);
      scenePass.v3('uCamTgt', cam.tgt[0], cam.tgt[1], cam.tgt[2]);
      scenePass.f('uFov', (cam.fov * Math.PI) / 180);
      scenePass.f('uWorld', world);
      scenePass.draw(sceneT);

      // 2) bright pass → bloom (¼ res)
      brightPass.use();
      brightPass.v2('uSceneRes', W, H);
      brightPass.v2('uOutRes', bw, bh);
      brightPass.f('uThresh', 0.62);
      brightPass.f('uKnee', 0.25);
      brightPass.tex('uScene', 0, sceneT.tex);
      brightPass.draw(brightT);

      // 3) blur H
      blurPass.use();
      blurPass.v2('uRes', bw, bh);
      blurPass.v2('uStep', 1.4 / bw, 0);
      blurPass.tex('uTex', 0, brightT.tex);
      blurPass.draw(blurHT);

      // 4) blur V
      blurPass.use();
      blurPass.v2('uRes', bw, bh);
      blurPass.v2('uStep', 0, 1.4 / bh);
      blurPass.tex('uTex', 0, blurHT.tex);
      blurPass.draw(blurVT);

      // 5) composite → FBO LDR (aberración+bloom+ACES+contraste+viñeta)
      compPass.use();
      compPass.v2('uRes', W, H);
      compPass.f('uTime', t);
      compPass.f('uExposure', 1.15);
      compPass.f('uAberration', 0.011);
      compPass.f('uBloomAmt', 0.85);
      compPass.f('uContrast', 1.14);
      compPass.f('uSaturation', 1.18);
      compPass.tex('uScene', 0, sceneT.tex);
      compPass.tex('uBloom', 1, blurVT.tex);
      compPass.draw(ldrT);

      // 6) FXAA + grano → pantalla
      fxaaPass.use();
      fxaaPass.v2('uRes', W, H);
      fxaaPass.f('uTime', t);
      fxaaPass.f('uGrano', 0.035);
      fxaaPass.tex('uTex', 0, ldrT.tex);
      fxaaPass.draw(null);
    };
  },
};
