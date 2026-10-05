import type Lenis from "lenis";

/** Single shared Lenis instance so any component can scroll programmatically. */
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis() {
  return instance;
}

export function scrollToTarget(target: string | number | HTMLElement) {
  if (instance) {
    instance.scrollTo(target, { offset: 0, duration: 1.4 });
    return;
  }
  // Fallback when smooth scroll is disabled (reduced motion)
  if (typeof target === "number") {
    window.scrollTo({ top: target });
  } else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView();
  }
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
