/**
 * Shader de escena de la película — 4 mundos fractales con morphing.
 * Salida LINEAL (el tonemap/gamma vive en el pass "present").
 *
 * W0: mandelbulb clásico
 * W1: corredor KIFS (fold+rotate+scale, bordes emisivos)
 * W2: monolitos mandelbox sobre suelo reflectante
 * W3: isla de agujas IFS sobre agua reflectante + sol bajo
 */

export const SCENE_FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamTgt;
uniform float uFov;
uniform float uWorld; // 0..4; fraccional = morphing hacia el siguiente

out vec4 outColor;

float gTrap;   // orbit trap del último DE evaluado
float gMat;    // 0 = superficie, 1 = suelo (W2), 2 = agua (W3)
float gGlow;   // acumulado de luz cercana a superficies

const vec3 CYAN = vec3(0.18, 0.92, 0.86);
const vec3 MAGENTA = vec3(1.0, 0.24, 0.55);
const vec3 SUN_DIR = vec3(-0.40, 0.10, -0.90);

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// ============================ MUNDO 0: MANDELBULB ============================
float deBulb(vec3 p) {
  p.xz *= rot(uTime * 0.07);
  p.xy *= rot(0.35);
  vec3 z = p;
  float dr = 1.0;
  float r = length(z);
  float trap = 1e9;
  for (int i = 0; i < 8; i++) {
    if (r > 2.0) break;
    trap = min(trap, r);
    float theta = acos(clamp(z.z / max(r, 1e-6), -1.0, 1.0));
    float phi = atan(z.y, z.x);
    float zr = pow(r, 8.0);
    dr = pow(r, 7.0) * 8.0 * dr + 1.0;
    theta *= 8.0;
    phi *= 8.0;
    z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + p;
    r = length(z);
  }
  gTrap = min(trap, r);
  return 0.5 * log(max(r, 1e-6)) * r / max(dr, 1e-6) * 0.85;
}

// ============================ MUNDO 1: CORREDOR KIFS ============================
float deKifs(vec3 p) {
  float lp = length(p);
  if (lp > 4.0) return lp - 4.0; // bounding sphere: DE exacta lejos del fractal
  vec3 offset = vec3(1.05, 0.90, 0.65);
  float scale = 1.9;
  vec3 q = p;
  float sPow = 1.0;
  float trap = 1e9;
  for (int i = 0; i < 9; i++) {
    q = abs(q);
    if (q.x < q.y) q.xy = q.yx;
    if (q.x < q.z) q.xz = q.zx;
    if (q.y < q.z) q.yz = q.zy;
    q = q * scale - offset * (scale - 1.0);
    q.xz *= rot(0.55);
    sPow *= scale;
    trap = min(trap, length(q));
  }
  gTrap = trap;
  float kifs = (length(q) - 0.35) / sPow * 0.5;
  // Túnel por el que vuela la cámara: fractal MENOS cilindro (unión de sólidos)
  vec3 w = p - vec3(-1.5, 0.15, 1.0);
  vec3 axis = vec3(0.8732, 0.0485, -0.4851);
  float rad = length(w - dot(w, axis) * axis);
  return max(kifs, 0.65 - rad);
}

// ============================ MUNDO 2: CAMPO DE COLUMNAS MENGER ============================
// Esponja de Menger (fractal de cajas con huecos = arquitectura imposible),
// repetida en rejilla para formar una columnata infinita sobre suelo reflectante.
float deMenger(vec3 p) {
  float s = 1.0;
  float d = -1e5;
  for (int i = 0; i < 4; i++) {
    vec3 a = mod(p * s, 2.0) - 1.0;
    s *= 3.0;
    vec3 r = abs(1.0 - 3.0 * abs(a));
    float c = (min(max(r.x, r.y), min(max(r.y, r.z), max(r.z, r.x))) - 1.0) / s;
    d = max(d, c);
  }
  return d;
}

float hash21(vec2 id) {
  return fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
}

float deMonoliths(vec3 p) {
  float floorD = p.y + 1.6;
  float cell = 3.8;
  vec2 id = floor(p.xz / cell + 0.5);
  vec3 q = p;
  q.xz -= id * cell;
  float h = hash21(id);
  float yScale = 0.30 + h * 0.30;       // esbeltez/alto variable por celda
  vec3 cq = vec3(q.x * 2.0, p.y * yScale, q.z * 2.0);
  float col = deMenger(cq) / 2.0;
  gTrap = clamp(h, 0.0, 1.0);
  gMat = floorD < col ? 1.0 : 0.0;
  return min(col, floorD);
}

// ============================ MUNDO 3: AGUJAS SOBRE AGUA ============================
float deSea(vec3 p) {
  vec3 pr = p;
  pr.xz *= rot(uTime * 0.02);
  float water = p.y + 1.0;
  vec3 offset = vec3(1.15, 0.55, 1.15);
  float scale = 2.0;
  vec3 q = pr * 0.75;
  float sPow = 1.0;
  float trap = 1e9;
  for (int i = 0; i < 8; i++) {
    q = abs(q);
    if (q.x < q.y) q.xy = q.yx;
    if (q.x < q.z) q.xz = q.zx;
    if (q.y < q.z) q.yz = q.zy;
    q = q * scale - offset * (scale - 1.0);
    sPow *= scale;
    trap = min(trap, length(q));
  }
  float spire = (length(q) - 0.30) / sPow * 0.5;
  float clipped = max(spire, -1.0 - p.y);
  gTrap = trap;
  if (water < clipped) {
    gMat = 2.0;
    return water;
  }
  gMat = 0.0;
  return clipped;
}

// ============================ MAP CON MORPHING ============================
float worldDE(vec3 p, float w) {
  if (w < 0.5) return deBulb(p);
  if (w < 1.5) return deKifs(p);
  if (w < 2.5) return deMonoliths(p);
  return deSea(p);
}

float map(vec3 p) {
  gMat = 0.0;
  float w = uWorld;
  float fw = floor(w);
  float f = w - fw;
  if (f < 0.001) return worldDE(p, fw);
  if (f > 0.999) return worldDE(p, fw + 1.0);
  float d0 = worldDE(p, fw);
  float d1 = worldDE(p, fw + 1.0);
  return mix(d0, d1, f * f * (3.0 - 2.0 * f));
}

vec3 normalAt(vec3 p, float e) {
  vec2 h = vec2(e, -e);
  return normalize(
    h.xyy * map(p + h.xyy) + h.yyx * map(p + h.yyx) +
    h.yxy * map(p + h.yxy) + h.xxx * map(p + h.xxx));
}

// ============================ MARCHA ============================
vec2 march(vec3 ro, vec3 rd, float maxT, int maxSteps) {
  float t = 0.02;
  for (int i = 0; i < maxSteps; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    gGlow += 0.006 / (1.0 + d * d * 140.0);
    if (d < 0.0013 * max(t, 1.0)) return vec2(t, 1.0);
    t += max(d * 0.85, 0.0015);
    if (t > maxT) break;
  }
  return vec2(t, 0.0);
}

// ============================ CIELO ============================
vec3 sky(vec3 rd, float wDom) {
  float h = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
  if (wDom < 0.5) {
    return mix(vec3(0.006, 0.010, 0.022), vec3(0.020, 0.034, 0.058), h);
  }
  if (wDom < 1.5) {
    return mix(vec3(0.004, 0.006, 0.012), vec3(0.012, 0.018, 0.030), h);
  }
  if (wDom < 2.5) {
    // cielo de atardecer con sol bajo entre las columnas
    float sd = max(dot(rd, SUN_DIR), 0.0);
    vec3 c = mix(vec3(0.11, 0.040, 0.055), vec3(0.014, 0.022, 0.048),
                 smoothstep(-0.05, 0.45, rd.y));
    c += vec3(1.0, 0.52, 0.28) * (pow(sd, 300.0) * 6.0 + pow(sd, 18.0) * 0.55);
    return c;
  }
  float sd = max(dot(rd, SUN_DIR), 0.0);
  vec3 c = mix(vec3(0.14, 0.045, 0.055), vec3(0.012, 0.026, 0.060),
               smoothstep(0.0, 0.55, rd.y));
  c += vec3(1.0, 0.55, 0.30) *
       (pow(sd, 900.0) * 14.0 + pow(sd, 40.0) * 0.85 + pow(sd, 6.0) * 0.20);
  return c;
}

// ============================ SOMBREADO BASE ============================
vec3 baseShade(vec3 p, vec3 n, vec3 rd, float trap, float mat, float wDom) {
  vec3 keyDir = normalize(vec3(0.55, 0.70, 0.35));
  vec3 fillDir = normalize(vec3(-0.60, -0.15, -0.50));
  float key = max(dot(n, keyDir), 0.0);
  float fill = max(dot(n, fillDir), 0.0);
  float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
  vec3 col;

  if (wDom < 0.5) {
    // W0 — bulb: albedo por órbita trap
    vec3 albedo = mix(CYAN, MAGENTA, smoothstep(0.35, 1.4, trap));
    col = albedo * (key * 1.10 + 0.10);
    col += CYAN * fill * 0.16;
    col += mix(CYAN, vec3(1.0), 0.4) * rim * 0.80;
    col += albedo * smoothstep(0.9, 0.2, trap) * 0.20;
  } else if (wDom < 1.5) {
    // W1 — corredor: metal oscuro + bordes de órbita emisivos
    // edge concentrado en bordes reales (trap pequeño) para no teñir toda la pared
    float edge = exp(-trap * 6.0);
    vec3 edgeCol = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + trap * 3.0);
    edgeCol = mix(edgeCol, vec3(1.0), 0.45); // desatura hacia blanco cálido
    col = vec3(0.045, 0.055, 0.075) * (key * 0.85 + 0.18);
    col += edgeCol * edge * 0.70;
    col += CYAN * rim * rim * 0.22;
    col += MAGENTA * fill * 0.06;
  } else if (wDom < 2.5) {
    if (mat > 0.5) {
      // suelo espejo (la reflexión se aplica en shade())
      col = vec3(0.020, 0.022, 0.035) * (key * 0.30 + 0.30);
      col += CYAN * rim * 0.08;
    } else {
      // columna de piedra: tinte coherente (función suave de la posición)
      // + variación sutil por celda (trap = hash) solo en el albedo
      float band = 0.5 + 0.5 * sin(p.y * 1.7 + 0.6);
      vec3 albedo = mix(vec3(0.10, 0.11, 0.15), vec3(0.17, 0.15, 0.19), band);
      albedo *= 0.90 + 0.20 * trap; // leve distinción por celda, sin salto de color
      col = albedo * (key * 1.05 + 0.04);
      // relleno frío desde el lado opuesto al sol
      col += vec3(0.30, 0.45, 0.60) * fill * 0.24;
      // luz de recorte cálida (solo en bordes realmente de contraluz, no en toda cara rasante)
      col += vec3(1.0, 0.60, 0.36) * rim * rim * 0.55;
    }
  } else {
    if (mat > 1.5) {
      // agua (la reflexión se aplica en shade())
      col = vec3(0.010, 0.018, 0.028) * (key * 0.3 + 0.4);
    } else {
      vec3 albedo = mix(vec3(0.10, 0.13, 0.16), vec3(0.35, 0.22, 0.30),
                        smoothstep(0.4, 1.8, trap));
      col = albedo * (key * 0.55 + 0.06);
      // contraluz del sol bajo
      float back = pow(max(dot(n, SUN_DIR), 0.0), 2.0);
      col += vec3(1.0, 0.45, 0.28) * back * 0.55;
      col += CYAN * rim * 0.30;
    }
  }
  return col;
}

// ============================ SOMBREADO CON REFLEXIÓN ============================
vec3 shade(vec3 p, vec3 n, vec3 rd, float wDom) {
  map(p);
  float trap = gTrap;
  float mat = gMat;
  vec3 col = baseShade(p, n, rd, trap, mat, wDom);

  bool reflective = wDom > 1.5 && mat > 0.5;
  if (reflective) {
    vec3 nn = n;
    if (mat > 1.5) {
      float rip = 0.045 / (1.0 + length(p - uCamPos) * 0.12);
      nn.xz += rip * vec2(sin(p.x * 2.3 + uTime * 1.4),
                          cos(p.z * 1.9 - uTime * 1.1));
      nn = normalize(nn);
    }
    vec3 rr = normalize(reflect(rd, nn));
    vec2 rh = march(p + nn * 0.03, rr, 60.0, 56);
    vec3 rcol;
    if (rh.y > 0.5) {
      vec3 rp = p + nn * 0.03 + rr * rh.x;
      vec3 rn = normalAt(rp, 0.002 + rh.x * 0.0008);
      map(rp);
      rcol = baseShade(rp, rn, rr, gTrap, gMat, wDom);
      rcol *= exp(-rh.x * 0.030);
    } else {
      rcol = sky(rr, wDom);
    }
    float fres = pow(1.0 - max(dot(nn, -rd), 0.0), 4.0);
    float amt = mat > 1.5 ? (0.38 + 0.58 * fres) : (0.20 + 0.55 * fres);
    col = mix(col, rcol, amt);
    if (mat > 1.5) {
      float spec = pow(max(dot(rr, SUN_DIR), 0.0), 60.0);
      col += vec3(1.0, 0.60, 0.35) * spec * 1.6;
    }
  }
  return col;
}

// ============================ MAIN ============================
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 ro = uCamPos;
  vec3 ww = normalize(uCamTgt - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  float fl = 1.0 / tan(uFov * 0.5);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + fl * ww);

  float wDom = floor(uWorld + 0.5);
  float maxT = wDom < 0.5 ? 30.0 : (wDom < 1.5 ? 45.0 : (wDom < 2.5 ? 60.0 : 120.0));
  int steps = wDom < 1.5 ? 110 : 120;

  gGlow = 0.0;
  vec2 h = march(ro, rd, maxT, steps);

  vec3 col;
  if (h.y > 0.5) {
    vec3 p = ro + rd * h.x;
    vec3 n = normalAt(p, 0.0015 + h.x * 0.0006);
    col = shade(p, n, rd, wDom);
    float fog = wDom < 0.5 ? 0.045 : (wDom < 1.5 ? 0.050 :
                (wDom < 2.5 ? 0.030 : 0.022));
    col *= exp(-h.x * fog);
  } else {
    col = sky(rd, wDom);
  }

  // luz volumétrica barata (acumulación de proximidad)
  vec3 tint = wDom < 1.5 ? CYAN :
              (wDom < 2.5 ? mix(CYAN, MAGENTA, 0.5) : vec3(1.0, 0.55, 0.35));
  float gStr = wDom < 0.5 ? 0.35 : (wDom < 1.5 ? 0.45 :
               (wDom < 2.5 ? 0.40 : 0.55));
  col += min(gGlow, 1.4) * tint * gStr;

  outColor = vec4(max(col, 0.0), 1.0); // lineal, sin tonemap
}`;

/** Pass "present": tonemap ACES + gamma + viñeta (primera versión del post). */
export const PRESENT_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTime;

out vec4 outColor;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = texture(uScene, uv).rgb;
  col = aces(col * 1.25);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 q = uv;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.28);
  outColor = vec4(col, 1.0);
}`;
