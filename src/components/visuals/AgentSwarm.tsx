"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, createTimeline, stagger, svg } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

const CX = 90;
const CY = 150;
const AGENTS = [
  { label: "Planner", sub: "DAG", x: 250, y: 46 },
  { label: "Architect", sub: "design", x: 340, y: 110 },
  { label: "Coder", sub: "diffs", x: 340, y: 190 },
  { label: "Reviewer", sub: "critique", x: 250, y: 254 },
  { label: "QA", sub: "checks", x: 170, y: 150 },
];

/**
 * RefactoAI, as a motion graphic: one core request splits into five
 * specialised agents that branch out, work in parallel (their bars fill),
 * then merge back. anime.js draws the branches and runs the work pulses.
 */
export default function AgentSwarm() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || prefersReducedMotion()) return;

    const branches = el.querySelectorAll<SVGPathElement>("[data-branch]");
    const nodes = el.querySelectorAll("[data-agent]");
    const bars = el.querySelectorAll<SVGRectElement>("[data-work]");
    const packets = el.querySelectorAll<SVGCircleElement>("[data-packet]");
    const core = el.querySelector("[data-core]");
    if (!core) return;

    const corePulse = animate(core, { scale: [1, 1.12, 1], duration: 1600, loop: true, ease: "inOutSine", });

    const tl = createTimeline({ loop: true, defaults: { ease: "outQuart" } });
    // core emits → branches draw → agents appear → work → merge back
    tl.add(core as Element, { scale: [0.7, 1], opacity: [0.4, 1], duration: 500 }, 0);
    branches.forEach((b, i) => tl.add(svg.createDrawable(b), { draw: ["0 0", "0 1"], duration: 520 }, 300 + i * 120));
    tl.add(nodes, { opacity: [0, 1], scale: [0.3, 1], duration: 500, delay: stagger(120), ease: "outBack(2)" }, 500);
    tl.add(bars, { scaleX: [0, 1], duration: 900, delay: stagger(130), ease: "inOutQuad" }, 1000);
    // packets travel core → agents and back along each branch
    packets.forEach((p, i) => {
      const b = branches[i];
      if (b) tl.add(p, { ...svg.createMotionPath(b), opacity: [0, 1, 1, 0], duration: 1100, ease: "inOutSine" }, 2100 + i * 90);
    });
    tl.add(bars, { opacity: [1, 0.25], duration: 500 }, 3400);
    tl.add(nodes, { scale: [1, 0.92], opacity: [1, 0.5], duration: 500 }, 3400);
    tl.add({}, { duration: 500 });

    return () => {
      tl.pause();
      corePulse.pause();
    };
  }, [inView]);

  return (
    <svg ref={ref} viewBox="0 0 420 300" style={{ width: "min(460px, 100%, 56svh)" }} role="img" aria-label="One request splitting into five agents working in parallel, then merging">
      {/* branches */}
      {AGENTS.map((a, i) => (
        <path key={i} data-branch d={`M${CX} ${CY} C ${CX + 70} ${CY}, ${a.x - 70} ${a.y}, ${a.x} ${a.y}`} fill="none" stroke="#3a3833" strokeWidth="1" />
      ))}
      {/* packets */}
      {AGENTS.map((_, i) => (
        <circle key={i} data-packet r="3.5" cx="0" cy="0" fill="#ff5a1f" opacity="0" />
      ))}

      {/* core */}
      <g data-core style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx={CX} cy={CY} r="20" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="4" fill="#ff5a1f" />
        <text x={CX} y={CY + 36} textAnchor="middle" fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>
          REQUEST
        </text>
      </g>

      {/* agents */}
      {AGENTS.map((a, i) => {
        const left = a.x < CX + 140;
        return (
          <g key={i} data-agent style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }}>
            <circle cx={a.x} cy={a.y} r="6" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.3" />
            <text x={a.x + (left ? 12 : -12)} y={a.y - 2} textAnchor={left ? "start" : "end"} fill="#ecebe6" style={{ font: "500 14px var(--font-geist), sans-serif" }}>
              {a.label}
            </text>
            <text x={a.x + (left ? 12 : -12)} y={a.y + 12} textAnchor={left ? "start" : "end"} fill="#8b8982" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {a.sub}
            </text>
            {/* work bar */}
            <rect x={a.x + (left ? 12 : -52)} y={a.y + 18} width="40" height="3" rx="1.5" fill="#24231f" />
            <rect data-work x={a.x + (left ? 12 : -52)} y={a.y + 18} width="40" height="3" rx="1.5" fill="#ff5a1f" style={{ transformBox: "fill-box", transformOrigin: left ? "left center" : "left center" }} />
          </g>
        );
      })}
    </svg>
  );
}
