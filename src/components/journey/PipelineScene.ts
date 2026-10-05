/* ──────────────────────────────────────────────────────────────
   PipelineScene — a dependency-free WebGL2 renderer for a project's
   pipeline. Each stage is its own 3D station (see pipeline.ts); the
   stations sit on a project-specific path; conduits of light flow
   between them; the camera travels the path as you scroll.

     p = 0        hero     the whole pipeline in view, slowly turning
     p = 1..N     visit    camera flies to station k, it assembles & runs
     p = N+1      outro    pull back, the pipeline dims out

   React owns the DOM (copy, labels); this owns pixels only.
   ────────────────────────────────────────────────────────────── */

import { buildStation, layoutPath, stationScale, type LayoutName, type V3 } from "./pipeline";

export type LabelPos = { x: number; y: number; vis: number };
export type FrameState = { focus: number; active: number; dissolve: number; p: number };
type Opts = {
  archs: number[];
  layout: LayoutName;
  reduced?: boolean;
  onFrame?: (labels: LabelPos[], s: FrameState) => void;
};

const MAX_ST = 8;
const ACCENT: V3 = [1.0, 0.36, 0.13];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]) || 1;
const norm = (a: V3): V3 => [a[0] / len(a), a[1] / len(a), a[2] / len(a)];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function perspective(fovy: number, aspect: number, near: number, far: number, offX: number) {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect; m[5] = f; m[8] = -offX;
  m[10] = (far + near) / (near - far); m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}
function lookAt(eye: V3, target: V3, up: V3 = [0, 1, 0]) {
  const z = norm(sub(eye, target)), x = norm(cross(up, z)), y = cross(z, x);
  const m = new Float32Array(16);
  m[0] = x[0]; m[4] = x[1]; m[8] = x[2];
  m[1] = y[0]; m[5] = y[1]; m[9] = y[2];
  m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
  m[12] = -dot(x, eye); m[13] = -dot(y, eye); m[14] = -dot(z, eye); m[15] = 1;
  return m;
}
function project(mvp: Float32Array, p: V3): [number, number, number, number] {
  return [
    mvp[0] * p[0] + mvp[4] * p[1] + mvp[8] * p[2] + mvp[12],
    mvp[1] * p[0] + mvp[5] * p[1] + mvp[9] * p[2] + mvp[13],
    mvp[2] * p[0] + mvp[6] * p[1] + mvp[10] * p[2] + mvp[14],
    mvp[3] * p[0] + mvp[7] * p[1] + mvp[11] * p[2] + mvp[15],
  ];
}
function mul(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = s;
  }
  return o;
}

const VS = /* glsl */ `#version 300 es
in vec3 aPos;          // local position within the station
in vec4 aMeta;         // order, role, seed, station
uniform mat4 uProj, uView;
uniform float uTime, uPx, uActive, uDissolve, uHero;
uniform vec3 uCtr[${MAX_ST}];
uniform float uScl[${MAX_ST}];
uniform float uArch[${MAX_ST}];
out vec4 vCol;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

void main(){
  float order = aMeta.x, role = aMeta.y, seed = aMeta.z;
  int si = int(aMeta.w + 0.5);
  vec3 ctr = uCtr[si]; float scl = uScl[si]; float arch = uArch[si];

  // how assembled this station is (0 before the camera arrives, 1 once reached;
  // in the hero overview everything is already built)
  float build = clamp(max((uActive - (float(si) - 0.9)) / 0.9, uHero), 0.0, 1.0);
  float near = 1.0 - smoothstep(0.0, 1.1, abs(uActive - float(si)));
  float nearE = max(near, uHero * 0.6);
  float appear = smoothstep(order - 0.05, order + 0.28, build);

  vec3 lp = aPos;
  float t = uTime;

  // role 2 = moving parts, animated per archetype
  if (role > 1.5) {
    float amp = 0.4 + 0.6 * near;
    if (arch < 0.5) {                // scan: sweep arm rotates
      lp.xz = rot(t * 1.3) * lp.xz;
    } else if (arch < 2.5 && arch > 1.5) { // core: streams spiral inward then reset
      float k = fract(seed - t * 0.35);
      float r = mix(1.3, 0.45, k);
      float a = atan(lp.z, lp.x) + t * 0.6;
      lp = vec3(cos(a) * r, lp.y * (0.6 + 0.4 * k), sin(a) * r);
    } else if (arch > 3.5 && arch < 4.5) { // gate: pulse travels through along Z
      lp.z = mix(-1.0, 1.0, fract(seed + t * 0.5));
    } else if (arch > 6.5) {         // wave: displace Y as a travelling signal
      float x = lp.x;
      lp.y = (0.42 * sin(x * 3.2 + t * 2.0 + seed * 6.0) + 0.15 * sin(x * 8.0 - t * 3.0)) * amp;
    }
  }

  // node pulse
  float pulse = (role > 0.5 && role < 1.5) ? (0.7 + 0.3 * sin(t * 3.0 + seed * 6.28)) : 1.0;

  vec3 world = ctr + lp * scl;
  vec4 clip = uProj * uView * vec4(world, 1.0);
  gl_Position = clip;

  float sz = (role > 0.5 && role < 1.5) ? 3.4 : 1.8;
  sz *= (0.7 + nearE * 0.7);
  gl_PointSize = max(1.0, sz * uPx / clip.w);

  // colour: structure dim steel→accent as it lights; nodes/accents warm
  float lit = 0.25 + nearE * 0.9;
  vec3 steel = vec3(0.32, 0.33, 0.36);
  vec3 col = (role > 0.5 && role < 1.5) ? (vec3(1.0, 0.95, 0.9) * 0.4 + uAccent(lit)) : mix(steel, uAccentC, lit);
  float a = appear * pulse * (0.4 + nearE * 0.85) * (1.0 - uDissolve);
  if (role > 1.5) { col = mix(vec3(1.0,0.96,0.9), uAccentC, 0.5); a *= (0.6 + nearE); }
  vCol = vec4(col * a, a);
}`;

// (tiny helpers injected so the shader reads cleanly)
const VS_FIX = VS
  .replace("out vec4 vCol;", "out vec4 vCol;\nuniform vec3 uAccentC;\nvec3 uAccent(float l){ return uAccentC * l; }");

const FS = /* glsl */ `#version 300 es
precision highp float;
in vec4 vCol; out vec4 o;
void main(){
  vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0;
  float f = exp(-r * 3.2);
  o = vec4(vCol.rgb * f, 0.0);     // additive
}`;

const CONDUIT_VS = /* glsl */ `#version 300 es
in vec3 aFrom; in vec3 aTo; in vec2 aSeed; // seed.x phase, seed.y lateral
uniform mat4 uProj, uView;
uniform float uTime, uPx, uActive, uDissolve, uCount, uHero;
uniform vec3 uAccentC;
out vec4 vCol;
void main(){
  float seg = aFrom.x * 0.0; // keep aFrom referenced
  float k = fract(aSeed.x + uTime * 0.35);
  vec3 p = mix(aFrom, aTo, k);
  // which gap this conduit bridges (encoded in aSeed.y integer part)
  float gap = floor(aSeed.y);
  float act = clamp(uActive, 0.0, uCount - 1.0);
  float on = max(1.0 - smoothstep(0.0, 1.4, abs(act - (gap + 0.5))), uHero * 0.7);
  vec4 clip = uProj * uView * vec4(p, 1.0);
  gl_Position = clip;
  gl_PointSize = max(1.0, 2.0 * uPx / clip.w);
  float a = (0.15 + 0.85 * on) * (1.0 - smoothstep(0.9, 1.0, k)) * (1.0 - uDissolve);
  vCol = vec4(mix(vec3(1.0,0.95,0.9), uAccentC, 0.6) * a, a);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (ty: number, src: string) => {
    const s = gl.createShader(ty)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader: " + (gl.isContextLost() ? "ctx lost" : gl.getShaderInfoLog(s)));
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
    u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}
function buf(gl: WebGL2RenderingContext, prog: WebGLProgram, name: string, data: Float32Array, size: number) {
  const loc = gl.getAttribLocation(prog, name);
  const b = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); }
  return b;
}

export default class PipelineScene {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private opts: Opts;
  private n: number;
  private stations: V3[];
  private scl: number;
  private centroid: V3;
  private span = 6;
  private raf = 0; private last = 0; private time = 0;
  private target = 0; private p = 0;
  private ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  private dpr = 1; private w = 1; private h = 1;
  private buffers: WebGLBuffer[] = [];
  private vaos: WebGLVertexArrayObject[] = [];
  private pts!: { prog: ReturnType<typeof compile>; vao: WebGLVertexArrayObject; count: number };
  private cond!: { prog: ReturnType<typeof compile>; vao: WebGLVertexArrayObject; count: number };
  private ro: ResizeObserver;
  private proj = new Float32Array(16);
  private view = new Float32Array(16);

  static supported() {
    try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
  }

  constructor(canvas: HTMLCanvasElement, opts: Opts) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl || gl.isContextLost()) throw new Error("WebGL2 unavailable");
    this.gl = gl; this.canvas = canvas; this.opts = opts;
    this.n = Math.max(2, Math.min(MAX_ST, opts.archs.length));
    this.stations = layoutPath(opts.layout, this.n);
    this.scl = stationScale(opts.layout);
    this.centroid = this.stations.reduce<V3>((a, s) => [a[0] + s[0] / this.n, a[1] + s[1] / this.n, a[2] + s[2] / this.n], [0, 0, 0]);
    this.span = Math.max(...this.stations.map((s) => len(sub(s, this.centroid)))) + this.scl * 1.3;
    this.build();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas); this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  setProgress(p: number) { this.target = clamp(p, 0, this.n + 1); }
  snap(p: number) { this.target = this.p = clamp(p, 0, this.n + 1); }
  setPointer(x: number, y: number) { this.ptr.x = clamp(x, -1, 1); this.ptr.y = clamp(y, -1, 1); }

  dispose() {
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    const gl = this.gl;
    this.buffers.forEach((b) => gl.deleteBuffer(b));
    this.vaos.forEach((v) => gl.deleteVertexArray(v));
    [this.pts?.prog.p, this.cond?.prog.p].forEach((p) => p && gl.deleteProgram(p));
  }

  private build() {
    const gl = this.gl;
    // stations → one point buffer
    const pos: number[] = []; const meta: number[] = [];
    this.opts.archs.slice(0, this.n).forEach((arch, si) => {
      buildStation(arch, si + 1).forEach((pt) => {
        pos.push(pt.p[0], pt.p[1], pt.p[2]);
        meta.push(pt.order, pt.role, pt.seed, si);
      });
    });
    {
      const prog = compile(gl, VS_FIX, FS);
      const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
      this.buffers.push(buf(gl, prog.p, "aPos", new Float32Array(pos), 3), buf(gl, prog.p, "aMeta", new Float32Array(meta), 4));
      this.vaos.push(vao);
      this.pts = { prog, vao, count: pos.length / 3 };
    }
    // conduits between consecutive stations
    const from: number[] = []; const to: number[] = []; const seed: number[] = [];
    const per = 70;
    for (let i = 0; i < this.n - 1; i++) {
      const a = this.stations[i], b = this.stations[i + 1];
      for (let k = 0; k < per; k++) {
        from.push(a[0], a[1], a[2]); to.push(b[0], b[1], b[2]);
        seed.push(k / per, i + 0.0);
      }
    }
    {
      const prog = compile(gl, CONDUIT_VS, FS);
      const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
      this.buffers.push(
        buf(gl, prog.p, "aFrom", new Float32Array(from), 3),
        buf(gl, prog.p, "aTo", new Float32Array(to), 3),
        buf(gl, prog.p, "aSeed", new Float32Array(seed), 2)
      );
      this.vaos.push(vao);
      this.cond = { prog, vao, count: from.length / 3 };
    }
    gl.bindVertexArray(null);
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    this.time += dt * (this.opts.reduced ? 0.3 : 1);
    this.p += (this.target - this.p) * Math.min(1, dt * 4.5);
    this.ptr.sx += (this.ptr.x - this.ptr.sx) * Math.min(1, dt * 3);
    this.ptr.sy += (this.ptr.y - this.ptr.sy) * Math.min(1, dt * 3);
    this.render();
  };

  private station(i: number): V3 {
    const c = clamp(i, 0, this.n - 1);
    const a = Math.floor(c), b = Math.min(this.n - 1, a + 1), f = c - a;
    const s0 = this.stations[a], s1 = this.stations[b];
    return [mix(s0[0], s1[0], f), mix(s0[1], s1[1], f), mix(s0[2], s1[2], f)];
  }

  render() {
    const gl = this.gl;
    const p = this.p;
    const N = this.n;
    const narrow = this.w < 900;

    const active = clamp(p - 1, 0, N - 1);
    const hero = 1 - smooth(0, 1, p);
    const outro = smooth(N, N + 1, p);
    const dissolve = outro;
    const focus = (1 - hero) * (1 - outro);

    // camera travels the path
    const tgtFocus = this.station(active);
    const target: V3 = [
      mix(tgtFocus[0], this.centroid[0], Math.max(hero, outro)),
      mix(tgtFocus[1], this.centroid[1], Math.max(hero, outro)),
      mix(tgtFocus[2], this.centroid[2], Math.max(hero, outro)),
    ];
    const fit = this.span / Math.tan(0.72 / 2) * (narrow ? 1.05 : 0.72);
    const focusD = narrow ? 4.3 : 3.4;
    const heroD = fit;
    const outroD = fit * 1.18;
    const D = mix(mix(focusD, heroD, hero), outroD, outro);
    const az = 0.5 + p * 0.22 + this.time * 0.05 * (hero + outro) + this.ptr.sx * 0.35;
    const elev = mix(0.34, 0.5, hero) + this.ptr.sy * 0.1;
    const eye: V3 = [
      target[0] + Math.sin(az) * Math.cos(elev) * D,
      target[1] + Math.sin(elev) * D,
      target[2] + Math.cos(az) * Math.cos(elev) * D,
    ];
    const off = narrow ? 0 : mix(0.26, 0.05, hero) * (1 - outro);
    this.proj = perspective(0.72, this.w / this.h, 0.1, 100, off);
    this.view = lookAt(eye, target);
    const mvp = mul(this.proj, this.view);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    const px = this.dpr * this.h * 0.011;

    // conduits
    {
      const { prog, vao, count } = this.cond;
      gl.useProgram(prog.p); gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(prog.u.uProj, false, this.proj);
      gl.uniformMatrix4fv(prog.u.uView, false, this.view);
      gl.uniform1f(prog.u.uTime, this.time);
      gl.uniform1f(prog.u.uPx, px);
      gl.uniform1f(prog.u.uActive, active);
      gl.uniform1f(prog.u.uDissolve, dissolve);
      gl.uniform1f(prog.u.uCount, N);
      gl.uniform1f(prog.u.uHero, hero);
      gl.uniform3fv(prog.u.uAccentC, ACCENT);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    // stations
    {
      const { prog, vao, count } = this.pts;
      gl.useProgram(prog.p); gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(prog.u.uProj, false, this.proj);
      gl.uniformMatrix4fv(prog.u.uView, false, this.view);
      gl.uniform1f(prog.u.uTime, this.time);
      gl.uniform1f(prog.u.uPx, px);
      gl.uniform1f(prog.u.uActive, active);
      gl.uniform1f(prog.u.uDissolve, dissolve);
      gl.uniform1f(prog.u.uHero, hero);
      gl.uniform3fv(prog.u.uAccentC, ACCENT);
      const ctr = new Float32Array(MAX_ST * 3), scl = new Float32Array(MAX_ST), arch = new Float32Array(MAX_ST);
      for (let i = 0; i < N; i++) {
        ctr[i * 3] = this.stations[i][0]; ctr[i * 3 + 1] = this.stations[i][1]; ctr[i * 3 + 2] = this.stations[i][2];
        const nearness = Math.max(1 - smooth(0, 1.1, Math.abs(active - i)), hero * 0.6);
        scl[i] = this.scl * (0.8 + 0.3 * nearness);
        arch[i] = this.opts.archs[i];
      }
      gl.uniform3fv(prog.u.uCtr, ctr);
      gl.uniform1fv(prog.u.uScl, scl);
      gl.uniform1fv(prog.u.uArch, arch);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    gl.bindVertexArray(null);
    gl.depthMask(true);

    // labels at each station centre
    const labels: LabelPos[] = this.stations.map((s, i) => {
      const nearness = 1 - smooth(0, 1.1, Math.abs(active - i));
      const c = project(mvp, [s[0], s[1] + this.scl * 1.1, s[2]]);
      const x = ((c[0] / c[3]) * 0.5 + 0.5) * this.w;
      const y = (1 - ((c[1] / c[3]) * 0.5 + 0.5)) * this.h;
      const vis = c[3] > 0 ? (focus > 0.4 ? nearness : 0.5) * (1 - dissolve) : 0;
      return { x, y, vis };
    });
    this.opts.onFrame?.(labels, { focus, active, dissolve, p });
  }
}
