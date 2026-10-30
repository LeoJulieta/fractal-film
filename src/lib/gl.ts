export type GL = WebGL2RenderingContext;

/** Vértices de un triángulo a pantalla completa. */
const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export type Target = {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
};

const compile = (gl: GL, type: number, src: string): WebGLShader => {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('No se pudo crear el shader');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? 'sin log';
    const numbered = src
      .split('\n')
      .map((l, i) => `${i + 1}: ${l}`)
      .join('\n');
    throw new Error(`Error de compilación GLSL:\n${log}\n${numbered}`);
  }
  return sh;
};

/**
 * Programa WebGL2 con caché de uniform locations.
 * Maneja el ciclo completo: compile → use → set uniforms → draw to target.
 */
export class Pass {
  private prog: WebGLProgram;
  private locs = new Map<string, WebGLUniformLocation | null>();
  private gl: GL;

  constructor(gl: GL, fragSrc: string, vertSrc = VERT) {
    this.gl = gl;
    const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    if (!prog) throw new Error('No se pudo crear el programa');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Error de link: ${gl.getProgramInfoLog(prog) ?? ''}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.prog = prog;
    // triángulo a pantalla completa
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  private loc(name: string): WebGLUniformLocation | null {
    let l = this.locs.get(name);
    if (l === undefined) {
      l = this.gl.getUniformLocation(this.prog, name);
      this.locs.set(name, l);
    }
    return l;
  }

  use(): void {
    this.gl.useProgram(this.prog);
  }

  f(name: string, x: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform1f(l, x);
  }

  v2(name: string, x: number, y: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform2f(l, x, y);
  }

  v3(name: string, x: number, y: number, z: number): void {
    const l = this.loc(name);
    if (l) this.gl.uniform3f(l, x, y, z);
  }

  /** Asigna una textura a la unidad `unit` y la enlaza al uniform `name`. */
  tex(name: string, unit: number, texture: WebGLTexture): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const l = this.loc(name);
    if (l) gl.uniform1i(l, unit);
  }

  /** Dibuja el triángulo completo hacia `target` (null = canvas). */
  draw(target: Target | null): void {
    const gl = this.gl;
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.w, target.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

export const createTarget = (gl: GL, w: number, h: number): Target => {
  const tex = gl.createTexture();
  if (!tex) throw new Error('No se pudo crear la textura');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error('No se pudo crear el FBO');
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {fbo, tex, w, h};
};

export const createGL = (canvas: HTMLCanvasElement): GL => {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: false,
    // Crucial: el screenshot de Remotion debe ver el último frame dibujado
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  if (!gl) {
    throw new Error('WebGL2 no disponible en este navegador/renderer');
  }
  // Diagnóstico: saber si ANGLE usa la GPU real o cae a software
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg
    ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string)
    : (gl.getParameter(gl.RENDERER) as string);
  const vendor = dbg
    ? (gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) as string)
    : (gl.getParameter(gl.VENDOR) as string);
  // eslint-disable-next-line no-console
  console.log(`[GL] vendor=${vendor} renderer=${renderer}`);
  return gl;
};
