/* ──────────────────────────────────────────────────────────────
   Pipeline geometry for the case-study journey.

   A project is NOT a stack of blocks. It's a pipeline: each stage is
   its own 3D structure (a station), the stations sit on a path that is
   unique to that project, and conduits of light flow from one to the
   next. The camera travels the path as you scroll.

   Everything is drawn as glowing points — structure sampled densely
   along lines and curves, brighter points for nodes. One additive
   point program renders the whole thing, which keeps it holographic
   and avoids thin-line artefacts. This module only produces numbers;
   PipelineScene renders them.

   Each point carries: position (xyz), `order` (0..1 — when it appears
   as a station assembles / its param along a stroke), `role`
   (0 structure · 1 node/accent · 2 moving) and a `seed`.
   ────────────────────────────────────────────────────────────── */

export const ARCH = {
  scan: 0,
  web: 1,
  core: 2,
  pick: 3,
  gate: 4,
  ledger: 5,
  fan: 6,
  wave: 7,
} as const;
export type ArchName = keyof typeof ARCH;
export const archId = (n?: string): number => (n && n in ARCH ? ARCH[n as ArchName] : ARCH.web);

export type LayoutName = "orbit" | "fork" | "funnel" | "conveyor" | "scurve";

// the stage "motif" names used in site.ts map to 3D station archetypes
const MOTIF_ARCH: Record<string, number> = {
  radar: ARCH.scan, graph: ARCH.web, ingest: ARCH.core, select: ARCH.pick,
  gate: ARCH.gate, report: ARCH.ledger, split: ARCH.fan, wave: ARCH.wave,
};
export const motifArch = (motif?: string): number => (motif && motif in MOTIF_ARCH ? MOTIF_ARCH[motif] : ARCH.web);

export type V3 = [number, number, number];
export type StationPt = { p: V3; order: number; role: number; seed: number };

/* deterministic PRNG */
function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const push = (out: StationPt[], p: V3, order: number, role: number, seed: number) => out.push({ p, order, role, seed });

// sample a straight stroke a→b as beaded points
function stroke(out: StationPt[], a: V3, b: V3, n: number, role: number, R: () => number, o0 = 0, o1 = 1) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    push(out, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], o0 + (o1 - o0) * t, role, R());
  }
}

// a circle in the XZ plane (flat disc) or XY plane
function ring(out: StationPt[], r: number, n: number, role: number, R: () => number, plane: "xz" | "xy" = "xz", y = 0, order = 0) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a) * r;
    const s = Math.sin(a) * r;
    push(out, plane === "xz" ? [c, y, s] : [c, s, y], order, role, R());
  }
}

/* ── archetype builders — each centred on origin, ~1 unit scale ── */

function aScan(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  ring(o, 0.5, 60, 0, R, "xz", 0, 0.1);
  ring(o, 0.85, 90, 0, R, "xz", 0, 0.3);
  ring(o, 1.1, 110, 0, R, "xz", 0, 0.5);
  // sweep arm (animated by role 2 — rotates in shader)
  stroke(o, [0, 0, 0], [1.1, 0, 0], 40, 2, R, 0, 1);
  // ping targets scattered on the disc
  for (let i = 0; i < 7; i++) {
    const a = R() * Math.PI * 2;
    const r = 0.35 + R() * 0.72;
    push(o, [Math.cos(a) * r, 0, Math.sin(a) * r], 0.6 + 0.4 * R(), 1, R());
  }
  return o;
}

function aWeb(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  const N = 11;
  const nodes: V3[] = [];
  for (let i = 0; i < N; i++) {
    // points on a rough sphere (fibonacci)
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const ph = i * 2.399963;
    nodes.push([Math.cos(ph) * r * 0.95, y * 0.95, Math.sin(ph) * r * 0.95]);
  }
  nodes.forEach((n, i) => push(o, n, 0.2 + 0.8 * (i / N), 1, R()));
  // wire nearest neighbours
  let e = 0;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1], nodes[i][2] - nodes[j][2]);
      if (d < 1.15 && e < 18) {
        stroke(o, nodes[i], nodes[j], 12, 0, R, 0.2 + 0.7 * (e / 18), 1);
        e++;
      }
    }
  return o;
}

function aCore(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  // dense core shell
  for (let i = 0; i < 160; i++) {
    const u = R() * 2 - 1;
    const a = R() * Math.PI * 2;
    const r = 0.42 + R() * 0.05;
    const s = Math.sqrt(1 - u * u);
    push(o, [Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], 0, 1, R());
  }
  // intake streams spiralling in (role 2 — animated inward)
  for (let i = 0; i < 90; i++) {
    const a = R() * Math.PI * 2;
    const r = 0.55 + R() * 0.8;
    const y = (R() * 2 - 1) * 0.7;
    push(o, [Math.cos(a) * r, y, Math.sin(a) * r], R(), 2, R());
  }
  return o;
}

function aPick(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  const K = 5;
  for (let k = 0; k < K; k++) {
    const x = (k - (K - 1) / 2) * 0.5;
    // card outline (rect in XY, facing camera)
    const w = 0.18;
    const h = 0.3;
    const corners: V3[] = [
      [x - w, -h, 0],
      [x + w, -h, 0],
      [x + w, h, 0],
      [x - w, h, 0],
    ];
    for (let c = 0; c < 4; c++) stroke(o, corners[c], corners[(c + 1) % 4], 8, 0, R, k / K, (k + 1) / K);
    // a node marking each card's slot
    push(o, [x, 0, 0], k / K, 1, k / K); // seed = normalized index so shader knows which card
  }
  return o;
}

function aGate(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  // a ring portal standing upright (XY plane)
  ring(o, 0.7, 120, 0, R, "xy", 0, 0.2);
  ring(o, 0.55, 90, 0, R, "xy", 0, 0.4);
  // a pulse that travels through the ring along Z (role 2)
  for (let i = 0; i < 40; i++) push(o, [(R() * 2 - 1) * 0.3, (R() * 2 - 1) * 0.3, 0], R(), 2, R());
  return o;
}

function aLedger(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const y = (r - (rows - 1) / 2) * 0.26;
    const len = 0.5 + 0.45 * ((r * 7) % 5) / 5;
    stroke(o, [-0.6, y, 0], [-0.6 + len * 1.2, y, 0], 26, r === 0 ? 1 : 0, R, r / rows, (r + 1) / rows);
  }
  // frame
  stroke(o, [-0.68, -0.72, 0], [-0.68, 0.72, 0], 20, 0, R, 0, 0.3);
  return o;
}

function aFan(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  const hub: V3 = [-0.1, 0, 0];
  stroke(o, [-0.95, 0, 0], hub, 24, 0, R, 0, 0.45);
  push(o, hub, 0.45, 1, 0);
  const ends: V3[] = [
    [0.9, 0.55, 0.15],
    [0.95, 0.18, -0.2],
    [0.95, -0.18, 0.2],
    [0.9, -0.55, -0.15],
  ];
  ends.forEach((e, i) => {
    stroke(o, hub, e, 20, 0, R, 0.45, 1);
    push(o, e, 0.95, 1, 0.4 + i * 0.1);
  });
  return o;
}

function aWave(R: () => number): StationPt[] {
  const o: StationPt[] = [];
  for (let s = 0; s < 3; s++) {
    const n = 90;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      push(o, [x, 0, (s - 1) * 0.25], i / n, 2, s * 0.33 + 0.01); // role 2 + seed=strand → animated as wave in shader
    }
  }
  return o;
}

export function buildStation(arch: number, seed: number): StationPt[] {
  const R = rng(seed * 2654435761 + 17);
  switch (arch) {
    case ARCH.scan: return aScan(R);
    case ARCH.web: return aWeb(R);
    case ARCH.core: return aCore(R);
    case ARCH.pick: return aPick(R);
    case ARCH.gate: return aGate(R);
    case ARCH.ledger: return aLedger(R);
    case ARCH.fan: return aFan(R);
    default: return aWave(R);
  }
}

/* ── per-project layout paths (where each station sits) ───────── */

export function layoutPath(name: LayoutName, n: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1); // 0..1 along the pipeline
    if (name === "orbit") {
      // stations on an arc sweeping around a centre, climbing gently
      const a = -1.1 + t * 2.2;
      out.push([Math.sin(a) * 3.4, (t - 0.5) * 1.6, Math.cos(a) * 3.4 - 3.4]);
    } else if (name === "fork") {
      // a trunk that forks: straight, then alternating offsets like a task graph
      const branch = i < 2 ? 0 : (i % 2 === 0 ? 1 : -1) * (1.0 + (i - 2) * 0.18);
      out.push([branch * 1.9, (0.5 - t) * 4.2, -t * 1.2]);
    } else if (name === "funnel") {
      // left→right, narrowing toward the centre line and pulling closer
      out.push([-4 + t * 8, Math.sin(t * Math.PI) * 0.5, (0.5 - Math.abs(t - 0.5)) * -2.2]);
    } else if (name === "conveyor") {
      // a descending diagonal belt
      out.push([-3.2 + t * 6.4, 2.0 - t * 4.0, -t * 2.0]);
    } else {
      // scurve
      out.push([(t - 0.5) * 6.5, Math.sin(t * Math.PI * 1.6) * 1.9, Math.cos(t * Math.PI) * 1.6 - 1.0]);
    }
  }
  return out;
}

export const stationScale = (name: LayoutName): number =>
  name === "funnel" || name === "conveyor" ? 0.82 : 0.95;
