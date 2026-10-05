"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { animate, createDraggable, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

type Photo = { src: string; caption: string };

// Scatter positions (% of the table) and tilt for up to 8 prints
const LAYOUT = [
  { x: 3, y: 8, r: -6 },
  { x: 25, y: 3, r: 4 },
  { x: 47, y: 10, r: -3 },
  { x: 68, y: 5, r: 6 },
  { x: 14, y: 44, r: 5 },
  { x: 38, y: 42, r: -4 },
  { x: 60, y: 46, r: 3 },
  { x: 30, y: 22, r: -2 },
];

function Print({ p, i }: { p: Photo; i: number }) {
  const [missing, setMissing] = useState(false);
  const pos = LAYOUT[i % LAYOUT.length];
  return (
    <figure
      data-print
      data-cursor="Drag"
      className="absolute w-[min(30%,200px)] touch-none select-none bg-[#f2f0ea] p-2.5 pb-9 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, rotate: `${pos.r}deg`, opacity: 0 }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#1a1a18]">
        {!missing ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.src}
            alt={p.caption}
            draggable={false}
            loading="lazy"
            onError={() => setMissing(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="label absolute inset-0 flex items-center justify-center text-center !text-faint">
            Add {p.src}
          </span>
        )}
      </div>
      <figcaption className="absolute inset-x-2.5 bottom-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#3a3833]">
        {p.caption}
      </figcaption>
    </figure>
  );
}

/** Prints scattered on a table. Each one is an anime.js Draggable with spring release. */
export default function PhotoStack({ photos }: { photos: Photo[] }) {
  const table = useRef<HTMLDivElement>(null);
  const inView = useInView(table, { once: true, amount: 0.3 });
  const z = useRef(10);

  // Deal the prints onto the table
  useEffect(() => {
    const el = table.current;
    if (!inView || !el) return;
    const prints = el.querySelectorAll<HTMLElement>("[data-print]");
    if (prefersReducedMotion()) {
      prints.forEach((p) => (p.style.opacity = "1"));
      return;
    }
    animate(prints, {
      opacity: [0, 1],
      translateY: [-60, 0],
      scale: [1.15, 1],
      duration: 900,
      delay: stagger(120),
      ease: "outBack(1.4)",
    });
  }, [inView]);

  // Make every print draggable inside the table
  useEffect(() => {
    const el = table.current;
    if (!el) return;
    const prints = Array.from(el.querySelectorAll<HTMLElement>("[data-print]"));
    const draggables = prints.map((print) =>
      createDraggable(print, {
        container: el,
        onGrab: () => {
          z.current += 1;
          print.style.zIndex = String(z.current);
        },
      })
    );
    return () => {
      draggables.forEach((d) => d.revert());
    };
  }, [photos.length]);

  return (
    <div
      ref={table}
      className="relative h-[clamp(340px,58vw,620px)] w-full overflow-hidden rounded-[28px] border border-line bg-raise/60"
    >
      <span className="label pointer-events-none absolute bottom-5 right-6">Drag the prints</span>
      {photos.map((p, i) => (
        <Print key={`${p.src}-${i}`} p={p} i={i} />
      ))}
    </div>
  );
}
