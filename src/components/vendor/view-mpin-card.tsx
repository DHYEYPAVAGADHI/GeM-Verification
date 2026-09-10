"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { revealMpin } from "@/lib/actions";

export function ViewMpinCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [mpin, setMpin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const hide = () => {
    setMpin(null);
    setPassword("");
    setError(null);
    setOpen(false);
    clearTimeout(timer.current);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await revealMpin(password);
      if (res.ok) {
        setMpin(res.mpin);
        setPassword("");
        clearTimeout(timer.current);
        timer.current = setTimeout(hide, 20000); // auto-hide after 20s
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <KeyRound className="h-4 w-4 text-brand-600" /> Tender MPIN
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            The 6-digit code you enter to sign into any tender. Viewing it requires your account password.
          </p>
        </div>
        {!open && !mpin && (
          <button onClick={() => setOpen(true)} className="btn-ghost shrink-0 text-xs">
            <Eye className="h-4 w-4" /> View MPIN
          </button>
        )}
      </div>

      {mpin && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-gov-navy/15 bg-gov-wash px-4 py-3">
          <span className="font-mono text-2xl font-bold tracking-[0.35em] text-gov-navy">{mpin}</span>
          <button onClick={hide} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink">
            <EyeOff className="h-4 w-4" /> Hide
          </button>
        </div>
      )}

      {open && !mpin && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="mpin-pw">Account password</label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="mpin-pw"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pl-9"
                placeholder="Enter to reveal MPIN"
              />
            </div>
          </div>
          {error && <p className="text-xs font-medium text-risk-high">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-60">
              {pending ? "Verifying…" : "Reveal MPIN"}
            </button>
            <button type="button" onClick={hide} className="btn-ghost text-sm">Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
