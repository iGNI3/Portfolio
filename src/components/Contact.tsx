"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToTarget, prefersReducedMotion } from "@/lib/scroll";
import Magnetic from "./Magnetic";
import LocalTime from "./LocalTime";

/** Letters lift one by one on hover — Motion variants. */
function HoverWord({ text }: { text: string }) {
  return (
    <motion.span initial="rest" whileHover="hover" className="inline-flex" aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="relative inline-block overflow-hidden" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{ rest: { y: 0 }, hover: { y: "-100%" } }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1], delay: i * 0.025 }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
          <motion.span
            className="absolute left-0 top-full inline-block text-accent"
            variants={{ rest: { y: 0 }, hover: { y: "-100%" } }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1], delay: i * 0.025 }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from("[data-big] > span > span", {
        yPercent: 110,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-big]", start: "top 80%" },
      });
    },
    { scope: root }
  );

  function copy() {
    navigator.clipboard
      ?.writeText(site.email)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  }

  return (
    <footer id="contact" ref={root} className="wrap relative flex min-h-[100svh] flex-col pt-28 sm:pt-40">
      <div className="mb-14 flex items-center gap-4 sm:mb-20">
        <span className="label !text-accent">(06)</span>
        <h2 className="label !text-fg">Contact</h2>
        <span className="h-px flex-1 bg-line" />
      </div>

      <p data-big className="text-[clamp(56px,11vw,190px)] font-semibold leading-[0.9] tracking-[-0.055em]">
        <span className="mask">
          <span>Let&apos;s build</span>
        </span>
        <span className="mask">
          <span className="serif font-normal italic tracking-[-0.02em] text-fg/80">something</span>
        </span>
        <span className="mask">
          <span>
            that works<span className="text-accent">.</span>
          </span>
        </span>
      </p>

      <div className="mt-14 flex flex-col gap-8 sm:flex-row sm:items-center">
        <Magnetic strength={0.25}>
          <a
            href={`mailto:${site.email}`}
            data-cursor="Write"
            className="inline-flex items-center gap-4 rounded-full bg-fg py-4 pl-7 pr-4 text-[15px] font-medium text-bg transition-transform hover:scale-[1.02]"
          >
            {site.email}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-bg">→</span>
          </a>
        </Magnetic>
        <button type="button" onClick={copy} className="label u-sweep self-start !text-fg sm:self-auto">
          {copied ? "Copied" : "Copy address"}
        </button>
      </div>

      <div className="mt-auto grid gap-10 border-t border-line pb-8 pt-10 sm:grid-cols-12">
        <ul className="flex flex-col gap-1 sm:col-span-5">
          {site.links.filter((l) => !l.hidden).map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Open"
                className="text-[clamp(24px,2.6vw,36px)] font-medium tracking-[-0.03em]"
              >
                <HoverWord text={l.label} />
                <span className="ml-2 text-[0.6em] text-faint">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5 sm:col-span-4">
          <span className="label">Local time</span>
          <span className="text-[15px]">
            <LocalTime /> — {site.location}
          </span>
        </div>
        <div className="flex flex-col justify-between gap-6 sm:col-span-3 sm:items-end">
          <button type="button" onClick={() => scrollToTarget(0)} className="label u-sweep self-start !text-fg sm:self-end">
            Back to top ↑
          </button>
          <span className="label">
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>
      </div>
    </footer>
  );
}
