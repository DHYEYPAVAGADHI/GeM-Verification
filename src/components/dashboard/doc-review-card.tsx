"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Fingerprint,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import { setDocumentReview } from "@/lib/actions";
import { DOC_TYPE_LABEL, docStatusMeta } from "@/lib/domain";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

type Forensic = {
  integrityScore: number;
  verdict: "clean" | "review" | "suspect";
  metadata: Record<string, string | undefined>;
  signals: { key: string; severity: "info" | "warn" | "high"; detail: string }[];
  incrementalSaves: number;
  qr: { present: boolean; matchesOcr: boolean | null; detail: string };
  duplicate: { isDuplicate: boolean; detail: string };
};

export function DocReviewCard({
  doc,
  readOnly = false,
}: {
  doc: {
    id: string;
    fileName: string;
    declaredType: string;
    detectedType: string | null;
    status: string;
    officerAction: string | null;
    officerNote: string | null;
    extractedJson: string | null;
    forensicJson: string | null;
  };
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(doc.status === "DISCREPANCY" || doc.status === "FAILED");
  const [pending, start] = useTransition();

  const forensic: Forensic | null = doc.forensicJson ? safeParse(doc.forensicJson) : null;
  const extracted: Record<string, unknown> | null = doc.extractedJson ? safeParse(doc.extractedJson) : null;
  const meta = (extracted?._meta ?? {}) as { confidence?: number; pages?: number; method?: string };
  const typeMismatch =
    doc.detectedType && doc.detectedType !== "UNKNOWN" && doc.detectedType !== doc.declaredType;

  const verdictTone =
    forensic?.verdict === "suspect"
      ? "bg-risk-high-bg text-risk-high"
      : forensic?.verdict === "review"
        ? "bg-risk-review-bg text-risk-review"
        : "bg-risk-low-bg text-risk-low";

  const fields = Object.entries(extracted ?? {}).filter(
    ([k, v]) => k !== "_meta" && k !== "raw" && k !== "qrPayload" && v != null && String(v).length < 60,
  );

  return (
    <div className="rounded-xl border border-line">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <FileText className="h-4 w-4 shrink-0 text-ink-muted" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{doc.fileName}</span>
          <span className="block text-xs text-ink-muted">
            {DOC_TYPE_LABEL[doc.declaredType] ?? doc.declaredType}
            {meta.confidence ? ` · OCR ${meta.confidence}%` : ""}
          </span>
        </span>
        <Pill tone={docStatusMeta[doc.status]?.tone}>{docStatusMeta[doc.status]?.label ?? doc.status}</Pill>
        {forensic && (
          <span className={cn("chip", verdictTone)}>
            <ShieldAlert className="h-3 w-3" /> {forensic.integrityScore}/100
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-ink-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4 text-sm">
          {typeMismatch && (
            <p className="rounded-lg bg-risk-review-bg px-3 py-2 text-xs font-medium text-risk-review">
              Declared as {DOC_TYPE_LABEL[doc.declaredType] ?? doc.declaredType} but classified as{" "}
              {DOC_TYPE_LABEL[doc.detectedType!] ?? doc.detectedType}.
            </p>
          )}

          {fields.length > 0 && (
            <div>
              <p className="eyebrow mb-1.5">Extracted fields</p>
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {fields.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-ink-muted">{k}</span>
                    <span className="data text-ink">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {forensic && (
            <div>
              <p className="eyebrow mb-1.5">Document integrity analysis</p>
              <ul className="space-y-1.5">
                {forensic.signals.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        s.severity === "high" ? "bg-risk-high" : s.severity === "warn" ? "bg-risk-review" : "bg-risk-low",
                      )}
                    />
                    <span className="text-ink-soft">{s.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <QrCode className="h-3 w-3" /> {forensic.qr.detail}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" /> {forensic.duplicate.detail}
                </span>
                {forensic.metadata.producer && <span>Producer: {forensic.metadata.producer}</span>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/doc/${doc.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              Open document <ExternalLink className="h-3 w-3" />
            </a>
            {!readOnly && (
              <>
                {(["ACCEPTED", "REJECTED", "CLARIFY"] as const).map((a) => (
                  <button
                    key={a}
                    disabled={pending}
                    onClick={() => start(() => setDocumentReview(doc.id, a))}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      doc.officerAction === a
                        ? "bg-brand-600 text-white"
                        : "border border-line bg-white text-ink-soft hover:bg-canvas",
                    )}
                  >
                    {a === "ACCEPTED" ? "Accept" : a === "REJECTED" ? "Reject" : "Ask to clarify"}
                  </button>
                ))}
              </>
            )}
          </div>
          {doc.officerNote && <p className="text-xs text-ink-muted">Officer note: {doc.officerNote}</p>}
        </div>
      )}
    </div>
  );
}

function safeParse<T = Record<string, unknown>>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
