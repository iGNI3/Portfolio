"use client";

import { useRef } from "react";
import { moreProjects, type MoreProject } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/scroll";

function Links({ p }: { p: MoreProject }) {
  if (!p.live && !p.link) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:flex-col sm:items-end">
      {p.live && (
        <a
          href={p.live.href}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="Try it"
          aria-label={`${p.title}: ${p.live.label}`}
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
          aria-label={`${p.title} on ${p.link.label}`}
          className="label u-sweep !text-fg"
        >
          {p.link.label} ↗
        </a>
      )}
    </span>
  );
}

/** Compact typographic list of smaller projects, under the work reel. */
export default function MoreProjects() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from("[data-more-row]", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });
    },
    { scope: root }
  );

  if (moreProjects.length === 0) return null;

  return (
    <section ref={root} aria-labelledby="more-projects" className="wrap pt-20 sm:pt-28">
      <div className="mb-8 flex items-center gap-4">
        <h3 id="more-projects" className="label !text-fg">
          More projects
        </h3>
        <span className="h-px flex-1 bg-line" />
        <span className="label hidden sm:inline">{moreProjects.length} more</span>
      </div>
      <ul className="border-t border-line">
        {moreProjects.map((p) => (
          <li
            key={p.title}
            data-more-row
            className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-4 border-b border-line py-7 sm:py-8"
          >
            <span className="col-span-12 sm:col-span-5">
              <span className="block text-[clamp(22px,2.4vw,32px)] font-medium leading-tight tracking-[-0.03em] transition-transform duration-500 group-hover:translate-x-2">
                {p.title}
              </span>
              <span className="serif mt-1 block text-[clamp(17px,1.5vw,21px)] italic text-fg/60">{p.kicker}</span>
            </span>
            <span className="col-span-12 text-[14px] leading-relaxed text-fg/75 sm:col-span-5">
              {p.summary}
              <span className="label mt-3 block">{p.stack.join(" · ")}</span>
            </span>
            <span className="col-span-12 sm:col-span-2 sm:flex sm:justify-end">
              <Links p={p} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
