"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { projects, caseStudies, type Project } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import SectionHead from "./SectionHead";
import DotGrid from "./visuals/DotGrid";
import Pipeline from "./visuals/Pipeline";
import StatCounter from "./visuals/StatCounter";
import CodeCard from "./visuals/CodeCard";
import ScanAgent from "./visuals/ScanAgent";
import AgentSwarm from "./visuals/AgentSwarm";
import CodeScan from "./visuals/CodeScan";
import CaseStudy from "./CaseStudy";

// Keep in sync with the .reel media query in globals.css
const REEL_QUERY = "(min-width: 1024px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)";

function Visual({ v }: { v: Project["visual"] }) {
  switch (v.kind) {
    case "grid":
      return <DotGrid />;
    case "scan":
      return <ScanAgent />;
    case "swarm":
      return <AgentSwarm />;
    case "codescan":
      return <CodeScan />;
    case "pipeline":
      return <Pipeline steps={v.steps} label={v.label} />;
    case "stat":
      return <StatCounter value={v.value} prefix={v.prefix} suffix={v.suffix} caption={v.caption} />;
    default:
      return <CodeCard />;
  }
}

function Panel({ p, total, onOpen }: { p: Project; total: number; onOpen: () => void }) {
  const hasStudy = !!caseStudies[p.slug];
  return (
    <article className="reel-panel grid gap-10 border-t border-line py-12 lg:grid-cols-2 lg:gap-14 lg:py-0">
      <div className="flex flex-col">
        <div className="reel-meta mb-8 flex items-center justify-between">
          <span className="label">
            {p.index} / {String(total).padStart(2, "0")}
          </span>
          <span className="label">{p.year}</span>
        </div>
        <h3 className="text-[clamp(44px,6.4vw,104px)] font-semibold leading-[0.92] tracking-[-0.05em]">{p.title}</h3>
        <p className="serif mt-3 text-[clamp(22px,2.4vw,34px)] italic text-fg/70">{p.kicker}</p>
        <p className="reel-summary mt-6 max-w-[54ch] text-[16px] leading-relaxed text-fg/80">{p.summary}</p>
        {p.metrics && (
          <dl className="reel-metrics mt-6 flex flex-wrap gap-x-10 gap-y-4">
            {p.metrics.map((m) => (
              <div key={m.label} className="flex flex-col">
                <dt className="order-2 label mt-1">{m.label}</dt>
                <dd className="order-1 text-[clamp(26px,2.4vw,36px)] font-semibold leading-none tracking-[-0.04em]">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <ul className="reel-points mt-6 flex flex-col gap-2.5">
          {p.points.map((pt) => (
            <li key={pt} className="flex gap-3 text-[14px] leading-snug text-fg/75">
              <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
              {pt}
            </li>
          ))}
        </ul>
        <div className="reel-foot mt-auto pt-8">
          <ul className="reel-stack flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted">
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="label">{p.role}</span>
            {p.live && (
              <a
                href={p.live.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Try it"
                className="inline-flex items-center gap-2 rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg transition-transform hover:scale-[1.04]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {p.live.label} ↗
              </a>
            )}
            {p.link && (
              <a
                href={p.link.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Open"
                className="u-sweep text-[14px] text-fg"
              >
                {p.link.label} ↗
              </a>
            )}
            {p.note && <span className="text-[13px] text-faint">{p.note}</span>}
          </div>
          {hasStudy && (
            <button
              type="button"
              onClick={onOpen}
              data-cursor="Expand"
              className="group mt-6 inline-flex items-center gap-3 rounded-full border border-line py-2.5 pl-5 pr-2.5 text-[13px] transition-colors hover:border-fg/40"
            >
              View case study
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg transition-transform duration-500 group-hover:rotate-45">
                ↗
              </span>
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={hasStudy ? onOpen : undefined}
        data-cursor={hasStudy ? "Expand" : undefined}
        aria-label={hasStudy ? `Open ${p.title} case study` : undefined}
        className={`flex items-center justify-center rounded-[28px] border border-line bg-raise/60 p-8 transition-colors sm:p-12 ${hasStudy ? "hover:border-fg/25" : "cursor-default"}`}
      >
        <Visual v={p.visual} />
      </button>
    </article>
  );
}

/**
 * Desktop: the section pins and the projects travel sideways (GSAP ScrollTrigger scrub).
 * Mobile / reduced motion: a plain vertical stack — no pinning.
 */
export default function Work() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const list = projects.filter((p) => !p.hidden);
  const [open, setOpen] = useState<Project | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(REEL_QUERY, () => {
        const el = track.current;
        if (!el) return;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });
      });
      // Fonts change widths after load — re-measure once they are in
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="work" ref={root} className="reel relative overflow-hidden pt-28 sm:pt-36">
      <div className="wrap">
        <SectionHead index="01" title="Selected work" aside={`${list.length} projects`} />
      </div>
      <div ref={track} className="reel-track wrap">
        {list.map((p) => (
          <Panel key={p.slug} p={p} total={list.length} onOpen={() => setOpen(p)} />
        ))}
      </div>
      <div className="reel-progress wrap absolute inset-x-0 bottom-8 hidden">
        <div className="h-px w-full bg-line">
          <div ref={bar} className="h-px origin-left scale-x-0 bg-accent" />
        </div>
      </div>

      <AnimatePresence>
        {open && <CaseStudy project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
