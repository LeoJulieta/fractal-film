import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {GL, Pass, createGL} from '../lib/gl';

/**
 * Lienzo WebGL2 determinista para Remotion.
 *
 * - `setup(gl)` se ejecuta una vez (compila shaders, crea FBOs) y devuelve
 *   la función `draw(frame)` que se llama síncronamente en cada frame
 *   ANTES del paint (useLayoutEffect), garantizando que el screenshot vea
 *   el frame correcto.
 * - Cada frame crea un delayRender que se resuelve tras dibujar.
 */
export type GlScene = {
  setup: (gl: GL) => (frame: number) => void;
};

export const GLCanvas: React.FC<{
  scene: GlScene;
  /** Escala de resolución interna (1 = resolución completa del video). */
  scale?: number;
}> = ({scene, scale = 1}) => {
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<((frame: number) => void) | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const handle = useMemo(() => delayRender(`gl-frame-${frame}`), [frame]);

  useLayoutEffect(() => {
    if (!ctxRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas no montado');
      }
      const gl = createGL(canvas);
      ctxRef.current = sceneRef.current.setup(gl);
    }
    ctxRef.current(frame);
    continueRender(handle);
  }, [frame, handle]);

  return (
    <canvas
      ref={canvasRef}
      width={Math.round(width * scale)}
      height={Math.round(height * scale)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};

export type {Pass};
