"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

const COLS = 14;
const ROWS = 14;

/**
 * anime.js grid stagger: a ripple runs out from wherever you point.
 * Abstract on purpose — reads as "a system working through a space".
 */
export default function DotGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  function ripple(from: number) {
    if (!ref.current || prefersReducedMotion()) return;
    animate(ref.current.querySelectorAll("[data-dot]"), {
      scale: [{ to: 1.9, duration: 220 }, { to: 1, duration: 700 }],
      opacity: [{ to: 1, duration: 220 }, { to: 0.35, duration: 900 }],
      backgroundColor: [{ to: "#ff5a1f", duration: 220 }, { to: "#ecebe6", duration: 900 }],
      delay: stagger(42, { grid: [COLS, ROWS], from }),
      ease: "outQuad",
    });
  }

  useEffect(() => {
    if (!inView) return;
    ripple(Math.floor((COLS * ROWS) / 2) + Math.floor(COLS / 2));
    const id = window.setInterval(() => ripple(Math.floor(Math.random() * COLS * ROWS)), 4200);
    return () => window.clearInterval(id);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="grid aspect-square gap-0"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, width: "min(420px, 100%, 52svh)" }}
      aria-hidden="true"
    >
      {Array.from({ length: COLS * ROWS }, (_, i) => (
        <button
          key={i}
          type="button"
          tabIndex={-1}
          onPointerEnter={() => ripple(i)}
          className="flex aspect-square items-center justify-center"
        >
          <span data-dot className="block h-[5px] w-[5px] rounded-full bg-fg opacity-35" />
        </button>
      ))}
    </div>
  );
}
