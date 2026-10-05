"use client";

import { useRef } from "react";
import { site, experience, education } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/scroll";
import SectionHead from "./SectionHead";

/** Words light up as you scroll through the paragraph (GSAP scrub). */
export default function About() {
  const root = useRef<HTMLElement>(null);
  const words = site.about.split(" ");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        "[data-word]",
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: {
            trigger: "[data-about-text]",
            start: "top 78%",
            end: "bottom 40%",
            scrub: 0.6,
          },
        }
      );
      gsap.from("[data-fact]", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-facts]", start: "top 85%" },
      });
    },
    { scope: root }
  );

  const facts = [
    { k: "Now", v: `${experience[0].title}, ${experience[0].org}` },
    { k: "Before", v: `${experience[1].title}, ${experience[1].org}` },
    { k: "Studied", v: `${education[0].title} · ${education[1].title}` },
    { k: "Recognition", v: "Springer Best Research Paper, AI4S 2024" },
    ...(site.available ? [{ k: "Looking for", v: site.lookingFor }] : []),
  ];

  return (
    <section id="about" ref={root} className="wrap py-28 sm:py-40">
      <SectionHead index="02" title="About" aside="Lab → terminal" />
      <div className="grid gap-16 lg:grid-cols-12">
        <p
          data-about-text
          className="text-[clamp(26px,3.6vw,52px)] font-medium leading-[1.12] tracking-[-0.03em] lg:col-span-9"
        >
          {words.map((w, i) => (
            <span key={i} data-word className="inline">
              {w}{" "}
            </span>
          ))}
        </p>
        <dl data-facts className="grid content-start gap-6 lg:col-span-3 lg:pt-3">
          {facts.map((f) => (
            <div key={f.k} data-fact className="border-t border-line pt-3">
              <dt className="label mb-1.5">{f.k}</dt>
              <dd className="text-[15px] leading-snug text-fg/85">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
