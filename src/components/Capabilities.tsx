"use client";

import { useRef } from "react";
import { capabilities } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/scroll";
import SectionHead from "./SectionHead";

export default function Capabilities() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-cap]").forEach((col) => {
        gsap.from(col.querySelectorAll("li"), {
          yPercent: 100,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: col, start: "top 85%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="wrap py-28 sm:py-36" aria-labelledby="cap-title">
      <SectionHead index="04" title="Capabilities" aside="What I reach for" />
      <h3 id="cap-title" className="sr-only">
        Capabilities
      </h3>
      <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((c) => (
          <div key={c.group} data-cap>
            <p className="label mb-5 border-b border-line pb-3 !text-fg">{c.group}</p>
            <ul className="flex flex-col gap-2 overflow-hidden">
              {c.items.map((item) => (
                <li key={item} className="text-[17px] leading-snug text-fg/75 transition-colors hover:text-accent">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
