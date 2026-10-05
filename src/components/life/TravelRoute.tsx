"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger, svg } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

const W = 520;
const H = 340;

/**
 * An abstract travel line (not a real map): anime.js draws a wandering route
 * through each place, pins drop in one by one, and a dot keeps travelling it.
 */
export default function TravelRoute({ places }: { places: { name: string; note: string }[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  // Deterministic wandering layout: left → right, alternating heights
  const pts = places.map((_, i) => {
    const t = places.length === 1 ? 0.5 : i / (places.length - 1);
    const x = 50 + t * (W - 100);
    const wave = Math.sin(i * 1.9 + 0.6) * 0.55 + (i % 2 === 0 ? -0.25 : 0.25);
    const y = H / 2 + wave * (H * 0.36);
    // round so server and client render identical attributes (no hydration mismatch)
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  // Smooth curve through the points (Catmull-Rom → cubic Bézier)
  const d = pts
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const p0 = pts[i - 2] ?? pts[i - 1];
      const p1 = pts[i - 1];
      const p3 = pts[i + 1] ?? p;
      const c1x = p1.x + (p.x - p0.x) / 6;
      const c1y = p1.y + (p.y - p0.y) / 6;
      const c2x = p.x - (p3.x - p1.x) / 6;
      const c2y = p.y - (p3.y - p1.y) / 6;
      return `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ");

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    const route = el.querySelector<SVGPathElement>("[data-route]");
    const pins = el.querySelectorAll<SVGGElement>("[data-pin]");
    const dot = el.querySelector<SVGCircleElement>("[data-traveller]");
    if (!route || !dot) return;

    if (prefersReducedMotion()) {
      pins.forEach((p) => (p.style.opacity = "1"));
      return;
    }

    animate(svg.createDrawable(route), { draw: ["0 0", "0 1"], duration: 2200, ease: "inOutCubic" });
    animate(pins, {
      opacity: [0, 1],
      translateY: [-14, 0],
      duration: 900,
      delay: stagger(2200 / Math.max(places.length, 1), { start: 150 }),
      ease: "outElastic(1, .6)",
    });
    const travel = animate(dot, {
      ...svg.createMotionPath(route),
      duration: 7000,
      delay: 2300,
      loop: true,
      alternate: true,
      ease: "inOutSine",
    });
    return () => {
      travel.pause();
    };
  }, [inView, places.length]);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Places: ${places.map((p) => p.name).join(", ")}`}>
      {/* faint survey grid */}
      <g stroke="#1c1b18" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={(W / 8) * i} y1="0" x2={(W / 8) * i} y2={H} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(H / 5) * i} x2={W} y2={(H / 5) * i} />
        ))}
      </g>
      <path data-route d={d} fill="none" stroke="#ecebe6" strokeWidth="1.2" strokeDasharray="0" />
      <circle data-traveller r="5" cx="0" cy="0" fill="#ff5a1f" />
      {places.map((p, i) => {
        const pt = pts[i];
        const above = i % 2 === 0;
        return (
          <g key={`${p.name}-${i}`} data-pin style={{ opacity: 0 }}>
            <circle cx={pt.x} cy={pt.y} r="4" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.2" />
            <text
              x={pt.x}
              y={above ? pt.y - 16 : pt.y + 26}
              textAnchor="middle"
              fill="#ecebe6"
              style={{ font: "italic 18px var(--font-instrument), serif" }}
            >
              {p.name}
            </text>
            <text
              x={pt.x}
              y={above ? pt.y - 34 : pt.y + 42}
              textAnchor="middle"
              fill="#8b8982"
              style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              {String(i + 1).padStart(2, "0")} · {p.note}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
