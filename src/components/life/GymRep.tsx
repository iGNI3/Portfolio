"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger, svg } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

/* ── Rig ─────────────────────────────────────────────────────
   An original, intermediate-muscular lifter drawn in flat shapes.
   The arms are a real two-bone IK rig: anime.js animates the bar
   height, and every frame we solve shoulder + elbow angles so the
   hands stay locked on the bar.                                  */
const CX = 180;
const GROUND = 304;
const SHOULDER = { l: { x: 147, y: 140 }, r: { x: 213, y: 140 } };
const GRIP = 27; // hands sit this far outside the shoulders
const L1 = 44; // upper arm
const L2 = 42; // forearm
const RACK_Y = 128;
const LOCK_Y = SHOULDER.r.y - Math.sqrt((L1 + L2 - 1) ** 2 - GRIP ** 2);
const REP_MS = 2400;
const UP_MS = 900;
const BPM = [112, 118, 124, 131, 127, 134, 140, 136, 129, 121];
const COLS = 9;
const ROWS = 8;

const ECG = (() => {
  let d = "M0 60";
  for (let i = 0; i < 3; i++) {
    const x = i * 80;
    d += ` L${x + 18} 60 L${x + 26} 52 L${x + 32} 60 L${x + 38} 60 L${x + 43} 74 L${x + 49} 16 L${x + 55} 84 L${x + 60} 60 L${x + 80} 60`;
  }
  return d;
})();

const deg = (r: number) => (r * 180) / Math.PI;

/** Two-bone IK: returns shoulder angle and relative elbow angle (degrees). */
function solve(S: { x: number; y: number }, H: { x: number; y: number }, outward: 1 | -1) {
  const dx = H.x - S.x;
  const dy = H.y - S.y;
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(L1 - L2) + 0.01), L1 + L2 - 0.01);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const px = S.x + (a * dx) / d;
  const py = S.y + (a * dy) / d;
  const e1 = { x: px - (h * dy) / d, y: py + (h * dx) / d };
  const e2 = { x: px + (h * dy) / d, y: py - (h * dx) / d };
  const E = (e1.x - e2.x) * outward > 0 ? e1 : e2; // elbow flares outward
  const up = Math.atan2(E.y - S.y, E.x - S.x);
  const fore = Math.atan2(H.y - E.y, H.x - E.x);
  return { up: deg(up), rel: deg(fore - up), hand: H };
}

// Rack pose computed once so server and client render identical transforms
const INIT = (["l", "r"] as const).reduce(
  (acc, side) => {
    const S = SHOULDER[side];
    const out = side === "r" ? 1 : -1;
    const { up, rel } = solve(S, { x: S.x + out * GRIP, y: RACK_Y }, out);
    acc[side] = { sh: `translate(${S.x} ${S.y}) rotate(${up.toFixed(2)})`, el: `translate(${L1} 0) rotate(${rel.toFixed(2)})` };
    return acc;
  },
  {} as Record<"l" | "r", { sh: string; el: string }>
);

function Arm({ side }: { side: "l" | "r" }) {
  return (
    <g data-shoulder={side} transform={INIT[side].sh}>
      {/* upper arm with a bicep bulge */}
      <path d="M0 -11 Q 20 -17 44 -8 L 44 8 Q 22 15 0 11 Z" fill="#ecebe6" />
      <path data-def d="M8 2 Q 22 6 36 3" fill="none" stroke="#3a3833" strokeWidth="1.2" strokeLinecap="round" />
      <g data-elbow={side} transform={INIT[side].el}>
        <path d="M0 -8 Q 14 -11 42 -6 L 42 6 Q 14 10 0 8 Z" fill="#ecebe6" />
        <path data-def d="M6 -2 Q 18 -4 30 -2" fill="none" stroke="#3a3833" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </g>
  );
}

export default function GymRep() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const shoulders = { l: el.querySelector('[data-shoulder="l"]'), r: el.querySelector('[data-shoulder="r"]') };
    const elbows = { l: el.querySelector('[data-elbow="l"]'), r: el.querySelector('[data-elbow="r"]') };
    const hands = { l: el.querySelector('[data-hand="l"]'), r: el.querySelector('[data-hand="r"]') };
    const bar = el.querySelector("[data-barbell]");

    const pose = (y: number) => {
      (["l", "r"] as const).forEach((side) => {
        const S = SHOULDER[side];
        const out = side === "r" ? 1 : -1;
        const { up, rel, hand } = solve(S, { x: S.x + out * GRIP, y }, out);
        shoulders[side]?.setAttribute("transform", `translate(${S.x} ${S.y}) rotate(${up.toFixed(2)})`);
        elbows[side]?.setAttribute("transform", `translate(${L1} 0) rotate(${rel.toFixed(2)})`);
        hands[side]?.setAttribute("cx", hand.x.toFixed(1));
        hands[side]?.setAttribute("cy", hand.y.toFixed(1));
      });
      bar?.setAttribute("transform", `translate(0 ${(y - RACK_Y).toFixed(2)})`);
    };

    pose(RACK_Y);
    if (!inView || prefersReducedMotion()) return;

    const q = (s: string) => el.querySelectorAll(s);
    const bar$ = { y: RACK_Y };

    const press = animate(bar$, {
      y: [
        { to: LOCK_Y, duration: UP_MS, ease: "inOutQuad" },
        { to: LOCK_Y, duration: 250 },
        { to: RACK_Y, duration: REP_MS - UP_MS - 250, ease: "inOutSine" },
      ],
      loop: true,
      onUpdate: () => pose(bar$.y),
    });

    const trace = el.querySelector<SVGPathElement>("[data-ecg]");
    const loops = [
      press,
      animate(q("[data-breathe]"), { scaleY: [1, 1.012, 1], duration: REP_MS / 2, ease: "inOutSine", loop: true }),
    ];
    if (trace) loops.push(animate(svg.createDrawable(trace), { draw: ["0 0", "0 1", "1 1"], duration: REP_MS, ease: "linear", loop: true }));

    // Every lockout: anime.js signature moments
    const reps = el.querySelector("[data-reps]");
    const set = el.querySelector("[data-set]");
    const bpm = el.querySelector("[data-bpm]");
    let n = 0;
    let s = 1;
    const lockout = () => {
      n += 1;
      if (n > 10) {
        n = 1;
        s = (s % 4) + 1;
      }
      if (reps) reps.textContent = String(n).padStart(2, "0");
      if (set) set.textContent = `SET ${s} OF 4`;
      if (bpm) bpm.textContent = String(BPM[(n + s) % BPM.length]);
      // grid ripple from the centre, like the anime.js homepage
      animate(q("[data-dot]"), { scale: [1, 2.4, 1], opacity: [0.18, 0.9, 0.18], duration: 900, delay: stagger(45, { grid: [COLS, ROWS], from: "center" }), ease: "outQuad" });
      // rep number pops with an elastic spring
      if (reps) animate(reps, { scale: [1.25, 1], translateY: [-8, 0], duration: 900, ease: "outElastic(1, .45)" });
      // plates wobble, muscles "flex"
      animate(q("[data-plate]"), { scaleY: [1.12, 1], duration: 700, ease: "outElastic(1, .35)", delay: stagger(40) });
      animate(q("[data-def]"), { stroke: ["#ff5a1f", "#3a3833"], duration: 800, delay: stagger(30), ease: "outQuad" });
      // a little effort sweat
      if (n % 3 === 0) animate(q("[data-sweat]"), { translateY: [0, 26], opacity: [0, 1, 0], duration: 900, delay: stagger(140), ease: "inQuad" });
    };
    let interval = 0;
    const first = window.setTimeout(() => {
      lockout();
      interval = window.setInterval(lockout, REP_MS);
    }, UP_MS);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      loops.forEach((l) => l.pause());
    };
  }, [inView]);

  const def = { fill: "none", stroke: "#3a3833", strokeWidth: 1.3, strokeLinecap: "round" as const };

  return (
    <svg ref={ref} viewBox="0 0 560 320" className="w-full" role="img" aria-label="A muscular lifter doing overhead presses, with a rep counter and heart-rate trace">
      {/* anime.js-style stagger grid */}
      {Array.from({ length: COLS * ROWS }, (_, i) => (
        <circle
          key={i}
          data-dot
          cx={52 + (i % COLS) * 32}
          cy={40 + Math.floor(i / COLS) * 34}
          r="2"
          fill="#ecebe6"
          opacity="0.18"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
      <line x1="40" y1={GROUND} x2="320" y2={GROUND} stroke="#24231f" strokeWidth="1" />

      {/* ── Lifter ── */}
      <g data-breathe style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* legs */}
        <path d={`M${CX - 22} 236 Q ${CX - 30} 262 ${CX - 24} 276 L ${CX - 21} ${GROUND - 2} L ${CX - 7} ${GROUND - 2} L ${CX - 6} 276 Q ${CX - 2} 256 ${CX - 2} 238 Z`} fill="#ecebe6" />
        <path d={`M${CX + 22} 236 Q ${CX + 30} 262 ${CX + 24} 276 L ${CX + 21} ${GROUND - 2} L ${CX + 7} ${GROUND - 2} L ${CX + 6} 276 Q ${CX + 2} 256 ${CX + 2} 238 Z`} fill="#ecebe6" />
        <path data-def d={`M${CX - 20} 248 Q ${CX - 16} 262 ${CX - 12} 270 M${CX + 20} 248 Q ${CX + 16} 262 ${CX + 12} 270`} {...def} />
        {/* shoes */}
        <rect x={CX - 27} y={GROUND - 6} width="22" height="7" rx="3" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.2" />
        <rect x={CX + 5} y={GROUND - 6} width="22" height="7" rx="3" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.2" />
        {/* shorts */}
        <path d={`M${CX - 24} 206 L ${CX + 24} 206 L ${CX + 28} 244 L ${CX + 2} 246 L ${CX} 232 L ${CX - 2} 246 L ${CX - 28} 244 Z`} fill="#ff5a1f" />

        {/* V-taper torso */}
        <path d={`M${CX - 36} 128 Q ${CX - 40} 150 ${CX - 22} 178 L ${CX - 21} 206 L ${CX + 21} 206 L ${CX + 22} 178 Q ${CX + 40} 150 ${CX + 36} 128 Q ${CX} 118 ${CX - 36} 128 Z`} fill="#ecebe6" />
        {/* pecs */}
        <path data-def d={`M${CX - 30} 138 Q ${CX - 16} 156 ${CX - 2} 150 M${CX + 30} 138 Q ${CX + 16} 156 ${CX + 2} 150 M${CX} 132 L ${CX} 152`} {...def} />
        {/* abs */}
        {[160, 172, 184].map((y) => (
          <g key={y}>
            <rect data-def x={CX - 11} y={y} width="9" height="9" rx="3" {...def} />
            <rect data-def x={CX + 2} y={y} width="9" height="9" rx="3" {...def} />
          </g>
        ))}
        {/* obliques */}
        <path data-def d={`M${CX - 22} 166 Q ${CX - 18} 182 ${CX - 19} 198 M${CX + 22} 166 Q ${CX + 18} 182 ${CX + 19} 198`} {...def} />
        {/* lifting belt */}
        <rect x={CX - 23} y="198" width="46" height="10" rx="2" fill="#24231f" stroke="#0b0b0c" strokeWidth="1" />
        <rect x={CX - 5} y="199" width="10" height="8" rx="1" fill="none" stroke="#8b8982" strokeWidth="1.2" />

        {/* traps + neck */}
        <path d={`M${CX - 8} 108 L ${CX + 8} 108 L ${CX + 10} 124 Q ${CX + 24} 124 ${CX + 34} 129 L ${CX - 34} 129 Q ${CX - 24} 124 ${CX - 10} 124 Z`} fill="#ecebe6" />
        {/* deltoids */}
        <circle cx={SHOULDER.l.x} cy={SHOULDER.l.y - 4} r="13" fill="#ecebe6" />
        <circle cx={SHOULDER.r.x} cy={SHOULDER.r.y - 4} r="13" fill="#ecebe6" />
        <path data-def d={`M${SHOULDER.l.x - 6} ${SHOULDER.l.y - 12} Q ${SHOULDER.l.x - 11} ${SHOULDER.l.y - 2} ${SHOULDER.l.x - 4} ${SHOULDER.l.y + 7} M${SHOULDER.r.x + 6} ${SHOULDER.r.y - 12} Q ${SHOULDER.r.x + 11} ${SHOULDER.r.y - 2} ${SHOULDER.r.x + 4} ${SHOULDER.r.y + 7}`} {...def} />

        {/* head: original character, spiky hair + orange headband */}
        <ellipse cx={CX} cy="92" rx="14" ry="16" fill="#ecebe6" />
        <path d={`M${CX - 16} 88 L ${CX - 19} 70 L ${CX - 10} 78 L ${CX - 8} 62 L ${CX - 1} 75 L ${CX + 5} 60 L ${CX + 8} 76 L ${CX + 17} 66 L ${CX + 16} 86 Q ${CX} 76 ${CX - 16} 88 Z`} fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x={CX - 15} y="82" width="30" height="5" rx="2" fill="#ff5a1f" />
        <path d={`M${CX + 14} 84 Q ${CX + 24} 80 ${CX + 28} 88`} fill="none" stroke="#ff5a1f" strokeWidth="2.4" strokeLinecap="round" />
        {/* determined eyes + brows */}
        <path d={`M${CX - 9} 92 L ${CX - 3} 94 M${CX + 9} 92 L ${CX + 3} 94`} stroke="#0b0b0c" strokeWidth="1.8" strokeLinecap="round" />
        <path d={`M${CX - 4} 102 Q ${CX} 104 ${CX + 4} 102`} fill="none" stroke="#3a3833" strokeWidth="1.2" strokeLinecap="round" />
        {/* sweat */}
        {[0, 1, 2].map((i) => (
          <path key={i} data-sweat d={`M${CX + 18 + i * 5} ${90 + i * 4} q 2 4 0 6 q -2 -2 0 -6 Z`} fill="#8b8982" opacity="0" />
        ))}
      </g>

      {/* arms (IK-driven) */}
      <Arm side="l" />
      <Arm side="r" />

      {/* barbell */}
      <g data-barbell>
        <line x1="88" y1={RACK_Y} x2="272" y2={RACK_Y} stroke="#ecebe6" strokeWidth="3.2" strokeLinecap="round" />
        {[98, 110, 250, 262].map((x, i) => (
          <rect
            key={i}
            data-plate
            x={x - 5}
            y={RACK_Y - (i === 0 || i === 3 ? 26 : 19)}
            width="10"
            height={i === 0 || i === 3 ? 52 : 38}
            rx="2"
            fill={i === 0 || i === 3 ? "#ff5a1f" : "#0b0b0c"}
            stroke={i === 0 || i === 3 ? "none" : "#ecebe6"}
            strokeWidth="1.5"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        ))}
      </g>
      {/* fists on top of the bar */}
      <circle data-hand="l" r="7" cx={SHOULDER.l.x - GRIP} cy={RACK_Y} fill="#ecebe6" stroke="#3a3833" strokeWidth="1.2" />
      <circle data-hand="r" r="7" cx={SHOULDER.r.x + GRIP} cy={RACK_Y} fill="#ecebe6" stroke="#3a3833" strokeWidth="1.2" />

      {/* rep counter */}
      <text data-set x="344" y="72" fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>
        SET 1 OF 4
      </text>
      <text data-reps x="340" y="154" fill="#ecebe6" style={{ font: "600 84px var(--font-geist), sans-serif", letterSpacing: "-0.06em", transformBox: "fill-box", transformOrigin: "left bottom" }}>
        00
      </text>
      <text x="344" y="178" fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>
        REPS
      </text>

      {/* heart-rate monitor */}
      <g transform="translate(330 202)">
        <rect x="0" y="0" width="220" height="70" rx="10" fill="#0e0e0d" stroke="#24231f" />
        <g transform="translate(2 -4) scale(0.9 0.9)">
          <path d={ECG} fill="none" stroke="#2a2925" strokeWidth="1.4" />
          <path data-ecg d={ECG} fill="none" stroke="#ff5a1f" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
        <text x="208" y="20" textAnchor="end" fill="#8b8982" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.12em" }}>
          BPM <tspan data-bpm fill="#ecebe6">112</tspan>
        </text>
      </g>
    </svg>
  );
}
