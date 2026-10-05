"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

const LINES = [
  ["// one loop to drive them all", "c"],
  ["const lenis = new Lenis()", ""],
  ["lenis.on('scroll', ScrollTrigger.update)", ""],
  ["gsap.ticker.add(t => lenis.raf(t * 1000))", ""],
  ["", ""],
  ["// respect the reader", "c"],
  ["if (prefersReducedMotion()) return", ""],
] as const;

/** The actual snippet this site runs on, typed in line by line. */
export default function CodeCard() {
  const ref = useRef<HTMLPreElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const lines = ref.current.querySelectorAll<HTMLElement>("[data-ln]");
    if (prefersReducedMotion()) {
      lines.forEach((l) => (l.style.clipPath = "none"));
      return;
    }
    animate(lines, {
      clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
      duration: 900,
      delay: stagger(260),
      ease: "outQuart",
    });
  }, [inView]);

  return (
    <pre
      ref={ref}
      className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-line bg-raise p-6 font-mono text-[12.5px] leading-[1.9] text-fg/85"
      aria-label="Code sample: Lenis synced to the GSAP ticker"
    >
      {LINES.map(([t, kind], i) => (
        <span
          key={i}
          data-ln
          className={`block whitespace-pre ${kind === "c" ? "text-faint" : ""}`}
          style={{ clipPath: "inset(0 100% 0 0)" }}
        >
          <span className="mr-5 inline-block w-4 text-right text-faint">{i + 1}</span>
          {t || " "}
        </span>
      ))}
    </pre>
  );
}
