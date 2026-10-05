/** Consistent section header: numbered mono label + rule. */
export default function SectionHead({ index, title, aside }: { index: string; title: string; aside?: string }) {
  return (
    <div className="section-head mb-14 flex items-center gap-4 sm:mb-20">
      <span className="label !text-accent">({index})</span>
      <h2 className="label !text-fg">{title}</h2>
      <span className="h-px flex-1 bg-line" />
      {aside && <span className="label hidden sm:inline">{aside}</span>}
    </div>
  );
}
