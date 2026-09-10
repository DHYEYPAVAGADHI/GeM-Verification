"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, ShieldAlert } from "lucide-react";
import { acknowledgeMpin } from "@/lib/actions";
import { useI18n } from "@/lib/i18n/provider";

export function MpinReveal({ mpin }: { mpin: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const { dict } = useI18n();
  const t = dict.mpin;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mpin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the digits are on screen anyway */
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-gov-navy/15 bg-gov-wash p-5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          <KeyRound className="h-3.5 w-3.5" /> {t.label}
        </p>
        <p className="mt-2 font-mono text-4xl font-bold tracking-[0.4em] text-gov-navy">{mpin}</p>
        <button
          type="button"
          onClick={copy}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-canvas"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-risk-low" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t.copied : t.copy}
        </button>
      </div>

      <div className="flex gap-2.5 rounded-lg bg-risk-review-bg/60 p-3 text-[12px] leading-relaxed text-ink-soft">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk-review" />
        <span>{t.warning}</span>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line text-gov-orange focus:ring-gov-orange"
        />
        {t.ack}
      </label>

      <button
        type="button"
        disabled={!saved || pending}
        onClick={() => start(() => acknowledgeMpin())}
        className="btn w-full rounded-md bg-gov-orange text-white hover:bg-gov-orange-dark disabled:opacity-50"
      >
        {pending ? t.continuing : t.continue}
      </button>
    </div>
  );
}
