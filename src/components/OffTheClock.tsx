"use client";

import { useRef } from "react";
import { offTheClock } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/scroll";
import SectionHead from "./SectionHead";
import TravelRoute from "./life/TravelRoute";
import BikeRide from "./life/BikeRide";
import PhotoStack from "./life/PhotoStack";
import GymRep from "./life/GymRep";
import Photographer from "./life/Photographer";

function Block({
  no,
  title,
  blurb,
  meta,
  children,
  aside,
  wide = false,
}: {
  no: string;
  title: string;
  blurb: string;
  meta?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div data-life-block className="grid gap-10 border-t border-line pt-10 lg:grid-cols-12 lg:gap-14">
      <div className={`flex flex-col ${wide ? "lg:col-span-12 lg:flex-row lg:items-end lg:justify-between lg:gap-14" : "lg:col-span-4"}`}>
        <div>
          <span className="label mb-4 block">{no}</span>
          <h3 className="serif text-[clamp(48px,6vw,96px)] italic leading-[0.9]">{title}</h3>
        </div>
        <div className={wide ? "lg:max-w-[40ch]" : ""}>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-fg/75">{blurb}</p>
          {meta && <p className="label mt-4">{meta}</p>}
          {aside && <div className="mt-8">{aside}</div>}
        </div>
      </div>
      <div className={wide ? "lg:col-span-12" : "lg:col-span-8"}>{children}</div>
    </div>
  );
}

export default function OffTheClock() {
  const root = useRef<HTMLElement>(null);
  const { intro, travel, riding, gym, photography } = offTheClock;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-life-block]").forEach((b) => {
        gsap.from(b.querySelectorAll("h3, p"), {
          y: 40,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: b, start: "top 80%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="life" ref={root} className="wrap py-28 sm:py-40">
      <SectionHead index="05" title="Off the clock" aside="Iron · road · lens · elsewhere" />

      <p className="mb-20 max-w-[24ch] text-[clamp(32px,4.6vw,68px)] font-medium leading-[1.04] tracking-[-0.035em] sm:mb-28">
        {intro}
      </p>

      <div className="flex flex-col gap-24 sm:gap-32">
        <Block
          no="(a) Travel"
          title="Elsewhere"
          blurb={travel.blurb}
          meta={`${travel.places.length} stops so far`}
        >
          <TravelRoute places={travel.places} />
        </Block>

        <Block
          no="(b) Riding"
          title="Two wheels"
          blurb={riding.blurb}
          meta={riding.bike}
          wide
        >
          <BikeRide totalKm={riding.totalKm} rides={riding.rides} />
        </Block>

        <Block no="(c) Gym" title="Iron hours" blurb={gym.blurb} meta={gym.split}>
          <GymRep />
        </Block>

        <Block no="(d) Photography" title="Through the lens" blurb={photography.blurb} meta={photography.gear} aside={<Photographer />}>
          <PhotoStack photos={photography.photos} />
        </Block>
      </div>
    </section>
  );
}
