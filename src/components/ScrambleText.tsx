"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_-=+*#";

/**
 * Cycles through `words`, decoding each one character by character —
 * a nod to the security side of the work.
 */
export default function ScrambleText({
  words,
  interval = 3000,
  start = true,
  className,
}: {
  words: readonly string[];
  interval?: number;
  start?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(words[0]);
  const index = useRef(0);
  const frame = useRef(0);
  const current = useRef<string>(words[0]);

  useEffect(() => {
    if (!start || words.length < 2 || prefersReducedMotion()) return;

    const scrambleTo = (target: string) => {
      const from = current.current;
      const len = Math.max(from.length, target.length);
      const queue = Array.from({ length: len }, (_, i) => {
        const s = Math.floor(Math.random() * 12);
        return { to: target[i] ?? "", start: s, end: s + 8 + Math.floor(Math.random() * 14) };
      });
      let f = 0;
      cancelAnimationFrame(frame.current);
      const step = () => {
        let out = "";
        let done = 0;
        for (const q of queue) {
          if (f >= q.end) {
            done++;
            out += q.to;
          } else if (f >= q.start) {
            out += q.to === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          } else {
            out += q.to === " " ? " " : "·";
          }
        }
        current.current = out;
        setText(out);
        if (done < queue.length) {
          f++;
          frame.current = requestAnimationFrame(step);
        }
      };
      step();
    };

    const id = window.setInterval(() => {
      index.current = (index.current + 1) % words.length;
      scrambleTo(words[index.current]);
    }, interval);

    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, words, interval]);

  return (
    <span className={className} aria-live="off">
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
