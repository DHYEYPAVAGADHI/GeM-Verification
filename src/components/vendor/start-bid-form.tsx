"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, KeyRound } from "lucide-react";
import { startBid } from "@/lib/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" type="submit" disabled={pending}>
      {pending ? "Verifying MPIN…" : "Enter tender"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

/**
 * A vendor may only enter a tender with the 6-digit MPIN issued at registration.
 * `startBid` verifies it server-side and returns an error string on mismatch.
 */
export function StartBidForm({ tenderId }: { tenderId: string }) {
  const bound = startBid.bind(null, tenderId);
  const [error, action] = useFormState(
    async (_prev: string | undefined, fd: FormData) => (await bound(fd)) ?? undefined,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            name="mpin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            required
            pattern="\d{6}"
            placeholder="MPIN"
            aria-label="6-digit MPIN"
            className="field w-28 pl-8 tracking-[0.3em]"
          />
        </div>
        <Submit />
      </div>
      {error && <p className="text-xs font-medium text-risk-high">{error}</p>}
      <p className="text-[11px] text-ink-muted">Use the MPIN issued at registration</p>
    </form>
  );
}
