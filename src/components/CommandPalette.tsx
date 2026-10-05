"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "./Providers";
import { site, nav } from "@/content/site";
import { scrollToTarget } from "@/lib/scroll";

type Item = { id: string; label: string; hint: string; run: () => void };

/** ⌘K / Ctrl+K palette in liquid glass. Keyboard-first: ↑ ↓ Enter Esc. */
export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useApp();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: Item[] = useMemo(
    () => [
      ...nav.map((n) => ({
        id: n.href,
        label: `Go to ${n.label}`,
        hint: "Section",
        run: () => scrollToTarget(n.href),
      })),
      {
        id: "copy",
        label: "Copy email address",
        hint: site.email,
        run: () => {
          navigator.clipboard
            ?.writeText(site.email)
            .then(() => flash("Email copied"))
            .catch(() => flash("Copy failed"));
        },
      },
      ...site.links.filter((l) => !l.hidden).map((l) => ({
        id: l.href,
        label: `Open ${l.label}`,
        hint: "External",
        run: () => window.open(l.href, "_blank", "noopener,noreferrer"),
      })),
      {
        id: "top",
        label: "Back to top",
        hint: "Scroll",
        run: () => scrollToTarget(0),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase().trim()));

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  // Global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      } else if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  useEffect(() => setActive(0), [query]);

  function choose(item?: Item) {
    if (!item) return;
    setPaletteOpen(false);
    // wait for the exit animation so scroll isn't locked
    window.setTimeout(item.run, 180);
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[active]);
    }
  }

  return (
    <>
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 pt-[18vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Command menu"
              className="glass glass-refract relative w-full max-w-[560px] overflow-hidden rounded-[22px]"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <span className="label !text-accent">›</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onListKey}
                  placeholder="Type a command or search…"
                  aria-label="Search commands"
                  className="w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
                />
                <kbd className="label rounded border border-white/10 px-1.5 py-0.5">Esc</kbd>
              </div>
              <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
                {filtered.length === 0 && <li className="label px-3 py-6 text-center">No matches</li>}
                {filtered.map((item, i) => (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className="relative flex cursor-pointer items-center justify-between rounded-[12px] px-3 py-3 text-[14px]"
                  >
                    {i === active && (
                      <motion.span
                        layoutId="palette-active"
                        className="absolute inset-0 rounded-[12px] bg-white/[0.07]"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative">{item.label}</span>
                    <span className="label relative max-w-[45%] truncate">{item.hint}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="glass fixed bottom-6 left-1/2 z-[75] -translate-x-1/2 rounded-full px-5 py-2.5 text-[13px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
