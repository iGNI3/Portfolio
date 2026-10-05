# Ankit Kumar Das — Portfolio

Dark, editorial, motion-first portfolio. Next.js + GSAP + anime.js + Motion, with liquid glass used only where it belongs (nav, command menu, toast).

---

## Run it

Needs **Node.js 20+** (check with `node -v`).

```bash
cd "C:\Users\Admin\Desktop\port folio"
npm install
npm run dev
```

Open http://localhost:3000.

Production check: `npm run build && npm start`.

## Edit your content

**Everything lives in `src/content/site.ts`.** You shouldn't need to touch components to update text.

Content is filled in from your CV. One thing is left: drop your updated CV into `public/cv.pdf`, then set `hidden: false` on the Résumé link in `site.links`.

The "Open to new roles" badge and the "Looking for" line are controlled by `site.available`. Set it to `false` if you don't want your current employer to see it.

## Deploy (free)

1. Push this folder to a GitHub repo.
2. Go to vercel.com, choose **Import Project**, pick the repo. No settings needed.
3. Optional: add a custom domain in Vercel.

---

## What's in it

| Section | Motion |
|---|---|
| Intro | anime.js counter 000→100, then the panel wipes up (once per session, skipped for reduced motion) |
| Hero | anime.js staggered masked-line reveal; the role decodes like scrambled text; GSAP scroll fade on the name |
| Marquee | CSS infinite band, pauses on hover |
| Selected work | **GSAP ScrollTrigger pin and horizontal scrub** on desktop; plain vertical stack on mobile |
| Project visuals | anime.js grid-stagger ripple (follows your pointer) · anime.js SVG line drawing and motion path (RAG pipeline) · code typed in line by line |
| About | GSAP scrubbed word-by-word light-up while scrolling |
| Experience | Motion `layoutId` tab pill and accordion rows with `AnimatePresence` |
| Capabilities | GSAP staggered rise on scroll |
| Contact | Masked headline reveal, magnetic email button, letter-flip links |
| Global | Lenis smooth scroll driven by the GSAP ticker (one loop), custom cursor with labels, **⌘K / Ctrl+K command menu**, film grain, live IST clock |

### Design rules

- **One accent colour** (signal orange `#ff5a1f`) on near-black and warm off-white. No gradients, no emoji, no icon packs. Arrows are typed characters.
- **Type does the work:** Instrument Serif italic for voice, Geist for structure, Geist Mono for labels.
- **Glass only on chrome-level UI** (nav, command menu, toast), never on content. Chromium gets real SVG refraction; Safari and Firefox get a blur fallback; `prefers-reduced-transparency` gets solid panels.
- **Accessibility:** `prefers-reduced-motion` turns off smooth scroll, the intro, pinning and reveals. There's a skip link, keyboard-driven menus, visible focus rings, and the page still works without JavaScript.
- **Performance:** only `transform`/`opacity`/`clip-path` are animated; one rAF loop; fonts self-hosted by `next/font`.

## File map

```
src/
  app/
    layout.tsx        fonts, metadata, no-JS fallback
    page.tsx          section order
    globals.css       tokens, glass, grain, reel layout
    icon.svg          favicon
  content/site.ts     ← ALL CONTENT
  lib/
    gsap.ts           plugin registration
    scroll.ts         shared Lenis + scrollTo helper
  components/
    Providers.tsx     Lenis↔GSAP loop, intro state, cursor, ⌘K
    Preloader.tsx  Nav.tsx  Hero.tsx  Marquee.tsx  Work.tsx
    About.tsx  Experience.tsx  Capabilities.tsx  Contact.tsx
    CommandPalette.tsx  Cursor.tsx  Magnetic.tsx  ScrambleText.tsx
    LocalTime.tsx  GlassFilter.tsx  SectionHead.tsx
    visuals/          DotGrid · RagFlow · CodeCard
```

---

## Research notes: why this stack

| Library | Role here | Why |
|---|---|---|
| **Next.js 15** (App Router, TS) | Framework | SSR/SEO, `next/font`, free Vercel hosting. The usual base for award-level portfolios. |
| **GSAP 3.13 + ScrollTrigger** (`@gsap/react`) | Scroll choreography | The best tool for pinning and scrubbed timelines. Since the Webflow acquisition (2025), every GSAP plugin is free, including SplitText and MorphSVG. |
| **Lenis** | Smooth scroll | Normalises wheel and trackpad input. Synced to the GSAP ticker so there's one animation loop, not three competing ones. |
| **anime.js v4** | Micro-motion, SVG | Small and modular. `stagger({grid})`, `svg.createDrawable`, `svg.createMotionPath` and timelines are perfect for diagram and text effects. |
| **Motion** (formerly Framer Motion, `motion/react`) | UI state transitions | `AnimatePresence`, `layoutId`, springs and gestures: the cleanest way to animate React state (menus, tabs, cursor, palette). |
| **Tailwind CSS v4** | Styling | CSS-first `@theme` tokens; no config file. |

**Considered, not used:**

- **Material UI.** It's great for dashboards, but its Material look fights a bespoke editorial design, and it adds about 90 KB. If you want MUI-quality accessible primitives later, use **Base UI** (MUI's unstyled library) and keep this styling.
- **Claymorphism.** Soft 3D clay depth suits friendly or children's products and light pastel palettes. Research guidance says to avoid it for serious or technical tones, and it clashes with dark editorial. Keep it for a separate light-theme experiment.
- **Framer (the site builder).** Fast no-code publishing, but you can't version it in Git or show the code. For an engineer's portfolio, the code is part of the pitch. The **Motion** library (Framer Motion's successor) gives you Framer-grade animation inside your own code.
- **React Three Fiber / WebGL.** Easy to add later as a hero background. Left out to keep first paint fast.

### Ideas for v2

- Case-study pages per project (`/work/[slug]`) with Motion shared-layout transitions from the reel card.
- A WebGL hero: a slow shader field that reacts to the cursor (React Three Fiber, lazy-loaded).
- A blog (`/notes`) with MDX for write-ups on agents, RAG and AI security.
- A light theme with a clay variant, using a `data-theme` toggle in the ⌘K menu.

### Sources

- Award-winning portfolio stack and principles: https://www.hontran.dev/blog/how-to-build-an-award-winning-portfolio-site
- anime.js v4 docs: https://animejs.com/documentation/getting-started
- Motion for React guide (2026): https://dev.to/stacknotice/framer-motion-motion-react-animations-complete-guide-2026-3e7l
- Liquid glass CSS recipes, browser caveats: https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026
- Liquid glass with CSS + SVG: https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/
- Claymorphism guide: https://preview.setproduct.com/blog/claymorphism-design-guide
- Pigment CSS / MUI direction: https://mui.com/blog/introducing-pigment-css/
- Developer portfolio examples: https://webflow.com/blog/web-developer-portfolio-examples
