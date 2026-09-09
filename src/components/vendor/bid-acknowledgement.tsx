"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Printer } from "lucide-react";

export function BidAcknowledgement({
  refNo,
  title,
  submittedAt,
  hash,
  docCount,
}: {
  refNo: string;
  title: string;
  submittedAt: string;
  hash: string;
  docCount: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="card card-pad overflow-hidden">
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-risk-low-bg text-risk-low"
          initial={reduce ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        >
          <motion.span
            initial={reduce ? {} : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Check className="h-7 w-7" strokeWidth={3} />
          </motion.span>
        </motion.span>
        <div>
          <h2 className="text-lg font-bold text-ink">Bid submitted successfully</h2>
          <p className="text-sm text-ink-muted">{title}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
        {[
          ["Tender reference", refNo],
          ["Submitted at", submittedAt],
          ["Documents on file", `${docCount}`],
          ["Bid hash", `${hash.slice(0, 28)}…`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="data font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-xl bg-canvas p-3 text-xs text-ink-muted">
        <p className="font-semibold text-ink-soft">What happens next</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>The verification engine cross-checks every document and registration.</li>
          <li>The procurement officer reviews the scored result and may request a clarification.</li>
          <li>You&rsquo;ll see the decision and can download your compliance snapshot here.</li>
        </ol>
      </div>

      <button
        onClick={() => window.print()}
        className="btn-ghost mt-4 w-full text-xs"
      >
        <Printer className="h-3.5 w-3.5" /> Print acknowledgement
      </button>
    </div>
  );
}
