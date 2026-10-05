"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

type Ride = { route: string; distance: string };

/* ── Scene geometry ──────────────────────────────────────────
   Every layer is a strip that repeats seamlessly. anime.js slides
   each strip left on an endless loop at its own speed (parallax):
   far ridge → city / forest / mountains → fence posts → road.   */
const H = 340; // scene height (px == SVG units)
const GROUND = 270; // y of the road surface
const STRIP = 2400; // width of the main scenery strip
const SEG = STRIP / 3; // city | forest | mountains

// Tiny deterministic RNG so server and client draw the same scene
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const r1 = (n: number) => Math.round(n * 10) / 10;

function useScenery() {
  return useMemo(() => {
    const rand = rng(42);

    // City: buildings with a few lit windows
    const buildings: { x: number; w: number; h: number; windows: { x: number; y: number; lit: boolean }[] }[] = [];
    let x = 20;
    while (x < SEG - 60) {
      const w = r1(34 + rand() * 46);
      const h = r1(60 + rand() * 120);
      const windows: { x: number; y: number; lit: boolean }[] = [];
      for (let wy = GROUND - h + 12; wy < GROUND - 14; wy += 16) {
        for (let wx = x + 8; wx < x + w - 10; wx += 12) {
          if (rand() > 0.55) windows.push({ x: r1(wx), y: r1(wy), lit: rand() > 0.85 });
        }
      }
      buildings.push({ x: r1(x), w, h, windows });
      x += w + r1(4 + rand() * 10);
    }

    // Forest: layered pines
    const trees: { x: number; h: number; back: boolean }[] = [];
    for (let tx = SEG + 10; tx < SEG * 2 - 20; tx += 14 + rand() * 18) {
      trees.push({ x: r1(tx), h: r1(46 + rand() * 70), back: rand() > 0.5 });
    }

    // Mountains: three peaks with snow caps
    const peaks = [
      { x: SEG * 2 + 60, w: 360, h: 190 },
      { x: SEG * 2 + 300, w: 300, h: 140 },
      { x: SEG * 2 + 470, w: 330, h: 210 },
    ];

    return { buildings, trees, peaks };
  }, []);
}

function Rider() {
  // local origin (0,0) = where the wheels touch the road
  const wheel = (cx: number) => (
    <g data-wheel style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx={cx} cy="-14" r="13" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.6" />
      <line x1={cx - 13} y1="-14" x2={cx + 13} y2="-14" stroke="#55534e" strokeWidth="1" />
      <line x1={cx} y1="-27" x2={cx} y2="-1" stroke="#55534e" strokeWidth="1" />
      <circle cx={cx} cy="-14" r="2" fill="#ecebe6" />
    </g>
  );
  return (
    <svg
      viewBox="-80 -84 150 86"
      className="absolute"
      style={{ left: "34%", bottom: H - GROUND - 2, width: 225, height: 129 }}
      aria-hidden="true"
    >
      {/* speed lines */}
      {[0, 1, 2].map((i) => (
        <line key={`s${i}`} data-speed x1="-48" y1={-22 - i * 12} x2="-70" y2={-22 - i * 12} stroke="#55534e" strokeWidth="1.2" strokeLinecap="round" opacity="0" />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={`p${i}`} data-puff cx="-40" cy="-10" r="3.5" fill="#8b8982" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      ))}
      {wheel(-27)}
      {wheel(27)}
      <g data-body>
        <path d="M-27 -14 L-4 -14 L6 -32 L20 -32 L27 -14" fill="none" stroke="#ecebe6" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M-4 -14 L-12 -32 L6 -32" fill="none" stroke="#ecebe6" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M0 -32 Q 9 -43 21 -37" fill="none" stroke="#ff5a1f" strokeWidth="3" strokeLinecap="round" />
        <path d="M-22 -35 L-3 -35" stroke="#ecebe6" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 -32 L24 -45 L32 -47" fill="none" stroke="#ecebe6" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-9 -37 L2 -58" stroke="#ecebe6" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M0 -54 L27 -46" stroke="#ecebe6" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-8 -37 L8 -26 L5 -17" fill="none" stroke="#ecebe6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="-65" r="6.5" fill="#0b0b0c" stroke="#ecebe6" strokeWidth="1.8" />
        <path d="M4 -66 L12 -66" stroke="#ff5a1f" strokeWidth="2" strokeLinecap="round" />
        {/* scarf */}
        <path
          data-scarf
          d="M-1 -59 Q -12 -60 -20 -55"
          fill="none"
          stroke="#ff5a1f"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}
        />
      </g>
    </svg>
  );
}

/** A strip of scenery drawn twice side by side so it can loop without a seam. */
function Strip({ layer, width, children }: { layer: "far" | "mid" | "near"; width: number; children: React.ReactNode }) {
  return (
    <div data-layer={layer} className="absolute left-0 top-0 flex" style={{ width: width * 2, height: H }}>
      {[0, 1].map((i) => (
        <svg key={i} viewBox={`0 0 ${width} ${H}`} width={width} height={H} className="shrink-0" aria-hidden="true">
          {children}
        </svg>
      ))}
    </div>
  );
}

/**
 * An endless anime.js ride: the rider holds the middle of the frame while
 * the world streams past — city blocks, a pine forest, snow-capped peaks —
 * each layer on its own loop for depth. Scrolling the page gives it throttle.
 */
export default function BikeRide({ totalKm, rides }: { totalKm: number | null; rides: Ride[] }) {
  const root = useRef<HTMLDivElement>(null);
  const trip = useRef<HTMLSpanElement>(null);
  const inView = useInView(root, { amount: 0.2 });
  const { buildings, trees, peaks } = useScenery();

  useEffect(() => {
    const el = root.current;
    if (!el || !inView || prefersReducedMotion()) return;

    const q = (s: string) => el.querySelectorAll(s);
    const layer = (name: string, width: number, duration: number) =>
      animate(q(`[data-layer="${name}"]`), { translateX: [0, -width], duration, ease: "linear", loop: true });

    const loops = [
      layer("far", STRIP, 90000),
      layer("mid", STRIP, 30000),
      layer("near", 600, 4200),
      animate(q("[data-dash]"), { strokeDashoffset: [0, -40], duration: 360, ease: "linear", loop: true }),
      animate(q("[data-wheel]"), { rotate: [0, 360], duration: 420, ease: "linear", loop: true }),
      animate(q("[data-body]"), { translateY: [0, -1.4, 0], duration: 380, ease: "inOutSine", loop: true }),
      animate(q("[data-scarf]"), { rotate: [-6, 8, -6], duration: 520, ease: "inOutSine", loop: true }),
      animate(q("[data-speed]"), {
        translateX: [8, -18],
        opacity: [0, 0.9, 0],
        duration: 700,
        delay: stagger(140),
        ease: "outQuad",
        loop: true,
      }),
      animate(q("[data-puff]"), {
        translateX: [0, -30],
        translateY: [0, -6],
        scale: [0.4, 1.8],
        opacity: [0.5, 0],
        duration: 900,
        delay: stagger(300),
        ease: "outQuad",
        loop: true,
      }),
    ];

    // Throttle: page scroll speeds the whole world up, then it eases back
    let speed = 1;
    let lastY = window.scrollY;
    let last = performance.now();
    let km = Number(trip.current?.textContent ?? 0) || 0;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      const target = 1 + Math.min(dy / 12, 3);
      speed += (target - speed) * (target > speed ? 0.25 : 0.04);
      loops.forEach((a) => {
        (a as unknown as { speed: number }).speed = speed;
      });
      km += (dt / 1000) * 0.06 * speed; // "this visit" trip meter — playful, not your real mileage
      if (trip.current) trip.current.textContent = km.toFixed(2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      loops.forEach((a) => a.pause());
    };
  }, [inView]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-end gap-4">
          <span ref={trip} className="text-[clamp(56px,8vw,120px)] font-semibold leading-none tracking-[-0.06em] tabular-nums">
            0.00
          </span>
          <span className="label mb-2">
            km ridden
            <br />
            while you&apos;re here
          </span>
        </div>
        {totalKm ? <span className="label mb-2">{totalKm.toLocaleString("en-IN")} km on the real odometer</span> : null}
      </div>

      <div
        ref={root}
        className="relative w-full overflow-hidden rounded-[28px] border border-line bg-[#0e0e0d]"
        style={{ height: H }}
        role="img"
        aria-label="Animated scene: a rider on a motorbike passing through a city, a pine forest and snowy mountains"
      >
        {/* sky: stars + crescent moon (static) */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={`0 0 100 ${H}`} aria-hidden="true">
          {Array.from({ length: 26 }, (_, i) => (
            <circle key={i} cx={(i * 37) % 100} cy={12 + ((i * 53) % 120)} r="0.25" fill="#55534e" />
          ))}
        </svg>
        <svg className="absolute right-[12%] top-8" width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
          <circle cx="23" cy="23" r="16" fill="none" stroke="#ecebe6" strokeWidth="1.2" />
          <circle cx="30" cy="18" r="14" fill="#0e0e0d" />
        </svg>

        {/* far ridge */}
        <Strip layer="far" width={STRIP}>
          <path
            d={`M0 ${GROUND - 40} L180 ${GROUND - 120} L330 ${GROUND - 70} L520 ${GROUND - 150} L700 ${GROUND - 80} L900 ${GROUND - 135} L1100 ${GROUND - 60} L1300 ${GROUND - 140} L1520 ${GROUND - 90} L1720 ${GROUND - 160} L1950 ${GROUND - 70} L2200 ${GROUND - 125} L2400 ${GROUND - 40} L2400 ${H} L0 ${H} Z`}
            fill="#121211"
            stroke="#2a2925"
            strokeWidth="1"
          />
        </Strip>

        {/* main scenery: city → forest → mountains */}
        <Strip layer="mid" width={STRIP}>
          {buildings.map((b, i) => (
            <g key={`b${i}`}>
              <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} fill="#141413" stroke="#3a3833" strokeWidth="1" />
              {b.windows.map((w, j) => (
                <rect key={j} x={w.x} y={w.y} width="4" height="6" fill={w.lit ? "#ff5a1f" : "#ecebe6"} opacity={w.lit ? 0.9 : 0.22} />
              ))}
            </g>
          ))}
          {trees.map((t, i) => {
            const a = r1(t.h * 0.22);
            const b = r1(t.h * 0.12);
            const c = r1(t.h * 0.3);
            const mid = r1(GROUND - t.h * 0.45);
            return (
              <g key={`t${i}`} opacity={t.back ? 0.55 : 1}>
                <path
                  d={`M${t.x} ${GROUND - t.h} L${r1(t.x + a)} ${mid} L${r1(t.x + b)} ${mid} L${r1(t.x + c)} ${GROUND - 8} L${r1(t.x - c)} ${GROUND - 8} L${r1(t.x - b)} ${mid} L${r1(t.x - a)} ${mid} Z`}
                  fill="#121211"
                  stroke="#4a4842"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <line x1={t.x} y1={GROUND - 8} x2={t.x} y2={GROUND} stroke="#4a4842" strokeWidth="1.2" />
              </g>
            );
          })}
          {peaks.map((p, i) => {
            const top = p.x + p.w / 2;
            return (
              <g key={`p${i}`}>
                <path d={`M${p.x} ${GROUND} L${top} ${GROUND - p.h} L${p.x + p.w} ${GROUND} Z`} fill="#131312" stroke="#4a4842" strokeWidth="1" strokeLinejoin="round" />
                <path
                  d={`M${r1(top - p.w * 0.11)} ${r1(GROUND - p.h * 0.78)} L${top} ${GROUND - p.h} L${r1(top + p.w * 0.11)} ${r1(GROUND - p.h * 0.78)} L${r1(top + p.w * 0.04)} ${r1(GROUND - p.h * 0.72)} L${r1(top - p.w * 0.03)} ${r1(GROUND - p.h * 0.8)} Z`}
                  fill="#ecebe6"
                  opacity="0.85"
                />
              </g>
            );
          })}
          {[
            { x: 30, t: "City" },
            { x: SEG + 30, t: "Forest" },
            { x: SEG * 2 + 20, t: "Mountains" },
          ].map((s) => (
            <g key={s.t}>
              <line x1={s.x} y1={GROUND} x2={s.x} y2={GROUND - 44} stroke="#8b8982" strokeWidth="1.2" />
              <rect x={s.x - 2} y={GROUND - 60} width={s.t.length * 9 + 14} height="18" fill="#0e0e0d" stroke="#8b8982" strokeWidth="1" />
              <text
                x={s.x + 5}
                y={GROUND - 47}
                fill="#ecebe6"
                style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {s.t}
              </text>
            </g>
          ))}
        </Strip>

        {/* road */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full"
          height={H - GROUND}
          preserveAspectRatio="none"
          viewBox={`0 0 1000 ${H - GROUND}`}
          aria-hidden="true"
        >
          <rect x="0" y="0" width="1000" height={H - GROUND} fill="#0b0b0c" />
          <line x1="0" y1="0.5" x2="1000" y2="0.5" stroke="#3a3833" strokeWidth="1" />
          <line data-dash x1="0" y1="30" x2="1000" y2="30" stroke="#55534e" strokeWidth="2" strokeDasharray="18 22" />
        </svg>

        <Rider />

        {/* fence posts + grass, the fastest layer */}
        <Strip layer="near" width={600}>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i}>
              <line x1={i * 120 + 20} y1={GROUND + 44} x2={i * 120 + 20} y2={H} stroke="#2a2925" strokeWidth="3" />
              <path d={`M${i * 120 + 60} ${H - 2} q 4 -14 8 0 q 4 -10 8 0`} fill="none" stroke="#2a2925" strokeWidth="1.5" />
            </g>
          ))}
          <line x1="0" y1={GROUND + 54} x2="600" y2={GROUND + 54} stroke="#1f1e1b" strokeWidth="1.5" />
        </Strip>
      </div>

      {rides.length > 0 && (
        <ul className="grid gap-x-8 border-t border-line sm:grid-cols-3">
          {rides.map((r, i) => (
            <li key={`${r.route}-${i}`} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
              <span className="serif text-[19px] italic text-fg/90">{r.route}</span>
              <span className="label shrink-0">{r.distance}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
