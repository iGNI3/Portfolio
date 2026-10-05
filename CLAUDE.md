# CLAUDE.md — Ankit's portfolio

Personal portfolio for Ankit Kumar Das (AI/ML Engineer). Dark editorial design, motion-first, built to support a job search for AI/ML and GenAI engineering roles.

## Status

- All code was written in a cloud session where `npm install` was blocked, so **it has never been run**. First job: run `npm install` and `npm run dev`, then fix any build or runtime errors.
- After that, check `npm run build` passes and the site works at desktop (≥1024px) and phone (~375px) widths.

## Commands

- `npm install`
- `npm run dev` (http://localhost:3000)
- `npm run build`
- `npm start`

## Stack

- Next.js 15 (App Router, TypeScript), React 19
- Tailwind CSS v4: CSS-first, tokens in `@theme inline` inside `src/app/globals.css`, no `tailwind.config`
- GSAP 3 + ScrollTrigger via `@gsap/react` (`useGSAP`), registered in `src/lib/gsap.ts`
- Lenis smooth scroll, driven by the GSAP ticker in `src/components/Providers.tsx` (single rAF loop). The shared instance is in `src/lib/scroll.ts`; use `scrollToTarget()` for programmatic scrolling.
- anime.js v4 (`animate`, `stagger`, `svg.createDrawable`, `svg.createMotionPath`) for the intro, hero reveal and project visuals
- Motion (`motion/react`) for React state transitions: menus, tabs, cursor, command palette, magnetic buttons
- Fonts via `next/font/google`: Instrument Serif (voice), Geist (structure), Geist Mono (labels)

## Where things live

- `src/content/site.ts`: **all content.** Edit text here, not in components.
- `src/app/page.tsx`: section order
- `src/app/globals.css`: tokens, glass, grain, marquee, the work-reel media query
- `src/components/`: one file per section, plus `CommandPalette`, `Cursor`, `Magnetic`, `ScrambleText`, `LocalTime`, `GlassFilter`, `Preloader`, `Providers`
- `src/components/life/`: hobby visuals. TravelRoute (anime.js route drawing and motion path), BikeRide (line-drawn bike, spinning wheels, odometer) and PhotoStack (anime.js `createDraggable` prints).
- `src/components/visuals/`: per-project visuals (DotGrid, Pipeline, StatCounter, CodeCard), selected by `visual.kind` in `site.ts`

## Design rules (keep these)

- **Colour:** near-black `#0b0b0c`, warm off-white `#ecebe6`, and one accent, signal orange `#ff5a1f`. No other accent colours.
- No gradients (except the 1px underline helper), no emoji, no icon libraries. Use typed arrows (→ ↗ ↓).
- Liquid glass (`.glass`) only on chrome-level UI: nav, command menu, toast. Never on content cards. Chromium-only SVG refraction is gated by `html[data-refract="true"]`.
- Type does the work: big tight sans for titles, serif italic for accents, mono uppercase `.label` for metadata.
- Animate only transform, opacity and clip-path. Don't animate blur.
- Every animation must respect `prefersReducedMotion()`. The work reel's horizontal pin only runs under `(min-width:1024px) and (min-height:620px) and (prefers-reduced-motion: no-preference)` (keep `REEL_QUERY` in Work.tsx in sync); otherwise it's a vertical stack.
- Custom CSS sits in `@layer base` / `@layer components` so Tailwind utilities can override it. Unlayered CSS beats utilities, so keep unlayered rules to things utilities never set.

## Content rules

- Don't invent metrics, employers, dates or projects. Every figure in `site.ts` comes from Ankit's CV.
- Describe Prahar AI only at a high level (an autonomous AI security-testing agent, private to TurtleNeck). No technical attack details.
- `site.available` controls the "Open to new roles" badge and the "Looking for" line.

## Open TODOs

- Content is filled in from Ankit's CV (Oct 2026). Claude Code added `moreProjects` and `MoreProjects.tsx`.
- The CV PDF isn't added yet. Once Ankit uploads the updated CV, put it at `public/cv.pdf` and set `hidden: false` on the Résumé link.
- Add repo URLs for "AI CRM Assistant for Odoo" and "repo-agent" in `moreProjects`.
- **Off the clock (hobbies, section 05)** in `offTheClock` in `site.ts`. These parts are still placeholders:
  - travel place names and years
  - the bike model, total km and rides
  - photos (`public/photos/01.jpg` … `05.jpg`) and their captions
- `src/components/visuals/RagFlow.tsx` is a leftover re-export of `Pipeline.tsx` and is safe to delete.

## Ideas for v2

- `/work/[slug]` case-study pages with Motion shared-layout transitions
- A lazy-loaded React Three Fiber hero
- An MDX `/notes` blog
- A light/clay theme toggle in the ⌘K menu
