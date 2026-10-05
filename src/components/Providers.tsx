"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis, getLenis, prefersReducedMotion } from "@/lib/scroll";
import Preloader from "./Preloader";
import Cursor from "./Cursor";
import CommandPalette from "./CommandPalette";
import AskBot from "./AskBot";
import GlassFilter from "./GlassFilter";

type AppState = {
  introDone: boolean;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

const AppContext = createContext<AppState>({
  introDone: false,
  paletteOpen: false,
  setPaletteOpen: () => {},
});

export const useApp = () => useContext(AppContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [introDone, setIntroDone] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Smooth scroll: one loop — Lenis is driven by the GSAP ticker.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // held until the intro finishes

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // Chromium gets real SVG refraction on glass; others keep the blur recipe.
  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromium = /Chrome\/|Chromium\//.test(ua) && !/Firefox\//.test(ua);
    const isSafari = /Safari\//.test(ua) && !/Chrome\/|Chromium\//.test(ua);
    document.documentElement.dataset.refract = String(isChromium && !isSafari);
  }, []);

  const finishIntro = useCallback(() => {
    setIntroDone(true);
    getLenis()?.start();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  // Pause scrolling while the palette is open
  useEffect(() => {
    const l = getLenis();
    if (!l || !introDone) return;
    if (paletteOpen) l.stop();
    else l.start();
  }, [paletteOpen, introDone]);

  return (
    <AppContext.Provider value={{ introDone, paletteOpen, setPaletteOpen }}>
      <GlassFilter />
      {!introDone && <Preloader onDone={finishIntro} />}
      {children}
      <Cursor />
      <CommandPalette />
      <AskBot />
    </AppContext.Provider>
  );
}
