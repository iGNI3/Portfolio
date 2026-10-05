"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToTarget, prefersReducedMotion } from "@/lib/scroll";
import { useApp } from "./Providers";
import ScrambleText from "./ScrambleText";
import Magnetic from "./Magnetic";

/** anime.js signature move: letters ripple out from whichever one you touch. */
function WaveWord({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  function wave(from: number) {
    if (!ref.current || prefersReducedMotion()) return;
    animate(ref.current.querySelectorAll("[data-ch]"), {
      translateY: [
        { to: "-0.14em", duration: 240, ease: "outQuad" },
        { to: "0em", duration: 900, ease: "outElastic(1, .45)" },
      ],
      color: [
        { to: "#ff5a1f", duration: 160 },
        { to: "#ecebe6", duration: 700 },
      ],
      delay: stagger(38, { from }),
    });
  }

  return (
    <span ref={ref} aria-hidden="true">
      {text.split("").map((ch, i) => (
        <span key={i} data-ch className="inline-block" onPointerEnter={() => wave(i)}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const { introDone } = useApp();
  const root = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  // Entrance: anime.js staggers the masked lines up once the intro lifts.
  useEffect(() => {
    if (!introDone || !root.current) return;
    const lines = root.current.querySelectorAll<HTMLElement>("[data-line]");
    const fades = root.current.querySelectorAll<HTMLElement>("[data-fade]");
    if (prefersReducedMotion()) {
      lines.forEach((l) => (l.style.transform = "none"));
      fades.forEach((f) => (f.style.opacity = "1"));
      return;
    }
    animate(lines, {
      translateY: ["110%", "0%"],
      rotate: [4, 0],
      duration: 1400,
      delay: stagger(90),
      ease: "outExpo",
      // let hover-lifted letters escape the reveal mask afterwards
      onComplete: () => {
        root.current?.querySelectorAll<HTMLElement>("h1 .mask").forEach((m) => (m.style.overflow = "visible"));
      },
    });
    animate(fades, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 1000,
      delay: stagger(70, { start: 500 }),
      ease: "outQuart",
    });
  }, [introDone]);

  // Scroll: the name drifts and dims as you leave the hero.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.to(nameRef.current, {
        yPercent: -18,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section
      id="top"
      ref={root}
      className="wrap relative flex min-h-[100svh] flex-col justify-end pb-10 pt-32 sm:pb-14 [@media(max-height:760px)]:pt-24"
    >
      {/* Top meta row */}
      <div className="mb-auto grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
        <p className="label" data-fade style={{ opacity: 0 }}>
          {site.role}
        </p>
        <p className="label hidden md:block" data-fade style={{ opacity: 0 }}>
          Based in {site.location}
        </p>
        <p className="label hidden md:block" data-fade style={{ opacity: 0 }}>
          From {site.origin}
        </p>
        <p className="label text-right" data-fade style={{ opacity: 0 }}>
          Portfolio ©{new Date().getFullYear()}
        </p>
      </div>

      <h1 ref={nameRef} className="relative mt-16 select-none [@media(max-height:760px)]:mt-6" aria-label={site.name}>
        <span className="mask">
          <span data-line className="serif block text-[clamp(64px,min(17vw,30svh),280px)] italic leading-[0.86]" style={{ transform: "translateY(110%)" }}>
            <WaveWord text={site.firstName} />
          </span>
        </span>
        <span className="mask">
          <span
            data-line
            className="block text-[clamp(52px,min(13.6vw,24svh),224px)] font-semibold leading-[0.9] tracking-[-0.055em]"
            style={{ transform: "translateY(110%)" }}
          >
            <WaveWord text={site.lastName} />
            <span className="text-accent">.</span>
          </span>
        </span>
      </h1>

      <div className="mt-10 grid gap-8 border-t border-line pt-6 md:grid-cols-12 [@media(max-height:760px)]:mt-6">
        <p className="max-w-[46ch] text-[17px] leading-relaxed text-fg/80 md:col-span-6" data-fade style={{ opacity: 0 }}>
          {site.intro}
        </p>
        <div className="flex flex-col gap-2 md:col-span-3" data-fade style={{ opacity: 0 }}>
          <span className="label">Currently</span>
          <ScrambleText words={site.roles} start={introDone} className="font-mono text-[13px] uppercase tracking-wider text-fg" />
        </div>
        <div className="flex items-end md:col-span-3 md:justify-end" data-fade style={{ opacity: 0 }}>
          <Magnetic>
            <button
              type="button"
              onClick={() => scrollToTarget("#work")}
              data-cursor="Scroll"
              className="group flex items-center gap-3 rounded-full border border-line py-3 pl-5 pr-3 text-[13px] transition-colors hover:border-fg/40"
            >
              See the work
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg transition-transform duration-500 group-hover:rotate-90">
                ↓
              </span>
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
