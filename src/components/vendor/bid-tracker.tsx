"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { respondToClarification } from "@/lib/actions";
import { cn } from "@/lib/utils";

const FLOW = [
  "SUBMITTED",
  "UNDER_VERIFICATION",
  "CLARIFICATION_REQUESTED",
  "TECHNICAL_EVALUATION",
  "QUALIFIED",
] as const;

const LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_VERIFICATION: "Under verification",
  CLARIFICATION_REQUESTED: "Clarification requested",
  TECHNICAL_EVALUATION: "Technical evaluation",
  QUALIFIED: "Result",
};

export function BidTracker({
  status,
  clarifications,
}: {
  status: string;
  clarifications: { id: string; message: string; status: string; requestedDocType: string | null }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const activeIndex =
    status === "DISQUALIFIED" ? FLOW.length - 1 : Math.max(0, FLOW.indexOf(status as (typeof FLOW)[number]));
  const openClar = clarifications.find((c) => c.status === "OPEN");

  return (
    <div className="space-y-6">
      <section className="card card-pad">
        <h2 className="text-base font-bold text-ink">Bid status</h2>
        <ol className="mt-4 space-y-3">
          {FLOW.map((s, i) => {
            const done = i < activeIndex;
            const current = i === activeIndex;
            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    done
                      ? "bg-risk-low text-white"
                      : current
                        ? "bg-brand-600 text-white"
                        : "bg-canvas text-ink-muted",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("text-sm", current ? "font-semibold text-ink" : "text-ink-muted")}>
                  {s === "QUALIFIED" && status === "DISQUALIFIED" ? "Result — not qualified" : LABEL[s]}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {openClar && (
        <section className="card card-pad border-risk-review/40">
          <h2 className="text-base font-bold text-ink">The procurement officer needs a clarification</h2>
          <p className="mt-2 rounded-lg bg-risk-review-bg/60 px-3 py-2 text-sm text-ink-soft">{openClar.message}</p>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            placeholder="Your response…"
            className="field mt-3"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                await respondToClarification(openClar.id, msg.trim(), fd);
                setMsg("");
                router.refresh();
              });
            }}
            className="mt-2 flex flex-wrap items-center gap-2"
          >
            <input type="file" name="file" accept="application/pdf" className="text-xs" />
            <button disabled={pending || msg.trim().length < 4} className="btn-primary">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Send response
            </button>
          </form>
          {openClar.requestedDocType && (
            <p className="mt-1 text-xs text-ink-muted">Requested document: {openClar.requestedDocType.replace(/_/g, " ")}</p>
          )}
        </section>
      )}
    </div>
  );
}
