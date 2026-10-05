"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { animate } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

/** One big number that counts up (anime.js) when it scrolls into view. */
export default function StatCounter({
  value,
  prefix = "",
  suffix = "",
  caption,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  caption: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setN(value);
      return;
    }
    const o = { v: 0 };
    const a = animate(o, {
      v: value,
      duration: 1800,
      ease: "outExpo",
      onUpdate: () => setN(Math.round(o.v)),
    });
    return () => {
      a.pause();
    };
  }, [inView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <span aria-hidden="true" className="text-[clamp(96px,13vw,200px)] font-semibold leading-none tracking-[-0.06em] tabular-nums">
        {prefix}
        {n}
        <span className="text-accent">{suffix || "."}</span>
      </span>
      <span aria-hidden="true" className="label mt-5 !text-fg/80">{caption}</span>
      <span className="sr-only">
        {prefix}
        {value}
        {suffix} {caption}
      </span>
    </div>
  );
}
