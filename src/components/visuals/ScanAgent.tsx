"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, createTimeline, stagger, svg } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

/* Agent on the left, target host on the right. A looping storyboard plays the
   pentest cycle as an abstract motion graphic — recon, port scan, craft the
   test payload, probe an open port, report the finding. Conceptual only. */

const AX = 70;
const AY = 165;
const HX = 250; // host left
const HW = 180;
const HY = 60; // host top
const HH = 220;

// Ports listed down the host (standard numbers; two left open)
const PORTS = [
  { p: ":22", open: true },
  { p: ":80", open: false },
  { p: ":443", open: false },
  { p: ":3306", open: false },
  { p: ":8080", open: true },
  { p: ":5432", open: false },
];
const ROW0 = HY + 54;
const RGAP = 30;
const portY = (i: number) => ROW0 + i * RGAP;
const TARGET_PORT = 4; // :8080 — where the probe lands

const PHASES = ["Recon", "Scan ports", "Craft payload", "Probe", "Report"];

export default function ScanAgent() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || prefersReducedMotion()) return;
    const $ = <T extends Element>(s: string) => el.querySelector<T>(s);
    const $$ = (s: string) => el.querySelectorAll(s);

    const phase = $<SVGTextElement>("[data-phase]");
    const bar = $<SVGRectElement>("[data-bar]");
    const count = $<SVGTextElement>("[data-count]");
    const setPhase = (i: number) => {
      if (phase) phase.textContent = PHASES[i].toUpperCase();
      if (bar) bar.setAttribute("width", String(6 + ((i + 1) / PHASES.length) * 150));
    };

    const show = (sel: string, v: number) => $$(sel).forEach((n) => ((n as HTMLElement).style.opacity = String(v)));

    const tl = createTimeline({ loop: true, defaults: { ease: "outQuad" } });

    // reset
    tl.add({}, {
      duration: 1,
      onBegin: () => {
        setPhase(0);
        if (count) count.textContent = "0";
        show("[data-port]", 0.25);
        show("[data-open]", 0);
        show("[data-payload]", 0);
        show("[data-found]", 0);
        show("[data-lock-open]", 0);
        show("[data-lock-closed]", 1);
        $$("[data-port-dot]").forEach((n) => n.setAttribute("fill", "#55534e"));
      },
    }, 0);

    // 1 — RECON: sonar rings sweep toward the host, host frame draws in
    tl.add("[data-sonar]", { scale: [0.2, 3.4], opacity: [0.7, 0], duration: 1300, delay: stagger(260) }, 0);
    const host = $<SVGPathElement>("[data-host]");
    if (host) tl.add(svg.createDrawable(host), { draw: ["0 0", "0 1"], duration: 1100 }, 200);

    // 2 — SCAN PORTS: rows reveal, a scan bar runs down, open ports light up
    tl.add({}, { duration: 1, onBegin: () => setPhase(1) }, 1500);
    tl.add("[data-port]", { opacity: [0.1, 1], translateX: [8, 0], duration: 420, delay: stagger(90) }, 1500);
    tl.add("[data-scanbar]", { translateY: [0, (PORTS.length - 1) * RGAP], opacity: [0, 1, 1, 0], duration: 1300, ease: "inOutSine" }, 1600);
    let seen = 0;
    PORTS.forEach((p, i) => {
      if (!p.open) return;
      const oi = seen++;
      tl.add(`[data-open-idx="${oi}"]`, { opacity: [0, 1], duration: 300 }, 1700 + i * 170);
      tl.add({}, { duration: 1, onBegin: () => $$("[data-port-dot]")[i]?.setAttribute("fill", "#ff5a1f") }, 1700 + i * 170);
    });

    // 3 — CRAFT PAYLOAD: pieces assemble into a packet by the agent
    tl.add({}, { duration: 1, onBegin: () => setPhase(2) }, 3100);
    tl.add("[data-piece]", { opacity: [0, 1], scale: [0.3, 1], translateX: (_: unknown, i: number) => [[-14, 12, -10, 14][i] ?? 0, 0], translateY: (_: unknown, i: number) => [[-12, -14, 12, 10][i] ?? 0, 0], duration: 500, delay: stagger(90), ease: "outBack(2)" }, 3100);
    tl.add("[data-packet-label]", { opacity: [0, 1], duration: 300 }, 3500);

    // 4 — PROBE: packet flies agent → open port, the lock clicks open
    tl.add({}, { duration: 1, onBegin: () => setPhase(3) }, 3900);
    tl.add("[data-payload]", { opacity: 0, duration: 200 }, 3900);
    const beam = $<SVGPathElement>("[data-beam]");
    const packet = $<SVGCircleElement>("[data-packet]");
    if (beam) tl.add(svg.createDrawable(beam), { draw: ["0 0", "0 1"], duration: 500 }, 3950);
    if (beam && packet) tl.add(packet, { ...svg.createMotionPath(beam), opacity: [0, 1, 1, 1], duration: 900, ease: "inOutSine" }, 4050);
    // lock opens on arrival
    tl.add("[data-lock-closed]", { opacity: [1, 0], duration: 250 }, 4850);
    tl.add("[data-lock-open]", { opacity: [0, 1], scale: [0.8, 1], duration: 350, ease: "outBack(2)" }, 4850);
    tl.add("[data-breach]", { scale: [0.5, 2.4], opacity: [0.8, 0], duration: 700 }, 4900);

    // 5 — REPORT: finding chip + severity, count ticks to 1
    tl.add({}, { duration: 1, onBegin: () => setPhase(4) }, 5500);
    tl.add("[data-found]", { opacity: [0, 1], translateY: [10, 0], duration: 450, ease: "outBack(2)" }, 5500);
    tl.add("[data-sev]", { scaleX: [0, 1], duration: 600, delay: stagger(120) }, 5700);
    tl.add({}, { duration: 1, onBegin: () => { if (count) count.textContent = "1"; } }, 5700);

    tl.add({}, { duration: 900 }); // hold, then loop

    return () => tl.pause();
  }, [inView]);

  let openSeen = 0;

  return (
    <svg ref={ref} viewBox="0 0 470 330" style={{ width: "min(470px, 100%, 58svh)" }} role="img" aria-label="An agent running the test cycle on a target: recon, port scan, craft payload, probe an open port, report the finding">
      {/* ── Agent ── */}
      {[0, 1, 2].map((i) => (
        <circle key={i} data-sonar cx={AX} cy={AY} r="12" fill="none" stroke="#ff5a1f" strokeWidth="1.2" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: 0 }} />
      ))}
      <circle cx={AX} cy={AY} r="11" fill="#0b0b0c" stroke="#ff5a1f" strokeWidth="1.6" />
      <circle cx={AX} cy={AY} r="3.5" fill="#ff5a1f" />
      <text x={AX} y={AY + 30} textAnchor="middle" fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>AGENT</text>

      {/* payload assembling by the agent */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} data-piece data-payload x={AX - 10 + (i % 2) * 11} y={AY + 48 + Math.floor(i / 2) * 11} width="9" height="9" rx="2" fill="none" stroke="#ecebe6" strokeWidth="1.2" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: 0 }} />
        ))}
        <text data-payload data-packet-label x={AX} y={AY + 84} textAnchor="middle" fill="#8b8982" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.12em", opacity: 0 }}>PAYLOAD</text>
      </g>

      {/* beam + travelling packet */}
      <path data-beam d={`M${AX + 12} ${AY} C ${AX + 90} ${AY}, ${HX - 40} ${portY(TARGET_PORT)}, ${HX + 8} ${portY(TARGET_PORT)}`} fill="none" stroke="#ff5a1f" strokeWidth="1" opacity="0.4" />
      <circle data-packet r="4" cx="0" cy="0" fill="#ff5a1f" opacity="0" />

      {/* ── Host ── */}
      <path data-host d={`M${HX + 12} ${HY} L${HX + HW - 12} ${HY} Q${HX + HW} ${HY} ${HX + HW} ${HY + 12} L${HX + HW} ${HY + HH - 12} Q${HX + HW} ${HY + HH} ${HX + HW - 12} ${HY + HH} L${HX + 12} ${HY + HH} Q${HX} ${HY + HH} ${HX} ${HY + HH - 12} L${HX} ${HY + 12} Q${HX} ${HY} ${HX + 12} ${HY} Z`} fill="none" stroke="#2a2925" strokeWidth="1.2" />
      <text x={HX} y={HY - 10} fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>TARGET HOST</text>

      {/* lock top-right of host */}
      <g transform={`translate(${HX + HW - 30} ${HY + 18})`}>
        <g data-lock-closed>
          <path d="M-6 0 a6 6 0 0 1 12 0 v4" fill="none" stroke="#8b8982" strokeWidth="1.6" />
          <rect x="-8" y="4" width="16" height="12" rx="2" fill="#0b0b0c" stroke="#8b8982" strokeWidth="1.4" />
        </g>
        <g data-lock-open style={{ transformBox: "fill-box", transformOrigin: "center", opacity: 0 }}>
          <path d="M-6 0 a6 6 0 0 1 12 0" fill="none" stroke="#ff5a1f" strokeWidth="1.6" transform="translate(-9 -2) rotate(-28)" />
          <rect x="-8" y="4" width="16" height="12" rx="2" fill="#0b0b0c" stroke="#ff5a1f" strokeWidth="1.5" />
        </g>
        <circle data-breach cx="0" cy="10" r="6" fill="none" stroke="#ff5a1f" strokeWidth="1.2" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: 0 }} />
      </g>

      {/* ports */}
      {PORTS.map((pt, i) => {
        const y = portY(i);
        const isOpen = pt.open;
        const openIdx = isOpen ? openSeen++ : -1;
        return (
          <g key={i}>
            <g data-port style={{ opacity: 0.25 }}>
              <circle data-port-dot cx={HX + 20} cy={y} r="3" fill="#55534e" />
              <text x={HX + 32} y={y + 4} fill="#ecebe6" style={{ font: "11px var(--font-geist-mono), monospace", letterSpacing: "0.08em" }}>{pt.p}</text>
              <rect x={HX + 86} y={y - 3} width={HW - 100} height="5" rx="2.5" fill="#1f1e1b" />
            </g>
            {isOpen && (
              <text data-open data-open-idx={openIdx} x={HX + HW - 14} y={y + 4} textAnchor="end" fill="#ff5a1f" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.1em", opacity: 0 }}>OPEN</text>
            )}
          </g>
        );
      })}

      {/* scan bar over the port column */}
      <rect data-scanbar x={HX + 12} y={ROW0 - 10} width={HW - 24} height="2" fill="#ecebe6" opacity="0" />

      {/* finding chip */}
      <g data-found style={{ opacity: 0 }}>
        <rect x={HX} y={HY + HH + 14} width="150" height="22" rx="5" fill="#ff5a1f" />
        <text x={HX + 10} y={HY + HH + 29} fill="#0b0b0c" style={{ font: "600 10px var(--font-geist-mono), monospace", letterSpacing: "0.08em" }}>VULNERABILITY FOUND</text>
        {[0, 1, 2].map((i) => (
          <rect key={i} data-sev x={HX + 160 + i * 12} y={HY + HH + 18} width="8" height="14" rx="2" fill="#ff5a1f" style={{ transformBox: "fill-box", transformOrigin: "left center" }} />
        ))}
      </g>

      {/* phase + progress + findings count */}
      <text data-phase x={AX - 44} y="312" fill="#ecebe6" style={{ font: "12px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>RECON</text>
      <rect x={AX - 44} y="320" width="156" height="2" fill="#24231f" />
      <rect data-bar x={AX - 44} y="320" width="6" height="2" fill="#ff5a1f" />
      <text x="452" y="312" textAnchor="end" fill="#8b8982" style={{ font: "10px var(--font-geist-mono), monospace", letterSpacing: "0.12em" }}>
        FINDINGS&nbsp;<tspan data-count fill="#ff5a1f">0</tspan>
      </text>
    </svg>
  );
}
