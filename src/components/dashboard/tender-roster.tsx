"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  Fingerprint,
  Gavel,
  Network,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RecommendationBadge } from "@/components/dashboard/recommendation-badge";
import { Pill } from "@/components/ui/pill";
import { cn, formatDateTime, initials } from "@/lib/utils";
import { bidStatusMeta } from "@/lib/domain";
import { acceptAiRecommendation, acceptAllAiRecommendations } from "@/lib/actions";

type Flags = {
  gate: boolean;
  forensic: boolean;
  debarment: boolean;
  cartel: boolean;
  failedCount: number;
  warnCount: number;
};

export type RosterRowData = {
  bidId: string;
  org: string;
  pan: string;
  gstin: string;
  sector: string | null;
  state: string | null;
  msme: boolean;
  submittedAt: string | null;
  docCount: number;
  status: string;
  score: number | null;
  recommendation: string | null;
  confidence: number | null;
  rationale: string | null;
  flags: Flags;
  cartelLinks: { vendor: string; via: string; detail: string }[];
  decision: { verdict: string; reason: string; decidedAt: string } | null;
};

type Summary = {
  total: number;
  decided: number;
  recommended: number;
  review: number;
  notRecommended: number;
  pendingWithClearReco: number;
};

export function TenderRoster({
  tender,
  rows,
  summary,
}: {
  tender: { id: string; refNo: string; title: string; buyer: string; closeDate: string | Date | null };
  rows: RosterRowData[];
  summary: Summary;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [bulkPending, startBulk] = useTransition();

  const acceptOne = (row: RosterRowData) => {
    startTransition(async () => {
      try {
        const res = await acceptAiRecommendation(row.bidId);
        toast.success(
          `${row.org}: recorded as ${res.verdict === "QUALIFIED" ? "Qualified" : "Disqualified"}`,
          { description: res.verdict === "DISQUALIFIED" ? "The bidder has been notified with the reason." : undefined },
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not record the decision");
      }
    });
  };

  const acceptAll = () => {
    startBulk(async () => {
      try {
        const r = await acceptAllAiRecommendations(tender.id);
        toast.success(
          `${r.qualified} qualified · ${r.disqualified} disqualified`,
          { description: r.skipped ? `${r.skipped} left for manual review.` : "Bidders notified where disqualified." },
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Bulk action failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="data text-[11px] text-ink-muted">{tender.refNo} · {tender.buyer}</p>
            <h2 className="mt-0.5 text-lg font-bold text-ink">{tender.title}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span><b className="text-ink">{summary.total}</b> bidders</span>
              <span className="text-risk-low"><b>{summary.recommended}</b> recommended</span>
              <span className="text-risk-review"><b>{summary.review}</b> need review</span>
              <span className="text-risk-high"><b>{summary.notRecommended}</b> not recommended</span>
              <span><b className="text-ink">{summary.decided}</b>/{summary.total} decided</span>
            </div>
          </div>
          {summary.pendingWithClearReco > 0 && (
            <button
              onClick={acceptAll}
              disabled={bulkPending || busy}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {bulkPending ? "Recording…" : `Accept ${summary.pendingWithClearReco} clear AI call${summary.pendingWithClearReco === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-ink-muted">
          The engine recommends; you decide. &ldquo;Accept&rdquo; records the officer decision and notifies the bidder. &ldquo;Review Required&rdquo; bids open in the full dossier.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-3 py-3 font-semibold">AI score</th>
                <th className="px-3 py-3 font-semibold">Recommendation</th>
                <th className="px-3 py-3 font-semibold">Flags</th>
                <th className="px-3 py-3 font-semibold">Docs</th>
                <th className="px-4 py-3 font-semibold">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <RosterRow key={row.bidId} row={row} onAccept={() => acceptOne(row)} busy={busy || bulkPending} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RosterRow({ row, onAccept, busy }: { row: RosterRowData; onAccept: () => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const clearReco = row.recommendation === "Recommended" || row.recommendation === "Not Recommended";

  return (
    <>
      <tr className="align-top hover:bg-canvas/50">
        <td className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
              {initials(row.org)}
            </span>
            <div className="min-w-0">
              <Link href={`/dashboard/bids/${row.bidId}`} className="block font-semibold text-ink hover:text-brand-700">
                {row.org}
              </Link>
              <span className="data block text-[11px] text-ink-muted">{row.pan} · {row.gstin}</span>
              <span className="block text-[11px] text-ink-muted">
                {row.sector} · {row.state}{row.msme ? " · MSME" : ""}
              </span>
            </div>
          </div>
        </td>
        <td className="px-3 py-3.5">
          {row.score != null ? (
            <div className="flex items-center gap-2">
              <RiskGauge score={row.score} size={38} stroke={4} />
              {row.confidence != null && (
                <span className="text-[11px] text-ink-muted">{row.confidence}%<br />conf.</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-ink-muted">Pending</span>
          )}
        </td>
        <td className="px-3 py-3.5">
          {row.recommendation ? (
            <RecommendationBadge verdict={row.recommendation as "Recommended" | "Review Required" | "Not Recommended"} />
          ) : (
            <span className="text-xs text-ink-muted">—</span>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-brand-600"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            Why
          </button>
        </td>
        <td className="px-3 py-3.5">
          <div className="flex flex-wrap gap-1">
            {row.flags.gate && <FlagChip icon={<Gavel className="h-3 w-3" />} label="Gate fail" tone="bg-risk-high-bg text-risk-high" />}
            {row.flags.debarment && <FlagChip icon={<ShieldX className="h-3 w-3" />} label="Debarred" tone="bg-risk-high-bg text-risk-high" />}
            {row.flags.forensic && <FlagChip icon={<Fingerprint className="h-3 w-3" />} label="Tamper" tone="bg-risk-review-bg text-risk-review" />}
            {row.flags.cartel && <FlagChip icon={<Network className="h-3 w-3" />} label="Cartel link" tone="bg-risk-review-bg text-risk-review" />}
            {!row.flags.gate && !row.flags.debarment && !row.flags.forensic && !row.flags.cartel && (
              <span className="text-[11px] text-ink-muted">Clean</span>
            )}
          </div>
        </td>
        <td className="px-3 py-3.5">
          <a
            href={`/api/dossier/combined/${row.bidId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-soft hover:bg-canvas hover:text-brand-700"
            title="Consolidated PDF of all documents this bidder submitted"
          >
            <FileText className="h-3 w-3" />
            {row.docCount} in 1
          </a>
        </td>
        <td className="px-4 py-3.5">
          {row.decision ? (
            <Pill tone={bidStatusMeta[row.decision.verdict]?.tone} dot>
              {bidStatusMeta[row.decision.verdict]?.label ?? row.decision.verdict}
            </Pill>
          ) : clearReco ? (
            <button
              onClick={onAccept}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Accept AI call
            </button>
          ) : (
            <Link
              href={`/dashboard/bids/${row.bidId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-canvas"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-risk-review" />
              Review manually
            </Link>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-canvas/60">
          <td colSpan={6} className="px-4 py-3">
            <p className="text-xs leading-relaxed text-ink-soft">{row.rationale ?? "No rationale recorded."}</p>
            {row.cartelLinks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {row.cartelLinks.map((l, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-risk-review">
                    <Network className="h-3 w-3" />
                    <b>{l.via}</b> with {l.vendor} — {l.detail}
                  </li>
                ))}
              </ul>
            )}
            {row.decision && (
              <p className="mt-2 text-[11px] text-ink-muted">
                Decision {formatDateTime(row.decision.decidedAt)}: {row.decision.reason}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function FlagChip({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold", tone)}>
      {icon}
      {label}
    </span>
  );
}
