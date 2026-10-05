"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What does Ankit actually build?",
  "Is he open to new roles?",
  "Tell me about Prahar AI",
  "Why hire him?",
];

const GREETING =
  "I'm Ankit's concierge. Ask me about his work, his projects, or whether he'll return your recruiter email. What are you curious about?";

export default function AskBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await r.json();
      const reply = r.ok ? data.reply : data.error || "Something went wrong.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach the server. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-cursor={open ? "Close" : "Ask"}
        aria-label="Ask about Ankit"
        className="glass fixed bottom-5 right-5 z-[65] flex items-center gap-2.5 rounded-full py-3 pl-4 pr-5 text-[13px] font-medium text-fg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="pulse" />
        {open ? "Close" : "Ask about me"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Ask about Ankit"
            className="glass glass-refract fixed bottom-20 right-5 z-[66] flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[22px]"
            style={{ height: "min(540px, calc(100vh - 7rem))" }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            data-lenis-prevent
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="pulse" />
                <div className="leading-tight">
                  <p className="text-[14px] font-medium">Ask about Ankit</p>
                  <p className="label !text-[10px]">Concierge · powered by Gemini</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="label rounded-full border border-white/10 px-2 py-1 transition-colors hover:border-white/30 hover:text-fg">
                Esc
              </button>
            </div>

            {/* messages */}
            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Bubble role="assistant" text={GREETING} />
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role} text={m.content} />
              ))}
              {busy && (
                <div className="flex gap-1.5 px-1 py-1" aria-label="Thinking">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted"
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}

              {messages.length === 0 && !busy && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-white/12 px-3 py-1.5 text-left text-[12px] text-fg/80 transition-colors hover:border-accent hover:text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder="Ask anything about Ankit…"
                aria-label="Your question"
                className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-fg outline-none placeholder:text-faint"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-transform enabled:hover:scale-105 disabled:opacity-40"
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const me = role === "user";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          me ? "bg-fg text-bg" : "border border-white/10 bg-white/[0.04] text-fg/90"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
