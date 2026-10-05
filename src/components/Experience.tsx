"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { experience, education, recognition, type Role } from "@/content/site";
import SectionHead from "./SectionHead";

const TABS = [
  { id: "work", label: "Experience", data: experience },
  { id: "edu", label: "Education", data: education },
  { id: "rec", label: "Recognition", data: recognition },
] as const;

function Row({ r, open, onToggle }: { r: Role; open: boolean; onToggle: () => void }) {
  return (
    <li className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-cursor={open ? "Close" : "Open"}
        className="group grid w-full grid-cols-12 items-baseline gap-4 py-7 text-left sm:py-9"
      >
        <span className="label col-span-12 sm:col-span-3">{r.period}</span>
        <span className="col-span-10 sm:col-span-6">
          <span className="block text-[clamp(24px,3vw,40px)] font-medium leading-tight tracking-[-0.03em] transition-transform duration-500 group-hover:translate-x-2">
            {r.title}
          </span>
          <span className="serif mt-1 block text-[clamp(18px,1.8vw,24px)] italic text-fg/60">{r.org}</span>
        </span>
        <span className="label col-span-2 flex items-center justify-end gap-4 sm:col-span-3">
          {r.place && <span className="hidden sm:inline">{r.place}</span>}
          <motion.span
            className="inline-block text-[18px] text-fg"
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            +
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ul className="grid grid-cols-12 gap-4 pb-9">
              {r.points.map((pt) => (
                <li key={pt} className="col-span-12 flex gap-3 text-[15px] leading-relaxed text-fg/75 sm:col-span-6 sm:col-start-4">
                  <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
                  {pt}
                </li>
              ))}
              {r.link && (
                <li className="col-span-12 sm:col-span-6 sm:col-start-4">
                  <a
                    href={r.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="Open"
                    className="u-sweep text-[14px] text-fg"
                  >
                    {r.link.label} ↗
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Experience() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("work");
  const [open, setOpen] = useState<number | null>(0);
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <section id="experience" className="wrap py-28 sm:py-40">
      <SectionHead index="03" title="Experience" aside="Lab → research → industry" />

      <div role="tablist" aria-label="Career" className="mb-10 inline-flex max-w-full overflow-x-auto rounded-full border border-line p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setOpen(0);
            }}
            className={`relative shrink-0 rounded-full px-4 py-2 text-[13px] sm:px-5 transition-colors ${tab === t.id ? "text-bg" : "text-fg/70 hover:text-fg"}`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-fg"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={tab}
          role="tabpanel"
          className="border-t border-line"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {current.data.map((r, i) => (
            <Row key={r.org + r.title} r={r} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
