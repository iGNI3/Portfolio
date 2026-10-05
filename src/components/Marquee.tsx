const ITEMS = [
  "Agentic AI",
  "Multi-agent systems",
  "AI for cybersecurity",
  "RAG & retrieval",
  "Tool calling · MCP",
  "Deep learning research",
  "Gym freak",
];

/** Infinite text band. Pure CSS — pauses on hover, stops for reduced motion. */
export default function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((t) => (
        <li key={t} className="flex items-center">
          <span className="serif px-8 text-[clamp(32px,5vw,72px)] italic leading-none text-fg/90">{t}</span>
          <span className="h-2 w-2 rounded-full bg-accent" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee overflow-hidden border-y border-line py-7" role="region" aria-label="Focus areas">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
