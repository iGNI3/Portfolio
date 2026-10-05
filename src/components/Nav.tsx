"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { site, nav } from "@/content/site";
import { scrollToTarget, getLenis } from "@/lib/scroll";
import { useApp } from "./Providers";
import LocalTime from "./LocalTime";

export default function Nav() {
  const { introDone, setPaletteOpen } = useApp();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // Freeze page scroll while the mobile menu is open
  useEffect(() => {
    const l = getLenis();
    if (!l || !introDone) return;
    if (menu) l.stop();
    else l.start();
  }, [menu, introDone]);

  // Hide on scroll down, reveal on scroll up
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 240 && !menu);
  });

  function go(e: React.MouseEvent, href: string) {
    e.preventDefault();
    setMenu(false);
    scrollToTarget(href);
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: introDone && !hidden ? 0 : -90, opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          aria-label="Primary"
          className="glass glass-refract relative flex w-full max-w-[1100px] items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2"
        >
          <a href="#top" onClick={(e) => go(e, "#top")} className="flex items-baseline gap-2" data-cursor="Top">
            <span className="serif text-[22px] italic leading-none">Ankit</span>
            <span className="label hidden md:inline">
              <LocalTime />
            </span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={(e) => go(e, n.href)}
                  className="rounded-full px-4 py-2 text-[13px] text-fg/80 transition-colors hover:bg-white/[0.06] hover:text-fg"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {site.available && (
              <span className="hidden items-center gap-2 pr-2 lg:flex">
                <span className="pulse" />
                <span className="label !text-fg/80">{site.availabilityLabel}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden rounded-full border border-white/10 px-3 py-2 font-mono text-[11px] text-muted transition-colors hover:border-white/25 hover:text-fg sm:block"
              aria-label="Open command menu"
            >
              {isMac ? "⌘" : "Ctrl"} K
            </button>
            <button
              type="button"
              className="rounded-full bg-fg px-4 py-2 text-[13px] font-medium text-bg md:hidden"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-controls="mobile-menu"
            >
              {menu ? "Close" : "Menu"}
            </button>
            <a
              href="#contact"
              onClick={(e) => go(e, "#contact")}
              className="hidden rounded-full bg-fg px-5 py-2 text-[13px] font-medium text-bg transition-transform hover:scale-[1.03] md:block"
            >
              Let&apos;s talk
            </a>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-end bg-bg px-[var(--gutter)] pb-10 pt-28 md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col gap-1">
              {nav.map((n, i) => (
                <li key={n.href} className="mask">
                  <motion.a
                    href={n.href}
                    onClick={(e) => go(e, n.href)}
                    className="serif block text-[15vw] leading-[1.05]"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {n.label}
                  </motion.a>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex justify-between border-t border-line pt-5">
              <span className="label">
                {site.location} · <LocalTime />
              </span>
              <span className="label">{site.availabilityLabel}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
