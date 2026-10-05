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
  // Flat filled style to match GymRep: off-white masses, near-black parts
  // outlined in off-white, #3a3833 definition lines, orange as solid blocks.
  const def = { fill: "none", stroke: "#3a3833", strokeWidth: 1.1, strokeLinecap: "round" as const };
  const line = { stroke: "#ecebe6", strokeWidth: 1.2, strokeLinejoin: "round" as const };
  const wheel = (cx: number) => (
    <g data-wheel style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx={cx} cy="-15" r="15" fill="#ecebe6" />
      <circle cx={cx} cy="-15" r="13.8" fill="#0b0b0c" />{/* tyre */}
      <circle cx={cx} cy="-15" r="9.6" fill="#ecebe6" />{/* rim */}
      <circle cx={cx} cy="-15" r="8.2" fill="#1a1a18" />
      {/* five cast spokes, so the spin reads */}
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={`M${cx - 1.4} -15 L${cx - 0.7} -22.6 L${cx + 0.7} -22.6 L${cx + 1.4} -15 Z`} fill="#8b8982" transform={`rotate(${a} ${cx} -15)`} />
      ))}
      <circle cx={cx} cy="-15" r="3.4" fill="#ecebe6" />
      <circle cx={cx} cy="-15" r="1.2" fill="#0b0b0c" />
    </g>
  );
  return (
    <svg
      viewBox="-92 -96 176 100"
      className="absolute"
      // viewBox runs 4 units below the contact point (4 × 149/100 ≈ 6px), so drop the svg by that much
      style={{ left: "33%", bottom: H - GROUND - 6, width: 262, height: 149 }}
      aria-hidden="true"
    >
      {/* speed lines */}
      {[0, 1, 2].map((i) => (
        <line key={`s${i}`} data-speed x1="-54" y1={-20 - i * 13} x2="-78" y2={-20 - i * 13} stroke="#55534e" strokeWidth="1.3" strokeLinecap="round" opacity="0" />
      ))}
      {/* exhaust puffs */}
      {[0, 1, 2].map((i) => (
        <circle key={`p${i}`} data-puff cx="-50" cy="-13" r="3.6" fill="#8b8982" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      ))}

      {wheel(-34)}
      {wheel(34)}

      <g data-body>
        {/* ── Roadster ── */}
        {/* mudguards */}
        <path d="M-53 -15 A19 19 0 0 1 -20.6 -28.4 L-22.3 -26.7 A16.5 16.5 0 0 0 -50.5 -15 Z" fill="#8b8982" />
        <path d="M18 -24.3 A18.5 18.5 0 0 1 50 -24.3 L48.3 -23.3 A16.5 16.5 0 0 0 19.7 -23.3 Z" fill="#8b8982" />
        {/* swingarm + twin rear shocks */}
        <path d="M-35 -17.5 L-9 -24.5 L-8 -19.5 L-34 -12.5 Z" fill="#ecebe6" />
        <path d="M-33 -18 L-29 -19 L-22 -39 L-26 -39 Z" fill="#8b8982" />
        <path d="M-30.5 -24 L-26 -25.5 M-29 -28.5 L-24.5 -30 M-27.5 -33 L-23 -34.5" stroke="#ff5a1f" strokeWidth="1.4" strokeLinecap="round" />
        {/* frame: downtube + backbone */}
        <path d="M21 -47 L26 -45 L13 -19 L8 -21 Z" fill="#ecebe6" />
        <path d="M-24 -38 L22 -47 L23 -43 L-22 -34 Z" fill="#ecebe6" />
        {/* parallel-twin engine with cooling fins */}
        <path d="M-12 -17 L-14 -33 L9 -36 L13 -22 L7 -15 L-7 -14 Z" fill="#0b0b0c" {...line} />
        <path d="M-11 -30 L9 -32.5 M-11 -26.5 L10.5 -29 M-11 -23 L11.5 -25.5" stroke="#8b8982" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="-3" cy="-18.5" r="3.6" fill="#8b8982" />
        {/* side panel under the seat */}
        <path d="M-25 -38 L-9 -38 L-11 -25 L-21 -27 Z" fill="#ecebe6" />
        <path d="M-21 -34 L-12 -34" {...def} />
        {/* exhaust: header sweeps under the engine into a peashooter */}
        <path d="M10 -27 Q 17 -10 2 -11 L -26 -11.5" fill="none" stroke="#8b8982" strokeWidth="3" strokeLinecap="round" />
        <path d="M-26 -14.5 L-50 -15.5 Q -52 -13 -50 -10.5 L-26 -8.5 Z" fill="#ecebe6" />
        <path d="M-30 -11.5 L-46 -12.5" {...def} />
        {/* bench seat + tail light */}
        <path d="M-6 -38 L-33 -39 Q -40 -39 -39 -43.5 L-33 -44.5 L-6 -43 Z" fill="#0b0b0c" {...line} />
        <rect x="-43" y="-42" width="4" height="3" rx="1" fill="#ff5a1f" />
        {/* teardrop fuel tank with badge */}
        <path d="M-8 -38 Q -7 -48 6 -49 Q 19 -50 25 -43 L24 -38.5 Q 8 -36 -8 -38 Z" fill="#ff5a1f" />
        <ellipse cx="9" cy="-42.5" rx="4" ry="2.3" fill="#0b0b0c" />
        <path d="M-4 -46 Q 6 -48.5 16 -47.5" fill="none" stroke="#ecebe6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        {/* front fork */}
        <path d="M24 -52 L28.5 -52 L36 -15 L31.5 -15 Z" fill="#ecebe6" />
        <path d="M31.5 -27 L34 -27" {...def} />
        {/* round headlight */}
        <circle className="bike-headlight" cx="36" cy="-46" r="10" fill="#ff5a1f" opacity="0.2" />
        <circle cx="33" cy="-46" r="5.6" fill="#ecebe6" />
        <circle cx="34" cy="-46" r="3.4" fill="#ff5a1f" />
        {/* handlebar */}
        <path d="M26 -52 L22 -56 L17 -56" fill="none" stroke="#ecebe6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* ── Rider ── */}
        {/* jeans: thigh along the tank, shin down to the peg */}
        <path d="M-24 -48 L4 -46 Q 9 -43 6 -38 L-18 -39 Z" fill="#0b0b0c" {...line} />
        <path d="M1 -45 Q 9 -43 7 -38 L0 -22 L-5 -23.5 Z" fill="#0b0b0c" {...line} />
        {/* boot on the peg */}
        <path d="M-8 -25 L2 -24 Q 5 -21 3 -19 L-8 -19.5 Z" fill="#ecebe6" />
        {/* jacket: back leaned towards the bars */}
        <path d="M-25 -45 L-9 -45 Q 2 -56 6 -66 Q 1 -74 -8 -72 Q -21 -63 -25 -45 Z" fill="#ecebe6" />
        <path d="M-15 -51 Q -7 -58 -2 -66" {...def} />
        <path d="M-24 -47 L-10 -47" {...def} />
        {/* neck + helmet */}
        <path d="M0 -73 L5 -73 L6 -69 L-1 -68 Z" fill="#ecebe6" />
        <path d="M-2 -79 Q -1 -89 7 -89 Q 15 -88 15 -79 L14 -73 L0 -72 Q -3 -75 -2 -79 Z" fill="#ecebe6" />
        <path d="M7 -82 L15 -81 L14.5 -76 L7 -76.5 Q 5 -79 7 -82 Z" fill="#0b0b0c" />{/* visor */}
        <path d="M0 -84 Q 6 -89 13 -86" fill="none" stroke="#ff5a1f" strokeWidth="2" strokeLinecap="round" />{/* helmet stripe */}
        {/* arm: shoulder → elbow → grip */}
        <path d="M-4 -70 Q 7 -67 13 -58 L8 -54 Q 3 -61 -5 -63 Z" fill="#ecebe6" />
        <path d="M8 -59 L18 -58 L18 -53.5 L8 -54 Z" fill="#ecebe6" />
        <path d="M-1 -64 Q 5 -62 9 -57" {...def} />
        <circle cx="18" cy="-56" r="3.4" fill="#0b0b0c" {...line} />{/* glove */}
        {/* scarf (anchored at the neck, flaps behind) */}
        <path
          data-scarf
          d="M4 -73 Q -6 -77 -16 -72 L-23 -67 L-16 -68.5 Q -8 -71 4 -69 Z"
          fill="#ff5a1f"
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
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox={`0 0 1400 ${H}`} aria-hidden="true">
          {Array.from({ length: 34 }, (_, i) => (
            <circle key={i} cx={(i * 397) % 1400} cy={14 + ((i * 53) % 130)} r={i % 5 === 0 ? 1.3 : 0.8} fill="#55534e" />
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
