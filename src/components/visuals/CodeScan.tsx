"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, createTimeline, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

const ROWS = 14;
const TOP = 30;
const RH = 18; // row height
const LEFT = 54;
const W = 300;
// Deterministic line widths + indents + which lines are flagged (SSR-safe)
const LINES = Array.from({ length: ROWS }, (_, i) => {
  const indent = [0, 1, 2, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 1][i] ?? 1;
  const width = [120, 180, 90, 150, 70, 160, 110, 140, 80, 130, 100, 170, 95, 120][i] ?? 120;
  return { indent: indent * 12, width };
});
const FLAGS = [3, 8]; // rows flagged as findings
const TAGS = ["CWE-89", "CWE-79"];

/**
 * Vulnerability scanner, as a motion graphic: a scan line sweeps down a block
 * of source, each line checks off as it passes, and a couple come back flagged
 * with a CWE tag. anime.js drives the sweep, the ticks and the findings.
 */
export default function CodeScan() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || prefersReducedMotion()) return;

    const scan = el.querySelector("[data-scan]");
    const rows = el.querySelectorAll("[data-row]");
    const ticks = el.querySelectorAll("[data-tick]");
    const flags = el.querySelectorAll("[data-flag]");
    const count = el.querySelector("[data-count]") as SVGTextElement | null;

    const tl = createTimeline({ loop: true });
    const H = ROWS * RH;
    tl.add(scan as Element, { translateY: [0, H], duration: 2800, ease: "inOutSine" }, 0)
      .add(rows, { opacity: [0.28, 1], duration: 260, delay: stagger(2800 / ROWS) }, 0)
      .add(ticks, { opacity: [0, 1], scale: [0.4, 1], duration: 240, delay: stagger(2800 / ROWS), ease: "outBack(3)" }, 120);
    FLAGS.forEach((rowIdx, i) => {
      const at = (rowIdx / ROWS) * 2800 + 160;
      tl.add(flags[i], { opacity: [0, 1], translateX: [-6, 0], duration: 360, ease: "outBack(2)" }, at);
      tl.add({}, { duration: 1, onBegin: () => { if (count) count.textContent = String(i + 1); } }, at);
    });
    tl.add({}, { duration: 1, onBegin: () => { if (count) count.textContent = "0"; } }, 0);
    tl.add({}, { duration: 600 });
    // reset for next sweep
    tl.add(flags, { opacity: 0, duration: 1 }, 0);

    return () => tl.pause();
  }, [inView]);

  const H = ROWS * RH;

  return (
    <svg ref={ref} viewBox={`0 0 ${LEFT + W + 70} ${TOP + H + 24}`} style={{ width: "min(460px, 100%, 56svh)" }} role="img" aria-label="A scan line sweeping down source code and flagging findings">
      {/* window frame */}
      <rect x="6" y="6" width={LEFT + W + 58} height={TOP + H + 12} rx="12" fill="#0e0e0d" stroke="#24231f" strokeWidth="1" />
      <circle cx="24" cy="20" r="3" fill="#3a3833" />
      <circle cx="36" cy="20" r="3" fill="#3a3833" />
      <circle cx="48" cy="20" r="3" fill="#3a3833" />
      <text x={LEFT + W + 52} y="24" textAnchor="end" fill="#8b8982" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.12em" }}>
        scanner.py
      </text>

      {LINES.map((ln, i) => {
        const y = TOP + i * RH + RH / 2;
        const flagIdx = FLAGS.indexOf(i);
        return (
          <g key={i} data-row style={{ opacity: 0.28 }}>
            <text x={LEFT - 12} y={y + 3} textAnchor="end" fill="#55534e" style={{ font: "10px var(--font-geist-mono), monospace" }}>
              {i + 1}
            </text>
            <rect x={LEFT + ln.indent} y={y - 3} width={ln.width} height="5" rx="2.5" fill={flagIdx >= 0 ? "#ff5a1f" : "#55534e"} opacity={flagIdx >= 0 ? 0.9 : 0.6} />
            {flagIdx < 0 && <path data-tick d={`M${LEFT + W + 14} ${y} l3 3 l6 -7`} fill="none" stroke="#8b8982" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }} />}
            {flagIdx >= 0 && (
              <g data-flag style={{ opacity: 0 }}>
                <rect x={LEFT + W + 8} y={y - 7} width="54" height="14" rx="3" fill="#ff5a1f" />
                <text x={LEFT + W + 35} y={y + 3} textAnchor="middle" fill="#0b0b0c" style={{ font: "600 9px var(--font-geist-mono), monospace" }}>
                  {TAGS[flagIdx]}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* scan line */}
      <g data-scan>
        <rect x={LEFT - 18} y={TOP} width={W + 86} height="2" fill="#ff5a1f" opacity="0.9" />
        <rect x={LEFT - 18} y={TOP - 10} width={W + 86} height="10" fill="#ff5a1f" opacity="0.06" />
      </g>

      {/* findings counter */}
      <text x={LEFT - 18} y={TOP + H + 18} fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.12em" }}>
        FINDINGS&nbsp;&nbsp;<tspan data-count fill="#ff5a1f">0</tspan>
      </text>
    </svg>
  );
}
