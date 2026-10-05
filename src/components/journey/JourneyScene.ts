/* ──────────────────────────────────────────────────────────────
   JourneyScene — a dependency-free WebGL2 scene for case studies.

   The project is one product-shot object: a stack of glossy slabs,
   one slab per stage of the project's flow. Scroll drives it through
   four acts (the same grammar as the 3D product sites it's modelled on):

     p = 0        hero      assembled object, slowly turning
     p = 1        anatomy   exploded view, every layer labelled
     p = 2+k      journey   camera visits layer k, data streams into it
     p = N+2      shipped   the object disintegrates into fibres

   React owns the DOM (copy, labels); this class owns pixels only.
   ────────────────────────────────────────────────────────────── */

import { MOTIF } from "./motifs";

export type LabelPos = { x: number; y: number };
export type FrameState = {
  explode: number;
  focus: number; // 0..1 how much the camera is in "journey" mode
  active: number; // continuous active stage index
  dissolve: number;
  p: number;
};

type Opts = {
  count: number;
  reduced?: boolean;
  motifs?: number[]; // one motif id per layer; see motifs.ts
  onFrame?: (labels: LabelPos[], s: FrameState) => void;
};

const MAX_SLABS = 8;
const FIBRE_SEGS = 10;
const SLAB = { hw: 1.25, hh: 0.13, hd: 0.85, r: 0.11 };
const ACCENT: [number, number, number] = [1.0, 0.353, 0.122];

/* ── tiny math ─────────────────────────────────────────────── */
type V3 = [number, number, number];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function perspective(fovy: number, aspect: number, near: number, far: number, offX: number, offY = 0) {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[8] = -offX; // shifts the image (NDC) without moving the camera
  m[9] = -offY;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}
function lookAt(eye: V3, target: V3, up: V3 = [0, 1, 0]) {
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  const m = new Float32Array(16);
  m[0] = x[0]; m[4] = x[1]; m[8] = x[2];
  m[1] = y[0]; m[5] = y[1]; m[9] = y[2];
  m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
  m[12] = -dot(x, eye); m[13] = -dot(y, eye); m[14] = -dot(z, eye);
  m[15] = 1;
  return m;
}
function modelMatrix(y: number, rotY: number, s: number) {
  const c = Math.cos(rotY) * s;
  const n = Math.sin(rotY) * s;
  const m = new Float32Array(16);
  m[0] = c; m[2] = -n;
  m[5] = s;
  m[8] = n; m[10] = c;
  m[13] = y;
  m[15] = 1;
  return m;
}
function transform(m: Float32Array, p: V3): [number, number, number, number] {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
  ];
}

/* deterministic PRNG so every load looks the same */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── geometry ──────────────────────────────────────────────── */
function roundedBox(hw: number, hh: number, hd: number, r: number, k = 6) {
  const axis = (half: number) => {
    const c: number[] = [];
    for (let i = 0; i <= k; i++) c.push(-(half - r) - r * Math.cos((i / k) * (Math.PI / 2)));
    for (let i = k; i >= 0; i--) c.push(half - r + r * Math.cos((i / k) * (Math.PI / 2)));
    return c;
  };
  const ax = axis(hw), ay = axis(hh), az = axis(hd);
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const half: V3 = [hw, hh, hd];
  // each face: [fixed axis, sign, u axis, v axis]
  const faces: [number, number, number, number][] = [
    [0, 1, 2, 1], [0, -1, 2, 1], [1, 1, 0, 2], [1, -1, 0, 2], [2, 1, 0, 1], [2, -1, 0, 1],
  ];
  const lists = [ax, ay, az];
  for (const [fa, sg, ua, va] of faces) {
    const us = lists[ua], vs = lists[va];
    const base = pos.length / 3;
    for (let j = 0; j < vs.length; j++) {
      for (let i = 0; i < us.length; i++) {
        const p: V3 = [0, 0, 0];
        p[fa] = sg * half[fa];
        p[ua] = us[i];
        p[va] = vs[j];
        const inner: V3 = [
          clamp(p[0], -(hw - r), hw - r),
          clamp(p[1], -(hh - r), hh - r),
          clamp(p[2], -(hd - r), hd - r),
        ];
        const n = norm(sub(p, inner));
        pos.push(inner[0] + n[0] * r, inner[1] + n[1] * r, inner[2] + n[2] * r);
        nor.push(n[0], n[1], n[2]);
      }
    }
    const w = us.length;
    for (let j = 0; j < vs.length - 1; j++) {
      for (let i = 0; i < w - 1; i++) {
        const a = base + j * w + i;
        idx.push(a, a + 1, a + w, a + 1, a + w + 1, a + w);
      }
    }
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint16Array(idx) };
}

/* ── shaders ───────────────────────────────────────────────── */
const NOISE = /* glsl */ `
float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
// threshold at which a point on a slab disintegrates (0..1). Left edge goes first.
float disThreshold(vec3 local, float slab, float hw){
  float n = vnoise(local*3.2 + slab*7.13)*0.55 + vnoise(local*9.0)*0.15;
  float sweep = (local.x/hw)*0.5+0.5;
  return clamp(n*0.55 + sweep*0.45, 0.0, 1.0);
}
`;

const SLAB_VS = /* glsl */ `#version 300 es
in vec3 aPos; in vec3 aNor;
uniform mat4 uProj, uView, uModel;
out vec3 vN; out vec3 vW; out vec3 vL;
void main(){
  vec4 w = uModel*vec4(aPos,1.0);
  vW = w.xyz; vN = mat3(uModel)*aNor; vL = aPos;
  gl_Position = uProj*uView*w;
}`;

const SLAB_FS = /* glsl */ `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; in vec3 vL;
uniform vec3 uEye; uniform vec3 uAccent;
uniform float uGlow, uDone, uTime, uIdx, uDis, uMotif, uPlay;
uniform vec2 uHalf;
out vec4 o;
${NOISE}
${MOTIF}
void main(){
  float th = disThreshold(vL, uIdx, uHalf.x);
  if (uDis > 0.0 && th < uDis) discard;
  float ember = (uDis > 0.0) ? 1.0 - smoothstep(0.0, 0.07, th - uDis) : 0.0;

  vec3 N = normalize(vN); vec3 V = normalize(uEye - vW);
  vec3 L1 = normalize(vec3(-0.45, 1.0, 0.55));
  vec3 L2 = normalize(vec3(0.9, 0.25, -0.5));
  float dif = max(dot(N, L1), 0.0);
  float sp1 = pow(max(dot(N, normalize(L1+V)), 0.0), 120.0);
  float sp2 = pow(max(dot(N, normalize(L2+V)), 0.0), 36.0);
  vec3 R = reflect(-V, N);
  // studio: a big overhead softbox + a vertical strip light on the right
  float soft = smoothstep(0.55, 0.9, R.y);
  float strip = smoothstep(0.22, 0.0, abs(R.x - 0.62)) * smoothstep(-0.3, 0.3, R.y);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);

  vec3 base = vec3(0.055, 0.055, 0.06);
  vec3 col = base * (0.35 + dif * 0.9);
  col += vec3(1.0, 0.97, 0.93) * (sp1 * 1.1 + sp2 * 0.35);
  col += vec3(0.85) * (soft * 0.16 + strip * 0.22) * (0.35 + fres * 1.6);
  col += fres * vec3(0.10);

  float top = smoothstep(0.75, 0.97, N.y);
  vec2 uv = vL.xz;
  vec2 q = abs(uv) - (uHalf - 0.2);
  float dbox = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.05;
  float border = 1.0 - smoothstep(0.0, 0.014, abs(dbox));
  float inside = step(dbox, 0.0);
  vec2 g = abs(fract(uv * 4.0) - 0.5);
  float grid = (1.0 - smoothstep(0.0, 0.025, min(g.x, g.y))) * inside;
  // the step's own animation, playing while the layer is in focus (uPlay)
  float mk = motif(int(uMotif + 0.5), uv, uHalf, uTime) * inside * uPlay;

  float lit = max(uGlow, uDone * 0.35);
  vec3 line = mix(vec3(0.30, 0.30, 0.31), uAccent * 1.7, lit);
  col += top * (border * 0.6 + grid * (0.05 + 0.10 * uGlow)) * line;
  col += top * mk * (uAccent * 1.9 + vec3(0.12)) * 1.1;

  // engraved seam around the sides
  float side = 1.0 - smoothstep(0.3, 0.6, abs(N.y));
  float seam = 1.0 - smoothstep(0.0, 0.01, abs(vL.y) - 0.006);
  col += side * seam * mix(vec3(0.22), uAccent * 2.2, lit);

  col += uAccent * (uGlow * (0.035 + fres * 0.5));
  col += uAccent * ember * 2.5;
  col = col / (1.0 + col * 0.35);          // soft shoulder
  o = vec4(pow(col, vec3(0.92)), 1.0);
}`;

const PT_VS = /* glsl */ `#version 300 es
in vec4 aSeed; in vec3 aLocal; in vec3 aMeta; // meta: kind, slab, trail
uniform mat4 uProj, uView;
uniform float uTime, uPx, uFlow, uActive, uDis, uExplode, uCount, uTwist[${MAX_SLABS}], uSlabY[${MAX_SLABS}];
uniform vec2 uHalf; uniform vec3 uAccent, uCamR, uCamU; uniform float uLine;
out vec4 vCol;
${NOISE}
float slabY(float i){ int a=int(floor(i)); int b=min(a+1, int(uCount)-1); return mix(uSlabY[a], uSlabY[b], fract(i)); }
vec3 bez(vec3 a, vec3 b, vec3 c, vec3 d, float t){ float u=1.0-t; return u*u*u*a + 3.0*u*u*t*b + 3.0*u*t*t*c + t*t*t*d; }
void main(){
  float kind = aMeta.x, slab = aMeta.y, trail = aMeta.z;
  vec3 p = vec3(0.0); float a = 0.0; float size = 1.0; vec3 col = vec3(1.0);

  if (kind < 0.5) {
    // data stream: spirals down the outside of the stack into the active layer
    float sp = 0.10 + aSeed.y * 0.06;
    float u = fract(aSeed.x + uTime * sp - trail * 0.006);
    float yTop = uSlabY[0] + 1.3;
    float yEnd = slabY(clamp(uActive, 0.0, uCount - 1.0));
    float y = mix(yTop, yEnd, u);
    float ang = aSeed.z * 6.2831 + u * 7.0 + uTime * 0.25;
    float rad = mix(1.0, 0.55, smoothstep(0.82, 1.0, u)) * (1.0 + aSeed.w * 0.35);
    p = vec3(cos(ang) * uHalf.x * 1.25 * rad, y, sin(ang) * uHalf.y * 1.5 * rad);
    a = smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.9, 1.0, u)) * uFlow * (1.0 - trail / 8.0) * 0.8;
    col = mix(vec3(1.0, 0.93, 0.86), uAccent, smoothstep(0.25, 0.9, u));
    size = 3.2;
  } else if (kind < 1.5) {
    // fibres: each point leaves its slab exactly when the slab surface under it disintegrates
    float th = disThreshold(aLocal, slab, uHalf.x);
    float t = clamp((uDis - th) * 2.0 - trail * 0.022, 0.0, 1.0);
    float c = cos(uTwist[int(slab)]), s = sin(uTwist[int(slab)]);
    vec3 st = vec3(aLocal.x * c + aLocal.z * s, aLocal.y + uSlabY[int(slab)], -aLocal.x * s + aLocal.z * c);
    // fibres always stream toward screen-right, whatever angle the camera is at
    vec3 fwd = cross(uCamU, uCamR);
    vec3 tgt = uCamR * (10.0 + aSeed.x * 3.0) + uCamU * ((aSeed.y - 0.5) * 1.6) + fwd * (aSeed.z - 0.5) * 2.0;
    vec3 c1 = st - uCamR * (0.4 + aSeed.w * 0.8) + uCamU * (0.9 * (aSeed.z - 0.5));
    vec3 c2 = uCamR * 4.5 + uCamU * ((aSeed.w - 0.5) * 2.8) + fwd * (aSeed.y - 0.5) * 1.5;
    float e = 1.0 - pow(1.0 - t, 2.2);
    p = bez(st, c1, c2, tgt, e);
    float head = clamp((uDis - th) * 2.0, 0.0, 1.0);
    a = step(0.0001, head) * (1.0 - smoothstep(0.8, 1.0, head)) * (1.0 - trail / ${FIBRE_SEGS + 1}.0) * (uLine > 0.5 ? 0.55 : 1.4);
    col = mix(vec3(1.0, 0.96, 0.92), uAccent, smoothstep(0.35, 0.85, e) * (0.4 + aSeed.w * 0.6));
    size = 2.0;
  } else {
    // ambient dust in the studio
    vec3 b = (aSeed.xyz - 0.5) * vec3(16.0, 10.0, 10.0);
    b.y += mod(uTime * (0.05 + aSeed.w * 0.08) + aSeed.w * 10.0, 10.0) - 5.0;
    b.x += sin(uTime * 0.2 + aSeed.w * 6.0) * 0.3;
    p = b;
    a = 0.22 * (0.4 + aSeed.w) * (1.0 - uDis * 0.5);
    col = vec3(0.9, 0.88, 0.85);
    size = 1.4;
  }
  vec4 clip = uProj * uView * vec4(p, 1.0);
  gl_Position = clip;
  gl_PointSize = max(1.0, size * uPx / clip.w);
  vCol = vec4(col * a, a);
}`;

const PT_FS = /* glsl */ `#version 300 es
precision highp float;
in vec4 vCol; out vec4 o; uniform float uLine;
void main(){
  if (uLine > 0.5) { o = vec4(vCol.rgb, 0.0); return; }
  vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0;
  float f = exp(-r * 3.5);
  o = vec4(vCol.rgb * f, 0.0);   // additive, never darkens the page
}`;

const FLOOR_VS = /* glsl */ `#version 300 es
in vec2 aXY;
uniform mat4 uProj, uView; uniform float uY, uScale;
out vec2 vUV;
void main(){ vUV = aXY; gl_Position = uProj*uView*vec4(aXY.x*uScale*1.4, uY, aXY.y*uScale, 1.0); }`;

const FLOOR_FS = /* glsl */ `#version 300 es
precision mediump float;
in vec2 vUV; uniform vec3 uAccent; uniform float uGlow, uFade;
out vec4 o;
void main(){
  float d = length(vUV);
  float pool = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);
  float ring = exp(-pow((d - 0.42) * 14.0, 2.0)) * 0.6;
  vec3 c = vec3(0.075, 0.072, 0.07) * pool + uAccent * (pool * 0.05 + ring * 0.05) * uGlow;
  o = vec4(c * uFade, 0.0);
}`;

/* ── gl helpers ────────────────────────────────────────────── */
function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader: " + (gl.isContextLost() ? "context lost" : gl.getShaderInfoLog(s)));
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  const u: Record<string, WebGLUniformLocation | null> = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)!;
    const name = info.name.replace(/\[0\]$/, "");
    u[name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

function attrib(gl: WebGL2RenderingContext, prog: WebGLProgram, name: string, data: Float32Array, size: number) {
  const loc = gl.getAttribLocation(prog, name);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  if (loc >= 0) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  return buf;
}

/* ── the scene ─────────────────────────────────────────────── */
export default class JourneyScene {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private opts: Opts;
  private n: number;
  private motifs: number[];
  private raf = 0;
  private last = 0;
  private time = 0;
  private target = 0;
  private p = 0;
  private ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  private dpr = 1;
  private w = 1;
  private h = 1;
  private buffers: WebGLBuffer[] = [];
  private vaos: WebGLVertexArrayObject[] = [];
  private slab!: { prog: ReturnType<typeof compile>; vao: WebGLVertexArrayObject; count: number };
  private pts!: { prog: ReturnType<typeof compile>; vao: WebGLVertexArrayObject; count: number; lineVao: WebGLVertexArrayObject; lineCount: number };
  private floor!: { prog: ReturnType<typeof compile>; vao: WebGLVertexArrayObject };
  private ro: ResizeObserver;
  /** current per-slab layout, read by label projection */
  private slabY = new Float32Array(MAX_SLABS);
  private twist = new Float32Array(MAX_SLABS);
  private proj = new Float32Array(16);
  private view = new Float32Array(16);

  static supported() {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  }

  constructor(canvas: HTMLCanvasElement, opts: Opts) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl || gl.isContextLost()) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.canvas = canvas;
    this.opts = opts;
    this.n = Math.max(2, Math.min(MAX_SLABS, opts.count));
    this.motifs = Array.from({ length: this.n }, (_, i) => opts.motifs?.[i] ?? i % 8);
    this.build();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  /** scroll position in "acts" (see header). */
  setProgress(p: number) {
    this.target = clamp(p, 0, this.n + 2.2);
  }
  /** jump without easing (e.g. on open) */
  snap(p: number) {
    this.target = this.p = clamp(p, 0, this.n + 2.2);
  }
  setPointer(nx: number, ny: number) {
    this.ptr.x = clamp(nx, -1, 1);
    this.ptr.y = clamp(ny, -1, 1);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    const gl = this.gl;
    this.buffers.forEach((b) => gl.deleteBuffer(b));
    this.vaos.forEach((v) => gl.deleteVertexArray(v));
    [this.slab?.prog.p, this.pts?.prog.p, this.floor?.prog.p].forEach((p) => p && gl.deleteProgram(p));
    // Don't lose the context here: React StrictMode remounts on the same canvas,
    // and a lost context can't be recreated from it. The GC frees it with the canvas.
  }

  private build() {
    const gl = this.gl;

    // slabs
    {
      const prog = compile(gl, SLAB_VS, SLAB_FS);
      const g = roundedBox(SLAB.hw, SLAB.hh, SLAB.hd, SLAB.r);
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      this.buffers.push(attrib(gl, prog.p, "aPos", g.pos, 3), attrib(gl, prog.p, "aNor", g.nor, 3));
      const ib = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.idx, gl.STATIC_DRAW);
      this.buffers.push(ib);
      this.vaos.push(vao);
      this.slab = { prog, vao, count: g.idx.length };
    }

    // particles: stream (kind 0), fibres (kind 1), dust (kind 2).
    // Points carry trails as duplicated vertices; fibres are also drawn as line strands.
    {
      const prog = compile(gl, PT_VS, PT_FS);
      const R = rng(7);
      const low = this.opts.reduced || window.innerWidth < 768;
      type P = { kind: number; s: number[]; slab: number; l: number[] };
      const make = (kind: number, n: number): P[] =>
        Array.from({ length: n }, () => {
          const s = [R(), R(), R(), R()];
          const slab = Math.floor(R() * this.n);
          // a point on the slab surface: half on top, half around the rim
          let lx: number, ly: number, lz: number;
          if (R() < 0.5) {
            lx = (R() * 2 - 1) * SLAB.hw * 0.95;
            lz = (R() * 2 - 1) * SLAB.hd * 0.95;
            ly = SLAB.hh;
          } else {
            const t = R() * 4;
            const side = Math.floor(t);
            const f = (t - side) * 2 - 1;
            lx = side < 2 ? f * SLAB.hw : (side === 2 ? 1 : -1) * SLAB.hw;
            lz = side < 2 ? (side === 0 ? 1 : -1) * SLAB.hd : f * SLAB.hd;
            ly = (R() * 2 - 1) * SLAB.hh;
          }
          return { kind, s, slab, l: [lx, ly, lz] };
        });
      const stream = make(0, low ? 260 : 520);
      const fibres = make(1, low ? 900 : 1800);
      const dust = make(2, low ? 120 : 260);

      const pack = (items: [P, number][]) => {
        const seed = new Float32Array(items.length * 4);
        const local = new Float32Array(items.length * 3);
        const meta = new Float32Array(items.length * 3);
        items.forEach(([q, t], k) => {
          seed.set(q.s, k * 4);
          local.set(q.l, k * 3);
          meta.set([q.kind, q.slab, t], k * 3);
        });
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);
        this.buffers.push(
          attrib(gl, prog.p, "aSeed", seed, 4),
          attrib(gl, prog.p, "aLocal", local, 3),
          attrib(gl, prog.p, "aMeta", meta, 3)
        );
        this.vaos.push(vao);
        return { vao, count: items.length };
      };
      const pointItems: [P, number][] = [];
      stream.forEach((q) => { for (let t = 0; t < 8; t++) pointItems.push([q, t]); });
      fibres.forEach((q) => pointItems.push([q, 0]));
      dust.forEach((q) => pointItems.push([q, 0]));
      const lineItems: [P, number][] = [];
      fibres.forEach((q) => { for (let t = 0; t < FIBRE_SEGS; t++) lineItems.push([q, t], [q, t + 1]); });
      const pts = pack(pointItems);
      const lines = pack(lineItems);
      this.pts = { prog, vao: pts.vao, count: pts.count, lineVao: lines.vao, lineCount: lines.count };
    }

    // floor light pool
    {
      const prog = compile(gl, FLOOR_VS, FLOOR_FS);
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      this.buffers.push(attrib(gl, prog.p, "aXY", new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), 2));
      this.vaos.push(vao);
      this.floor = { prog, vao };
    }
    gl.bindVertexArray(null);
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.time += dt * (this.opts.reduced ? 0.25 : 1);
    this.p += (this.target - this.p) * Math.min(1, dt * 5);
    this.ptr.sx += (this.ptr.x - this.ptr.sx) * Math.min(1, dt * 3);
    this.ptr.sy += (this.ptr.y - this.ptr.sy) * Math.min(1, dt * 3);
    // past the end of the journey nothing is left on stage: stop drawing
    if (this.p > this.n + 2.19 && this.target > this.n + 2.19) return;
    this.render();
  };

  /** Render one frame at the current eased progress. Public so tests can drive it. */
  render() {
    const gl = this.gl;
    const N = this.n;
    const p = this.p;
    const t = this.time;
    const narrow = this.w < 900;

    // acts
    const explode = smooth(0.1, 0.9, p);
    const focus = smooth(1.2, 1.9, p) * (1 - smooth(N + 1.1, N + 1.6, p));
    const active = clamp(p - 2, 0, N - 1);
    const dissolve = clamp((p - (N + 1.3)) / 1.1);

    // layout
    const gap = mix(0.3, 1.18, explode);
    for (let i = 0; i < N; i++) {
      this.slabY[i] = ((N - 1) / 2 - i) * gap;
      this.twist[i] = explode * (i - (N - 1) / 2) * 0.1 + Math.sin(t * 0.6 + i) * 0.025 * explode;
    }
    const yActive = mix(this.slabY[Math.floor(active)], this.slabY[Math.min(N - 1, Math.floor(active) + 1)], active % 1);

    // camera: blend hero → anatomy → journey → shipped
    const stackH = (N - 1) * gap + 1.2;
    const fov = 0.62;
    const fitDist = stackH / 2 / Math.tan(fov / 2) + 1.0;
    const fitW = clamp(1.25 / (this.w / this.h), 1, 2.0); // narrow screens: back off so the object fits the width
    let dist = mix(6.3 * fitW, Math.max(8, fitDist), explode);
    let elev = mix(0.46, 0.22, explode);
    let ty = 0;
    let off = mix(narrow ? 0 : 0.28, narrow ? 0 : 0.2, explode);
    dist = mix(dist, 6.0 * fitW, focus);
    elev = mix(elev, 0.36, focus);
    ty = mix(ty, yActive, focus);
    off = mix(off, narrow ? 0 : 0.2, focus);
    dist = mix(dist, Math.max(narrow ? 12 : 9.5, fitDist), dissolve);
    elev = mix(elev, 0.16, dissolve);
    off = mix(off, narrow ? -0.1 : -0.35, dissolve);
    const az = 0.65 + t * 0.1 * (1 - focus * 0.6) + p * 0.45 + this.ptr.sx * 0.18;
    elev += this.ptr.sy * 0.08;
    const target: V3 = [0, ty, 0];
    const eye: V3 = [
      Math.sin(az) * Math.cos(elev) * dist,
      ty + Math.sin(elev) * dist,
      Math.cos(az) * Math.cos(elev) * dist,
    ];
    // on phones the copy sits low, so lift the object into the top half
    const offY = narrow ? mix(mix(0.28, 0.05, explode), 0.38, focus) * (1 - dissolve * 0.5) : 0;
    this.proj = perspective(fov, this.w / this.h, 0.1, 100, off, offY);
    this.view = lookAt(eye, target);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // floor
    {
      const { prog, vao } = this.floor;
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(prog.p);
      gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(prog.u.uProj, false, this.proj);
      gl.uniformMatrix4fv(prog.u.uView, false, this.view);
      gl.uniform1f(prog.u.uY, this.slabY[N - 1] - 0.9);
      gl.uniform1f(prog.u.uScale, 3.2 + explode * 1.5);
      gl.uniform3fv(prog.u.uAccent, ACCENT);
      gl.uniform1f(prog.u.uGlow, 0.4 + focus * 0.6);
      gl.uniform1f(prog.u.uFade, 1 - dissolve);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // slabs
    {
      const { prog, vao, count } = this.slab;
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.useProgram(prog.p);
      gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(prog.u.uProj, false, this.proj);
      gl.uniformMatrix4fv(prog.u.uView, false, this.view);
      gl.uniform3fv(prog.u.uEye, eye);
      gl.uniform3fv(prog.u.uAccent, ACCENT);
      gl.uniform2f(prog.u.uHalf, SLAB.hw, SLAB.hd);
      gl.uniform1f(prog.u.uTime, t);
      gl.uniform1f(prog.u.uDis, dissolve > 0 ? dissolve * 1.15 : 0);
      for (let i = 0; i < N; i++) {
        const near = Math.max(0, 1 - Math.abs(active - i) * 1.4) * focus;
        const done = i < active - 0.5 ? focus : 0;
        // hero/anatomy: a slow breathing glow travels down the stack
        const idle = (1 - focus) * Math.pow(Math.max(0, Math.sin(t * 0.9 - i * 0.7)), 8) * 0.55;
        gl.uniform1f(prog.u.uGlow, Math.max(near, idle * (1 - dissolve)));
        gl.uniform1f(prog.u.uDone, done);
        gl.uniform1f(prog.u.uIdx, i);
        // the active layer plays its step's motif; a visited one keeps a faint trace
        gl.uniform1f(prog.u.uMotif, this.motifs[i]);
        gl.uniform1f(prog.u.uPlay, Math.max(near, done * 0.25) * (1 - dissolve));
        gl.uniformMatrix4fv(prog.u.uModel, false, modelMatrix(this.slabY[i], this.twist[i], 1));
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      }
    }

    // particles (additive, depth-tested so the stack occludes what's behind it)
    {
      const { prog, vao, count } = this.pts;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      gl.useProgram(prog.p);
      gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(prog.u.uProj, false, this.proj);
      gl.uniformMatrix4fv(prog.u.uView, false, this.view);
      gl.uniform1f(prog.u.uTime, t);
      gl.uniform1f(prog.u.uPx, this.dpr * this.h * 0.013);
      gl.uniform1f(prog.u.uFlow, focus * 0.9 + 0.12 * (1 - focus) * explode);
      gl.uniform1f(prog.u.uActive, focus > 0.02 ? active : N - 1);
      gl.uniform1f(prog.u.uDis, dissolve * 1.15);
      gl.uniform1f(prog.u.uExplode, explode);
      gl.uniform1f(prog.u.uCount, N);
      gl.uniform1fv(prog.u.uTwist, this.twist);
      gl.uniform1fv(prog.u.uSlabY, this.slabY);
      gl.uniform2f(prog.u.uHalf, SLAB.hw, SLAB.hd);
      gl.uniform3fv(prog.u.uAccent, ACCENT);
      gl.uniform3f(prog.u.uCamR, this.view[0], this.view[4], this.view[8]);
      gl.uniform3f(prog.u.uCamU, this.view[1], this.view[5], this.view[9]);
      gl.uniform1f(prog.u.uLine, 0);
      gl.drawArrays(gl.POINTS, 0, count);
      if (dissolve > 0) {
        gl.bindVertexArray(this.pts.lineVao);
        gl.uniform1f(prog.u.uLine, 1);
        gl.drawArrays(gl.LINES, 0, this.pts.lineCount);
      }
      gl.depthMask(true);
    }
    gl.bindVertexArray(null);

    this.opts.onFrame?.(this.labels(), { explode, focus, active, dissolve, p });
  }

  /** Screen position (CSS px) just right of each slab's outermost edge. */
  private labels(): LabelPos[] {
    const out: LabelPos[] = [];
    for (let i = 0; i < this.n; i++) {
      const m = modelMatrix(this.slabY[i], this.twist[i], 1);
      let best = -Infinity;
      let by = 0;
      for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const w = transform(m, [cx * SLAB.hw, 0, cz * SLAB.hd]);
        const v = transform(this.view, [w[0], w[1], w[2]]);
        const c = transform(this.proj, [v[0], v[1], v[2]]);
        const x = ((c[0] / c[3]) * 0.5 + 0.5) * this.w;
        const y = (1 - ((c[1] / c[3]) * 0.5 + 0.5)) * this.h;
        if (x > best) {
          best = x;
          by = y;
        }
      }
      out.push({ x: best, y: by });
    }
    return out;
  }
}
