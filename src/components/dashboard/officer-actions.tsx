"use client";

import { useState, useTransition } from "react";
import { Gavel, MessagesSquare, RefreshCw, X } from "lucide-react";
import { recordDecision, requestClarification, rerunVerification } from "@/lib/actions";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function OfficerActions({
  bidId,
  decided,
}: {
  bidId: string;
  decided?: string;
}) {
  const [modal, setModal] = useState<null | "clarify" | "decide">(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [docType, setDocType] = useState("");
  const [verdict, setVerdict] = useState<"QUALIFIED" | "DISQUALIFIED">("QUALIFIED");
  const [reason, setReason] = useState("");

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={pending}
        onClick={() => start(() => rerunVerification(bidId))}
        className="btn-ghost"
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} /> Re-run verification
      </button>
      <button onClick={() => setModal("clarify")} className="btn-ghost">
        <MessagesSquare className="h-4 w-4" /> Request clarification
      </button>
      <button onClick={() => setModal("decide")} className="btn-primary">
        <Gavel className="h-4 w-4" /> {decided ? "Update decision" : "Record decision"}
      </button>

      {modal === "clarify" && (
        <Modal title="Request clarification from the bidder" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe what the bidder must clarify or re-submit…"
              className="field"
            />
            <div>
              <label className="label">Document requested (optional)</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="field mt-1">
                <option value="">— none —</option>
                {["GST_CERT", "TURNOVER_CERT", "OEM_AUTH", "MAKE_IN_INDIA", "EPFO_ECR", "WORK_ORDER", "ISO_CERT"].map((d) => (
                  <option key={d} value={d}>
                    {d.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <button
              disabled={pending || message.trim().length < 8}
              onClick={() =>
                start(async () => {
                  await requestClarification(bidId, message.trim(), docType || undefined);
                  setModal(null);
                  setMessage("");
                })
              }
              className="btn-primary w-full"
            >
              Send request
            </button>
          </div>
        </Modal>
      )}

      {modal === "decide" && (
        <Modal title="Record qualification decision" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <p className="rounded-lg bg-canvas px-3 py-2 text-xs text-ink-muted">
              The AI assessment is advisory. This decision is attributed to you and written to the audit trail.
            </p>
            <div className="flex gap-2">
              {(["QUALIFIED", "DISQUALIFIED"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdict(v)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
                    verdict === v
                      ? v === "QUALIFIED"
                        ? "border-risk-low bg-risk-low-bg text-risk-low"
                        : "border-risk-high bg-risk-high-bg text-risk-high"
                      : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {v === "QUALIFIED" ? "Qualify" : "Disqualify"}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Reason for the decision (included in the compliance dossier)…"
              className="field"
            />
            <button
              disabled={pending || reason.trim().length < 8}
              onClick={() =>
                start(async () => {
                  await recordDecision(bidId, verdict, reason.trim());
                  setModal(null);
                })
              }
              className="btn-primary w-full"
            >
              Record {verdict === "QUALIFIED" ? "qualification" : "disqualification"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
