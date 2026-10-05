"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger, svg } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

const W = 360;
const ROW = 62;

/**
 * Zig-zag pipeline drawn with anime.js: the spine draws in, steps fade up,
 * then a pulse travels the path on a loop. Used for RAG, agents, etc.
 */
export default function Pipeline({ steps, label }: { steps: { label: string; sub: string }[]; label: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const H = steps.length * ROW;

  const points = steps.map((_, i) => ({ x: i % 2 === 0 ? 70 : W - 70, y: ROW / 2 + i * ROW }));
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    const nodes = el.querySelectorAll<SVGGElement>("[data-step]");
    const spine = el.querySelector<SVGPathElement>("[data-spine]");

    if (prefersReducedMotion() || !spine) {
      nodes.forEach((n) => (n.style.opacity = "1"));
      return;
    }

    animate(svg.createDrawable(spine), { draw: ["0 0", "0 1"], duration: 1800, ease: "inOutQuart" });
    animate(nodes, { opacity: [0, 1], translateY: [10, 0], duration: 700, delay: stagger(160), ease: "outExpo" });

  }, [inView]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "min(420px, 100%, 54svh)" }}
      role="img"
      aria-label={label}
    >
      <path data-spine d={d} fill="none" stroke="#3a3833" strokeWidth="1" />
      {steps.map((s, i) => {
        const p = points[i];
        const left = i % 2 === 0;
        return (
          <g key={s.label} data-step style={{ opacity: 0 }}>
            <circle cx={p.x} cy={p.y} r="6" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1" />
            <text
              x={left ? p.x + 18 : p.x - 18}
              y={p.y - 2}
              textAnchor={left ? "start" : "end"}
              fill="#ecebe6"
              style={{ font: "500 15px var(--font-geist), sans-serif" }}
            >
              {s.label}
            </text>
            <text
              x={left ? p.x + 18 : p.x - 18}
              y={p.y + 15}
              textAnchor={left ? "start" : "end"}
              fill="#8b8982"
              style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {s.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
