/**
 * Passes de post-procesado de la película (Fase 2).
 *
 * Cadena: scene(lineal) → bright(umbral) → blurH → blurV →
 *         composite(aberración+bloom+ACES+contraste+viñeta) → FXAA+grano → pantalla.
 * Salida de scene LINEAL; composite hace tonemap y deja LDR (sRGB) para FXAA.
 */

/** Extrae brillos por encima de umbral + downsample (4-tap) a media/cuarta res. */
export const BRIGHT_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uSceneRes;  // resolución de la textura de escena
uniform vec2 uOutRes;    // res del target de bloom
uniform float uThresh;
uniform float uKnee;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uOutRes;
  vec2 texel = 1.0 / uSceneRes;
  // downsample suave con 4 taps (reduce aliasing al reducir)
  vec3 c = texture(uScene, uv + texel * vec2(-0.5, -0.5)).rgb;
  c += texture(uScene, uv + texel * vec2( 0.5, -0.5)).rgb;
  c += texture(uScene, uv + texel * vec2(-0.5,  0.5)).rgb;
  c += texture(uScene, uv + texel * vec2( 0.5,  0.5)).rgb;
  c *= 0.25;
  // umbral suave (soft threshold) por luminancia
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float soft = clamp(lum - uThresh + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-5);
  float w = max(soft, lum - uThresh) / max(lum, 1e-5);
  outColor = vec4(c * w, 1.0);
}`;

/** Gaussiana separable 9 taps (una dirección por llamada). */
export const BLUR_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;    // res del target (donde dibujamos)
uniform vec2 uStep;   // paso en UV (ej: (2/w,0) ó (0,2/h))
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float w[5];
  w[0] = 0.227027; w[1] = 0.1945946; w[2] = 0.1216216; w[3] = 0.054054; w[4] = 0.016216;
  vec3 c = texture(uTex, uv).rgb * w[0];
  for (int i = 1; i < 5; i++) {
    vec2 o = uStep * float(i);
    c += texture(uTex, uv + o).rgb * w[i];
    c += texture(uTex, uv - o).rgb * w[i];
  }
  outColor = vec4(c, 1.0);
}`;

/** Composite: aberración cromática + bloom + exposición + ACES + contraste/saturación + viñeta. */
export const COMPOSITE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uRes;
uniform float uTime;
uniform float uExposure;
uniform float uAberration;  // fuerza de aberración radial
uniform float uBloomAmt;
uniform float uContrast;    // alrededor de 0.5 (espacio display)
uniform float uSaturation;
out vec4 outColor;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);

  // aberración cromática radial: R hacia afuera, B hacia adentro
  vec2 off = c * (uAberration * (0.4 + r2 * 2.2));
  vec3 col;
  col.r = texture(uScene, uv + off).r;
  col.g = texture(uScene, uv).g;
  col.b = texture(uScene, uv - off).b;

  // bloom (lineal) sumado antes del tonemap
  col += texture(uBloom, uv).rgb * uBloomAmt;

  // exposición + tonemap
  col = aces(col * uExposure);

  // gamma a display
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));

  // contraste (pivot 0.5) + saturación — en espacio display
  col = (col - 0.5) * uContrast + 0.5;
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, uSaturation);

  // viñeta suave
  float vig = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
  col *= 0.45 + 0.55 * pow(vig, 0.22);

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/** FXAA (versión consola, 3.11) + grano de película DESPUÉS. */
export const FXAA_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uGrano;
out vec4 outColor;

vec3 fxaa(vec2 uv, vec2 rcp) {
  vec3 rgbNW = texture(uTex, uv + vec2(-1.0, -1.0) * rcp).rgb;
  vec3 rgbNE = texture(uTex, uv + vec2( 1.0, -1.0) * rcp).rgb;
  vec3 rgbSW = texture(uTex, uv + vec2(-1.0,  1.0) * rcp).rgb;
  vec3 rgbSE = texture(uTex, uv + vec2( 1.0,  1.0) * rcp).rgb;
  vec3 rgbM  = texture(uTex, uv).rgb;
  const vec3 LUMA = vec3(0.299, 0.587, 0.114);
  float lNW = dot(rgbNW, LUMA), lNE = dot(rgbNE, LUMA);
  float lSW = dot(rgbSW, LUMA), lSE = dot(rgbSE, LUMA);
  float lM  = dot(rgbM,  LUMA);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));

  vec2 dir;
  dir.x = -((lNW + lNE) - (lSW + lSE));
  dir.y =  ((lNW + lSW) - (lNE + lSE));
  float dirReduce = max((lNW + lNE + lSW + lSE) * 0.25 * 0.125, 0.0078125);
  float rcpMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = clamp(dir * rcpMin, vec2(-8.0), vec2(8.0)) * rcp;

  vec3 rgbA = 0.5 * (texture(uTex, uv + dir * (1.0 / 3.0 - 0.5)).rgb +
                     texture(uTex, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(uTex, uv + dir * -0.5).rgb +
                                   texture(uTex, uv + dir *  0.5).rgb);
  float lB = dot(rgbB, LUMA);
  return (lB < lMin || lB > lMax) ? rgbA : rgbB;
}

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = fxaa(uv, 1.0 / uRes);
  // grano de película (fino, ligeramente animado por frame)
  float g = hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5;
  col += g * uGrano;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
