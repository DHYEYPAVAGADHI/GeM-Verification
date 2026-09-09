"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { reviewProfileChangeRequest, reviewVaultDocument } from "@/lib/actions";

export function ApprovalActions({ kind, id }: { kind: "profile" | "document"; id: string }) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const review = kind === "profile" ? reviewProfileChangeRequest : reviewVaultDocument;

  function approve() {
    start(async () => {
      await review(id, "APPROVED");
    });
  }

  function reject() {
    start(async () => {
      await review(id, "REJECTED", note.trim() || undefined);
      setRejecting(false);
      setNote("");
    });
  }

  if (rejecting) {
    return (
      <div className="w-full max-w-xs space-y-2 rounded-lg border border-line bg-canvas p-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Reason for rejecting (shown to the vendor)…"
          className="field text-xs"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={reject}
            disabled={pending}
            className="flex-1 rounded-lg bg-risk-high px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            Confirm reject
          </button>
          <button onClick={() => setRejecting(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-soft hover:bg-white">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={approve}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg bg-risk-low px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" /> Approve
      </button>
      <button
        onClick={() => setRejecting(true)}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-risk-high/40 bg-white px-3 py-1.5 text-xs font-semibold text-risk-high hover:bg-risk-high-bg disabled:opacity-60"
      >
        <X className="h-3.5 w-3.5" /> Reject
      </button>
    </div>
  );
}
