"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { caseStudies, type Project } from "@/content/site";
import { getLenis, prefersReducedMotion } from "@/lib/scroll";
import PipelineScene, { type FrameState, type LabelPos } from "./journey/PipelineScene";
import { motifArch } from "./journey/pipeline";

/**
 * Expanded case study, staged as the project's own 3D pipeline.
 *
 * Each stage of the project is a distinct 3D station (a scanning disc, a node
 * constellation, an intake core, a selector, a gate, a ledger…), laid out on a
 * path unique to that project, with conduits of light flowing between them. The
 * camera opens on the whole pipeline, then travels to each station as you
 * scroll while the copy changes alongside. See pipeline.ts / PipelineScene.ts.
 *
 * Keys: ↑ ↓ / ← → step through sections, Esc closes.
 */

export default function CaseStudy({ project, onClose }: { project: Project; onClose: () => void }) {
  const study = caseStudies[project.slug];
  const steps = study?.flow ?? [];
  const N = steps.length;
  const sectionCount = N + 2; // intro (hero), N stages, shipped (outro); details follow

  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const giant = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const sceneRef = useRef<PipelineScene | null>(null);
  const activeRef = useRef(-1);
  const [active, setActive] = useState(-1);
  const [webgl, setWebgl] = useState(true);

  // lock page scroll while open
  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    scroller.current?.focus({ preventScroll: true });
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, []);

  // per-frame DOM updates driven by the scene (no React re-render)
  const onFrame = useCallback(
    (pos: LabelPos[], s: FrameState) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      pos.forEach((p, i) => {
        const el = labels.current[i];
        if (!el) return;
        const on = i === Math.round(s.active) && s.focus > 0.5;
        const inView = p.x > 20 && p.x < w - 40 && p.y > 60 && p.y < h - 30;
        const x = Math.min(Math.max(p.x + 12, 12), w - el.offsetWidth - 24);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${(p.y - 9).toFixed(1)}px, 0)`;
        el.style.opacity = String(inView ? p.vis : 0);
        el.dataset.on = String(on);
      });
      if (giant.current) {
        const k = 1 - smooth(0, 1, s.p); // visible only in the hero
        giant.current.style.opacity = String(k * 0.9);
        giant.current.style.transform = `translate3d(0, ${((1 - k) * -36).toFixed(1)}px, 0)`;
      }
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, s.p / (N + 1)).toFixed(4)})`;
      const a = s.focus > 0.4 ? Math.round(s.active) : -1;
      if (a !== activeRef.current) {
        activeRef.current = a;
        setActive(a);
      }
    },
    [N]
  );

  // boot the WebGL scene
  useEffect(() => {
    const c = canvas.current;
    if (!c || !study || !N) return;
    if (!PipelineScene.supported()) {
      setWebgl(false);
      return;
    }
    let scene: PipelineScene;
    try {
      scene = new PipelineScene(c, {
        archs: steps.map((s) => motifArch(s.motif)),
        layout: study.layout,
        reduced: prefersReducedMotion(),
        onFrame,
      });
    } catch (e) {
      console.warn("Case study 3D disabled:", e);
      setWebgl(false);
      return;
    }
    sceneRef.current = scene;
    const el = scroller.current;
    const progress = () => (el ? el.scrollTop / Math.max(1, el.clientHeight) : 0);
    scene.snap(progress());
    const onScroll = () => scene.setProgress(progress());
    const onMove = (e: PointerEvent) =>
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    el?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el?.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [N, study, onFrame]);

  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = scroller.current;
      if (e.key === "Escape") return onClose();
      if (!el) return;
      const i = Math.round(el.scrollTop / el.clientHeight);
      if (i >= sectionCount) return; // in the details: let the browser scroll normally
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goTo(Math.min(i + 1, sectionCount));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goTo, sectionCount]);

  if (!study) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      ref={scroller}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} case study`}
      className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      data-lenis-prevent
      style={{ background: "#080809" }}
    >
      {/* ── pinned stage ─────────────────────────────── */}
      <div className="cs-stage-bg pointer-events-none fixed inset-0" aria-hidden="true">
        <div ref={giant} className="absolute inset-x-0 top-[44%] -translate-y-1/2 overflow-hidden text-center">
          <span className="cs-giant inline-block">{project.title}</span>
        </div>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" style={{ visibility: webgl ? "visible" : "hidden" }} />
        {webgl &&
          steps.map((s, i) => (
            <div
              key={s.label}
              ref={(el: HTMLDivElement | null) => {
                labels.current[i] = el;
              }}
              className="cs-label"
            >
              <span className="cs-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="cs-name">{s.label}</span>
            </div>
          ))}
      </div>

      {/* ── HUD ──────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="h-px w-full bg-line">
          <div ref={bar} className="h-px origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
        </div>
        <div className="wrap flex items-center justify-between py-5">
          <span className="label">
            {project.index} · Case study <span className="text-faint">/</span> <span className="text-fg">{project.title}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            data-cursor="Close"
            aria-label="Close case study"
            className="glass pointer-events-auto flex h-10 items-center gap-2 rounded-full px-5 text-[13px]"
          >
            Close <span aria-hidden>✕</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Stages"
        className="fixed right-[var(--gutter)] top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3.5 lg:flex"
      >
        {steps.map((s, i) => (
          <button key={s.label} type="button" className="cs-dot" data-on={active === i} onClick={() => goTo(1 + i)}>
            <span className="cs-dot-name">{s.label}</span>
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </nav>

      {/* ── scrolling copy ───────────────────────────── */}
      <div className="relative z-10">
        {/* intro / overview */}
        <section className="wrap flex h-[100svh] flex-col justify-end pb-16 sm:pb-20">
          <Copy className="max-w-[620px]">
            <span className="label !text-accent">{project.kicker}</span>
            <h2 className="mt-4 text-[clamp(52px,8vw,128px)] font-semibold leading-[0.86] tracking-[-0.055em]">{project.title}</h2>
            <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-fg/75">{study.overview}</p>
            {project.metrics && (
              <dl className="mt-8 flex flex-wrap gap-x-9 gap-y-4">
                {project.metrics.map((m) => (
                  <div key={m.label} className="flex flex-col">
                    <dt className="label order-2 mt-1">{m.label}</dt>
                    <dd className="order-1 text-[clamp(24px,2.4vw,34px)] font-semibold leading-none tracking-[-0.04em]">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button type="button" onClick={() => goTo(1)} className="label mt-9 inline-flex items-center gap-3 !text-fg">
              <span className="relative flex h-8 w-5 justify-center rounded-full border border-line">
                <span className="mt-1.5 h-1.5 w-px animate-bounce bg-accent" />
              </span>
              Scroll the pipeline · {N} stages
            </button>
          </Copy>
        </section>

        {/* one section per stage */}
        {steps.map((s, i) => (
          <section key={s.label} className="wrap flex h-[100svh] items-end pb-10 lg:items-center lg:pb-0">
            <Copy className="max-w-[440px]">
              <span className="label !text-accent">
                Stage {String(i + 1).padStart(2, "0")} <span className="text-faint">/ {String(N).padStart(2, "0")}</span>
              </span>
              <h3 className="mt-4 text-[clamp(40px,5vw,76px)] font-semibold leading-[0.92] tracking-[-0.045em]">{s.label}</h3>
              <p className="mt-5 text-[17px] leading-relaxed text-fg/80">{s.body}</p>
              <p className="label mt-8">
                {i < N - 1 ? (
                  <>
                    Next <span className="text-faint">→</span> <span className="text-fg/80">{steps[i + 1].label}</span>
                  </>
                ) : (
                  "End of the pipeline"
                )}
              </p>
            </Copy>
          </section>
        ))}

        {/* shipped / outro */}
        <section className="wrap flex h-[100svh] items-end justify-end pb-16 sm:pb-20">
          <Copy className="max-w-[440px]">
            <span className="label">Shipped</span>
            <h3 className="mt-4 text-[clamp(40px,5vw,76px)] font-semibold leading-[0.92] tracking-[-0.045em]">
              Out in the
              <span className="serif font-normal italic text-fg/70"> world.</span>
            </h3>
            <p className="mt-5 text-[15.5px] leading-relaxed text-fg/75">{project.role}</p>
            <Links project={project} />
          </Copy>
        </section>

        {/* details */}
        <section className="relative border-t border-line" style={{ background: "#080809" }}>
          <div className="wrap mx-auto max-w-[1180px] py-20 sm:py-28">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h3 className="text-[clamp(34px,4.2vw,60px)] font-semibold leading-none tracking-[-0.04em]">Tech stack</h3>
              <span className="label hidden sm:block">{project.year}</span>
            </div>
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {study.stackGroups.map((g) => (
                <div key={g.group}>
                  <p className="label mb-4 border-b border-line pb-3 !text-fg">{g.group}</p>
                  <ul className="flex flex-wrap gap-2">
                    {g.items.map((it) => (
                      <li key={it} className="rounded-full border border-line px-3 py-1.5 font-mono text-[12px] text-fg/80">
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-16 grid gap-6 border-t border-line pt-10 sm:grid-cols-[1fr_auto] sm:items-end">
              <ol className="flex flex-wrap gap-x-3 gap-y-2 text-[14px] text-fg/70">
                {steps.map((s, i) => (
                  <li key={s.label} className="flex items-center gap-3">
                    <button type="button" onClick={() => goTo(1 + i)} className="u-sweep hover:text-fg">
                      {s.label}
                    </button>
                    {i < N - 1 && <span className="text-faint">→</span>}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center gap-2 justify-self-start rounded-full bg-fg px-5 text-[13px] font-medium text-bg sm:justify-self-end"
              >
                Back to work
              </button>
            </div>
            {project.note && <p className="mt-6 text-[13px] text-faint">{project.note}</p>}
          </div>
        </section>
      </div>
    </motion.div>,
    document.body
  );
}

function Copy({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={`cs-copy ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.5 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Links({ project }: { project: Project }) {
  if (!project.live && !project.link) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
      {project.live && (
        <a
          href={project.live.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-fg px-4 py-2 text-[13px] font-medium text-bg"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {project.live.label} ↗
        </a>
      )}
      {project.link && (
        <a href={project.link.href} target="_blank" rel="noopener noreferrer" className="label u-sweep !text-fg">
          {project.link.label} ↗
        </a>
      )}
    </div>
  );
}

function smooth(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
