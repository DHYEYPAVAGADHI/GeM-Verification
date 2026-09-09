"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, RotateCcw, Send, X } from "lucide-react";
import { Emblem } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Namaskar! I am GeM Sahayak, your official assistant for the GeM Bid Compliance Verification Platform. How may I help you with tenders, document scrutiny or procurement policy?";

const SUGGESTIONS = [
  "Show me the live tenders",
  "How does EMD exemption work for MSEs?",
  "What documents are scrutinised for GST compliance?",
  "Explain the NetworkX cartel detection",
];

const STORE_KEY = "gem-sahayak:thread";

export function GemSahayak() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // restore / persist the thread for the session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;
    setError(null);
    setInput("");

    const history: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setPending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "The assistant is unavailable right now.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
      if (!acc.trim()) {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: "I don't know based on the provided GeM policies.",
          };
          return next;
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((m) => m.slice(0, -1)); // drop the empty assistant bubble
      setError((err as Error).message);
    } finally {
      setPending(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close GeM Sahayak assistant" : "Open GeM Sahayak assistant"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-pop transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-orange focus-visible:ring-offset-2",
          open ? "bg-gov-navy-deep" : "bg-gov-navy",
        )}
      >
        {!open && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-gov-navy/40" />
        )}
        {open ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>

      {/* Panel */}
      <div
        role="dialog"
        aria-label="GeM Sahayak assistant"
        aria-hidden={!open}
        className={cn(
          "fixed bottom-24 right-5 z-[60] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop transition-all duration-200",
          "h-[min(34rem,calc(100vh-8rem))]",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-gov-saffron via-white to-gov-green" />

        {/* Header */}
        <header className="flex items-center gap-3 bg-gov-navy px-4 py-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <Emblem className="h-6 w-6 [&_*]:stroke-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">GeM Sahayak</p>
            <p className="text-[11px] text-white/70">Bid Compliance Assistant · SIH 2026</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              aria-label="Start a new conversation"
              className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
          <Bubble role="assistant" content={GREETING} />

          {messages.length === 0 && (
            <div className="space-y-1.5 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[13px] text-gov-navy transition-colors hover:border-gov-orange hover:bg-gov-wash"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble
              key={i}
              role={m.role}
              content={m.content}
              typing={pending && m.role === "assistant" && i === messages.length - 1 && !m.content}
            />
          ))}

          {error && (
            <p className="rounded-lg bg-risk-high-bg px-3 py-2 text-[13px] font-medium text-risk-high">
              {error}
            </p>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-slate-200 bg-white p-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-gov-navy">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about tenders, GST / PAN / Udyam checks, MII policy…"
              className="max-h-28 flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gov-orange text-white transition-colors hover:bg-gov-orange-dark disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-ink-muted">
            AI assistant · verify guidance against official GeM policy.
          </p>
        </form>
      </div>
    </>
  );
}

function Bubble({
  role,
  content,
  typing = false,
}: {
  role: "user" | "assistant";
  content: string;
  typing?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
          isUser
            ? "rounded-br-sm bg-gov-navy text-white"
            : "rounded-bl-sm border border-slate-200 bg-white text-ink-soft",
        )}
      >
        {typing ? <TypingDots /> : content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1" aria-label="GeM Sahayak is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
