"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/scroll";

/* Side-profile photographer in flat, filled vector style (solid shapes,
   minimal outlines, simple face). Faces right, toward the photo table.
   Same character as the gym block: spiky hair + orange headband. */

const SHOT_MS = 2800;
const SKIN = "#ecebe6";
const SKIN_SHADE = "#d9d7d0";
const HAIR = "#1c1b19";
const JACKET = "#2c2b28";
const PANTS = "#3d3c38";
const INK = "#0b0b0c";
const ORANGE = "#ff5a1f";
const RIM = { stroke: SKIN, strokeOpacity: 0.28, strokeWidth: 1 };

export default function Photographer() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || prefersReducedMotion()) return;
    const q = (s: string) => el.querySelectorAll(s);
    const frame = el.querySelector("[data-frame]");
    let n = 1;

    const idle = [
      animate(q("[data-body]"), { translateY: [0, -1.5, 0], duration: 2000, ease: "inOutSine", loop: true }),
      animate(q("[data-tail]"), { rotate: [-6, 6, -6], duration: 1600, ease: "inOutSine", loop: true }),
      animate(q("[data-spike]"), { rotate: [-2, 2, -2], duration: 2400, ease: "inOutSine", loop: true, delay: stagger(120) }),
    ];

    const shoot = () => {
      n = (n % 36) + 1;
      if (frame) frame.textContent = `FRAME ${String(n).padStart(2, "0")} / 36`;
      animate(q("[data-lean]"), { rotate: [0, 1.6, 0], duration: 600, ease: "outQuad" });
      animate(q("[data-finger]"), { translateY: [0, 2, 0], duration: 200, ease: "inOutQuad" });
      animate(q("[data-bulb]"), { fill: [ORANGE, "#f2f0ea"], duration: 600, ease: "outQuad" });
      animate(q("[data-ring]"), { stroke: [SKIN, ORANGE], duration: 700, ease: "outQuad" });
      animate(q("[data-ray]"), { scale: [0.3, 1.5], opacity: [1, 0], duration: 600, delay: stagger(35), ease: "outExpo" });
      animate(q("[data-beam]"), { opacity: [0, 0.22, 0], scaleX: [0.6, 1], duration: 520, ease: "outQuad" });
      animate(q("[data-print]"), {
        opacity: [0, 1, 1, 0],
        translateX: [0, 70],
        translateY: [0, -38, -6],
        rotate: [0, 22],
        duration: 1400,
        ease: "outQuad",
      });
      animate(q("[data-smile]"), { scaleX: [1, 1.25, 1], duration: 900, ease: "outElastic(1, .5)" });
    };

    let interval = 0;
    const first = window.setTimeout(() => {
      shoot();
      interval = window.setInterval(shoot, SHOT_MS);
    }, 800);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      idle.forEach((a) => a.pause());
    };
  }, [inView]);

  return (
    <svg ref={ref} viewBox="0 0 320 360" className="w-full max-w-[380px]" role="img" aria-label="Illustrated photographer in side profile, taking a photo with the flash firing">
      {/* backdrop disc so the dark kit reads */}
      <circle cx="160" cy="196" r="136" fill="#151513" />
      <ellipse cx="156" cy="328" rx="72" ry="7" fill={INK} opacity="0.6" />

      {/* light beam from the lens (shown on each shot) */}
      <path data-beam d="M269 90 L320 56 L320 128 Z" fill={SKIN} opacity="0" style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }} />

      <g data-body>
        <g data-lean style={{ transformBox: "view-box", transformOrigin: "150px 326px" }}>
          {/* far arm (behind the body) */}
          <path d="M150 134 L180 150 L188 162 L156 147 Z" fill="#232220" />
          <path d="M180 152 L205 104 L216 109 L190 158 Z" fill="#232220" />
          <circle cx="212" cy="102" r="7" fill={SKIN_SHADE} />

          {/* legs: back leg braced, front knee driven forward */}
          <path d="M128 218 L150 222 L142 280 L138 322 L121 322 L124 278 Z" fill="#33322e" />
          <path d="M144 218 L168 222 L184 266 L166 276 Z" fill={PANTS} />
          <path d="M166 268 L184 262 L180 322 L163 322 Z" fill={PANTS} />
          <path d="M170 232 Q 178 250 180 262" fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="1.2" />
          {/* chunky shoes with light soles */}
          <path d="M112 322 L142 322 L143 316 Q 141 309 131 310 L117 313 Q 111 315 112 322 Z" fill={INK} />
          <rect x="111" y="321" width="33" height="5" rx="2" fill={SKIN} />
          <path d="M160 322 L196 322 Q 197 311 184 310 L165 312 Q 159 315 160 322 Z" fill={INK} />
          <rect x="159" y="321" width="39" height="5" rx="2" fill={SKIN} />

          {/* torso: jacket with the tee showing at the front */}
          <path d="M131 134 Q 150 123 167 132 L 175 160 Q 178 196 169 226 L 126 226 Q 120 190 124 160 Z" fill={JACKET} {...RIM} />
          <path d="M164 138 Q 175 170 168 222 L 160 222 Q 167 178 157 142 Z" fill={SKIN} />
          <path d="M129 198 L144 198" stroke={ORANGE} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M138 140 L148 160 L142 168" fill="none" stroke={SKIN} strokeOpacity="0.2" strokeWidth="1.2" />
          <rect x="124" y="219" width="47" height="7" rx="2" fill={INK} />
          {/* camera strap */}
          <path d="M206 108 Q 192 152 170 160 Q 150 164 135 142" fill="none" stroke={ORANGE} strokeWidth="2.2" />

          {/* head: skull + face profile (brow, nose, lips, chin) + neck */}
          <path
            d="M150 70 Q 168 61 182 73 Q 186 79 186 84 L 188 88 L 195 99 L 189 102 L 189 106 L 191 109 L 188 112 L 189 116 L 184 122 Q 176 127 166 125 L 161 134 L 149 134 L 149 121 Q 135 112 137 92 Q 139 76 150 70 Z"
            fill={SKIN}
          />
          <path d="M150 120 Q 160 126 168 124 L 162 133 L 150 133 Z" fill={SKIN_SHADE} />
          <ellipse cx="155" cy="99" rx="4.5" ry="6.5" fill={SKIN_SHADE} />
          <path d="M156 95 Q 153 99 156 103" fill="none" stroke="#8b8982" strokeWidth="1.1" strokeLinecap="round" />
          {/* face details */}
          <path d="M175 85 L 186 83" stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M178 92 Q 182 90 186 92" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" />
          <path d="M189 102 Q 186 103 185 101" fill="none" stroke="#8b8982" strokeWidth="1.1" strokeLinecap="round" />
          <path data-smile d="M180 113 Q 184 116 188 112" fill="none" stroke="#5a5852" strokeWidth="1.6" strokeLinecap="round" style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }} />

          {/* hair: full mass, swept-back anime spikes + fringe */}
          <path
            d="M137 96 Q 133 74 150 65 Q 168 57 184 70 L 187 80 Q 181 76 176 78 L 172 72 L 168 79 Q 160 77 152 82 L 147 90 L 141 99 Z"
            fill={HAIR}
            {...RIM}
          />
          {[
            "M150 66 L 128 58 L 142 72 Z",
            "M141 74 L 118 72 L 137 84 Z",
            "M139 86 L 120 92 L 139 95 Z",
            "M162 61 L 150 46 L 170 63 Z",
            "M175 64 L 172 50 L 182 69 Z",
          ].map((d, i) => (
            <path key={i} data-spike d={d} fill={HAIR} {...RIM} style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }} />
          ))}
          {/* signature headband hugging the forehead, knotted at the back */}
          <path d="M148 84 Q 166 76 185 81 L 185 86 Q 166 81 149 90 Z" fill={ORANGE} />
          <g data-tail style={{ transformBox: "fill-box", transformOrigin: "100% 0%" }}>
            <path d="M147 87 Q 138 88 130 95" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
            <path d="M147 89 Q 140 94 135 101" fill="none" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" />
          </g>

          <g transform="translate(6 0)">
            {/* camera held to the eye */}
            <rect x="189" y="77" width="52" height="31" rx="5" fill={INK} {...RIM} />
            <rect x="203" y="69" width="20" height="9" rx="2" fill={INK} {...RIM} />
            <rect data-bulb x="226" y="71" width="11" height="7" rx="1.5" fill="#f2f0ea" />
            <rect x="241" y="80" width="21" height="25" rx="3" fill="#1a1a18" {...RIM} />
            <rect data-ring x="245" y="80" width="3" height="25" fill="none" stroke={SKIN} strokeWidth="2" />
            <ellipse cx="263" cy="92.5" rx="3.5" ry="12" fill="#232220" stroke={SKIN} strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="196" cy="84" r="2" fill={ORANGE} />
            <rect data-finger x="209" y="66" width="8" height="5" rx="2" fill={SKIN} />
          </g>

          {/* near arm (in front): thicker sleeve, elbow tucked forward */}
          <path d="M139 136 L176 160 L182 176 L148 152 Z" fill={JACKET} {...RIM} />
          <path d="M172 164 L236 106 L247 117 L183 175 Z" fill={JACKET} {...RIM} />
          <path d="M231 112 L241 121" stroke={SKIN} strokeOpacity="0.35" strokeWidth="2" />
          <ellipse cx="246" cy="111" rx="8.5" ry="7" fill={SKIN} />

          {/* flash rays */}
          {Array.from({ length: 7 }, (_, i) => {
            const a = (-70 + i * 20) * (Math.PI / 180);
            const ox = 237.5;
            const oy = 72;
            return (
              <line
                key={i}
                data-ray
                x1={(ox + Math.cos(a) * 9).toFixed(1)}
                y1={(oy + Math.sin(a) * 9).toFixed(1)}
                x2={(ox + Math.cos(a) * 19).toFixed(1)}
                y2={(oy + Math.sin(a) * 19).toFixed(1)}
                stroke={ORANGE}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0"
                style={{ transformBox: "view-box", transformOrigin: `${ox}px ${oy}px` }}
              />
            );
          })}

          {/* print that flies off toward the table */}
          <g data-print style={{ opacity: 0 }}>
            <rect x="232" y="40" width="24" height="28" rx="1.5" fill="#f2f0ea" />
            <rect x="235" y="43" width="18" height="16" fill="#3a3833" />
          </g>
        </g>
      </g>

      <text data-frame x="44" y="352" fill="#8b8982" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>
        FRAME 01 / 36
      </text>
      <text x="276" y="352" textAnchor="end" fill="#8b8982" style={{ font: "9px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}>
        f/1.8 · 1/250s
      </text>
    </svg>
  );
}
