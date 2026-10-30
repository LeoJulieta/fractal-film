/**
 * PRUEBA / MUNDO 1: Mandelbulb raymarched.
 * DE (distance estimator) de potencia 8, órbita trap para color,
 * iluminación key+fill+rim, niebla exponencial, tonemap ACES.
 */
export const MANDELBULB_FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamTgt;
uniform float uFov;

out vec4 outColor;

float gTrap;

float bulb(vec3 p) {
  vec3 z = p;
  float dr = 1.0;
  float r = length(z);
  gTrap = 1e9;
  for (int i = 0; i < 8; i++) {
    if (r > 2.0) break;
    gTrap = min(gTrap, r);
    float theta = acos(clamp(z.z / max(r, 1e-6), -1.0, 1.0));
    float phi = atan(z.y, z.x);
    float zr = pow(r, 8.0);
    dr = pow(r, 7.0) * 8.0 * dr + 1.0;
    theta *= 8.0;
    phi *= 8.0;
    z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + p;
    r = length(z);
  }
  gTrap = min(gTrap, r);
  return 0.5 * log(max(r, 1e-6)) * r / max(dr, 1e-6);
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float map(vec3 p) {
  p.xz *= rot(uTime * 0.07);
  p.xy *= rot(0.35);
  return bulb(p);
}

vec3 normalAt(vec3 p) {
  const vec2 e = vec2(0.0012, -0.0012);
  return normalize(
    e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;

  vec3 ro = uCamPos;
  vec3 ww = normalize(uCamTgt - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  float fl = 1.0 / tan(uFov * 0.5);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + fl * ww);

  float t = 0.0;
  float d = 0.0;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    d = map(p);
    if (d < 0.0009 * max(t, 1.0)) { hit = true; break; }
    t += d * 0.72;
    if (t > 40.0) break;
  }

  vec3 col;
  if (hit) {
    vec3 p = ro + rd * t;
    float trap = bulb(p);  // recalcula gTrap en el punto de impacto
    float tr = gTrap;
    vec3 n = normalAt(p);

    vec3 keyDir = normalize(vec3(0.55, 0.75, 0.35));
    vec3 fillDir = normalize(vec3(-0.6, -0.2, -0.5));
    float key = max(dot(n, keyDir), 0.0);
    float fill = max(dot(n, fillDir), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);

    vec3 cyan = vec3(0.18, 0.92, 0.86);
    vec3 magenta = vec3(1.0, 0.24, 0.55);
    vec3 albedo = mix(cyan, magenta, smoothstep(0.35, 1.4, tr));

    col = albedo * (key * 1.15 + 0.10);
    col += cyan * fill * 0.16;
    col += mix(cyan, vec3(1.0), 0.4) * rim * 0.85;
    col += albedo * smoothstep(0.9, 0.2, tr) * 0.22;  // brillo del interior
    col *= exp(-t * 0.055);
  } else {
    float h = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
    col = mix(vec3(0.010, 0.014, 0.030), vec3(0.028, 0.045, 0.075), h);
    // destello de fondo detrás del objeto
    float g = pow(max(dot(rd, normalize(uCamTgt - ro)), 0.0), 30.0);
    col += vec3(0.05, 0.16, 0.20) * g * 0.5;
  }

  col = aces(col * 1.25);
  col = pow(col, vec3(1.0 / 2.2));

  // viñeta suave
  vec2 q = gl_FragCoord.xy / uRes;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.28);

  outColor = vec4(col, 1.0);
}`;
