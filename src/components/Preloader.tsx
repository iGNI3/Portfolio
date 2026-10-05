"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { site } from "@/content/site";
import { prefersReducedMotion } from "@/lib/scroll";

/**
 * Short counter intro (≈1.6s). Skipped entirely for reduced-motion users
 * and on repeat visits within the same tab session.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("intro-seen") === "1";
    } catch {}

    if (prefersReducedMotion() || seen) {
      onDone();
      return;
    }

    const counter = { v: 0 };
    const a = animate(counter, {
      v: 100,
      duration: 1300,
      ease: "inOutQuart",
      onUpdate: () => setCount(Math.round(counter.v)),
      onComplete: () => {
        if (!root.current) return onDone();
        animate(root.current, {
          translateY: ["0%", "-100%"],
          duration: 900,
          ease: "inOutExpo",
          onComplete: () => {
            try {
              sessionStorage.setItem("intro-seen", "1");
            } catch {}
            onDone();
          },
        });
      },
    });

    return () => {
      a.pause();
    };
  }, [onDone]);

  return (
    <div
      ref={root}
      data-preloader
      className="fixed inset-0 z-[80] flex flex-col justify-between bg-bg p-[var(--gutter)]"
      aria-hidden="true"
    >
      <div className="flex justify-between">
        <span className="label">{site.name}</span>
        <span className="label">Portfolio — {new Date().getFullYear()}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="serif text-[clamp(56px,14vw,200px)] leading-none italic text-fg">
          {String(count).padStart(3, "0")}
        </span>
        <span className="label mb-4">Loading</span>
      </div>
      <div className="absolute bottom-0 left-0 h-px bg-accent" style={{ width: `${count}%` }} />
    </div>
  );
}
