import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BrainCircuit,
  Building2,
  CalendarDays,
  Download,
  FileText,
  Network,
  ShieldAlert,
  Users2,
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Pill } from "@/components/ui/pill";
import { CheckStatusIcon, checkStatusLabel } from "@/components/ui/check-status";
import { RecommendationBadge } from "@/components/dashboard/recommendation-badge";
import { AuditTimeline } from "@/components/dashboard/audit-timeline";
import { DocReviewCard } from "@/components/dashboard/doc-review-card";
import { OfficerActions } from "@/components/dashboard/officer-actions";
import { getBid, getBidAudit, getCartelLinks } from "@/lib/queries";
import { bidStatusMeta, checkStatusMeta, CRITERION_TYPE_LABEL } from "@/lib/domain";
import { formatDate, formatDateTime, inr, riskMeta } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const bid = await getBid(params.id);
  return { title: bid ? bid.vendor.orgName : "Bid" };
}

export default async function BidDetailPage({ params }: { params: { id: string } }) {
  const bid = await getBid(params.id);
  if (!bid) notFound();

  const [audit, cartel] = await Promise.all([getBidAudit(bid.id), getCartelLinks(bid.id)]);
  const run = bid.run;
  const v = bid.vendor;
  const pending = run ? (JSON.parse(run.pendingJson) as string[]) : [];
  const responseByCriterion = new Map(bid.criterionResponses.map((r) => [r.criterionId, r]));

  const facts = [
    { icon: FileText, label: "PAN", value: v.pan },
    { icon: FileText, label: "GSTIN", value: v.gstin },
    { icon: Building2, label: "Constitution", value: v.constitution },
    { icon: CalendarDays, label: "Incorporated", value: v.incorporationDate ? formatDate(v.incorporationDate) : "—" },
    { icon: ShieldAlert, label: "MSME class", value: v.msmeClass ?? "Not registered" },
    { icon: Users2, label: "Employees", value: String(v.employees ?? "—") },
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/bids" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> All bids
      </Link>

      <PageHeading
        title={v.orgName}
        subtitle={`${v.sector} · ${v.state} · Tender ${bid.tender.refNo}`}
        action={
          <div className="flex items-center gap-2">
            <Pill tone={bidStatusMeta[bid.status]?.tone}>{bidStatusMeta[bid.status]?.label ?? bid.status}</Pill>
          </div>
        }
      />

      <OfficerActions bidId={bid.id} decided={bid.decision?.verdict} />

      {/* score + recommendation */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="card card-pad">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Compliance Score</h2>
            {run && <RiskBadge level={run.riskLevel as "low" | "review" | "high"} />}
          </div>
          {run ? (
            <>
              <div className="mt-4 flex items-center gap-5">
                <RiskGauge score={run.score} size={104} stroke={9} />
                <div className="text-sm">
                  <p className="text-ink-muted">
                    {run.checks.filter((c) => c.status === "verified").length}/{run.checks.length} checks verified
                  </p>
                  <p className="mt-1 text-ink-muted">
                    Confidence <span className="font-semibold text-ink">{run.confidence}%</span>
                  </p>
                  <p className="mt-1 text-ink-muted">
                    Local content <span className="font-semibold text-ink">{bid.localContentPct ?? "—"}%</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">Last run {formatDateTime(run.startedAt)}</p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${run.score}%`, backgroundColor: riskMeta[run.riskLevel as "low" | "review" | "high"].stroke }}
                />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">Verification has not run yet.</p>
          )}
        </section>

        <section className="card card-pad">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-bold text-ink">AI Recommendation</h2>
          </div>
          {run ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <RecommendationBadge verdict={run.recommendation as "Recommended" | "Review Required" | "Not Recommended"} />
                <span className="text-xs text-ink-muted">Confidence {run.confidence}%</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{run.rationale}</p>
              {pending.length > 0 && (
                <div className="mt-4">
                  <p className="eyebrow">Pending from bidder</p>
                  <ul className="mt-2 space-y-1.5">
                    {pending.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-risk-review" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">No recommendation available.</p>
          )}
        </section>
      </div>

      {/* cartel */}
      {cartel.length > 0 && (
        <section className="card card-pad border-risk-high/30">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-risk-high" />
            <h2 className="text-base font-bold text-ink">Collusion signals on this tender</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {cartel.map((c, i) => (
              <li key={i} className="rounded-xl border border-risk-high/30 bg-risk-high-bg/50 px-4 py-3 text-sm">
                <span className="font-semibold text-risk-high">{c.via}</span> with{" "}
                <span className="font-semibold text-ink">{c.vendor}</span> — <span className="text-ink-soft">{c.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* facts */}
      <section className="card card-pad">
        <h2 className="eyebrow">Bidder Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-ink-muted">
                <f.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs text-ink-muted">{f.label}</span>
                <span className="data block text-sm font-medium text-ink">{f.value}</span>
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-ink-muted">
              <Building2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-ink-muted">3-yr turnover</span>
              <span className="data block text-sm font-medium text-ink">
                {inr(((v.turnoverY1 ?? 0) + (v.turnoverY2 ?? 0) + (v.turnoverY3 ?? 0)) / 3)}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* eligibility matrix */}
      <section className="card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">Eligibility Matrix</h2>
          <p className="text-xs text-ink-muted">Tender criteria evaluated against verified facts</p>
        </div>
        <ul className="divide-y divide-line">
          {bid.tender.criteria.map((c) => {
            const resp = responseByCriterion.get(c.id);
            const evalRes = resp?.evalResult ? (JSON.parse(resp.evalResult) as { status: string; detail: string; value?: string }) : null;
            const st = evalRes?.status === "pass" ? "verified" : evalRes?.status === "warn" ? "warning" : evalRes?.status === "fail" ? "failed" : evalRes?.status === "exempt" ? "exempt" : "pending";
            return (
              <li key={c.id} className="flex gap-4 px-5 py-3.5">
                <CheckStatusIcon status={st} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <p className="text-sm font-semibold text-ink">{c.label}</p>
                    <span className="text-[11px] text-ink-muted">· {CRITERION_TYPE_LABEL[c.type] ?? c.type}</span>
                    {c.mandatory && <span className="text-[10px] font-bold uppercase text-risk-high/70">mandatory</span>}
                    <span className={`ml-auto text-xs font-semibold ${checkStatusMeta[st]?.text}`}>{checkStatusLabel(st)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{evalRes?.detail ?? "Not evaluated."}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* statutory checks */}
      {run && (
        <section className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-bold text-ink">Verification Checks</h2>
            <p className="text-xs text-ink-muted">Statutory registrations cross-checked against government sources</p>
          </div>
          <ul className="divide-y divide-line">
            {run.checks
              .filter((c) => !c.key.startsWith("crit_"))
              .map((c) => (
                <li key={c.id} className="flex gap-4 px-5 py-4">
                  <CheckStatusIcon status={c.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="text-sm font-semibold text-ink">{c.label}</p>
                      <span className="text-[11px] text-ink-muted">· {c.source}</span>
                      <span className={`ml-auto text-xs font-semibold ${checkStatusMeta[c.status]?.text}`}>
                        {checkStatusLabel(c.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{c.detail}</p>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* documents */}
      <section className="card card-pad">
        <h2 className="text-base font-bold text-ink">Document Verification ({bid.documents.length})</h2>
        <p className="mb-4 text-xs text-ink-muted">
          Each file: OCR extraction, government cross-check and integrity analysis
        </p>
        <div className="space-y-2.5">
          {bid.documents.map((d) => (
            <DocReviewCard key={d.id} doc={d} />
          ))}
        </div>
      </section>

      {/* clarifications */}
      {bid.clarifications.length > 0 && (
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Clarification Thread</h2>
          <ul className="mt-4 space-y-4">
            {bid.clarifications.map((cl) => (
              <li key={cl.id} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Officer · {formatDateTime(cl.createdAt)}</span>
                  <Pill tone={cl.status === "RESPONDED" ? "bg-risk-low-bg text-risk-low" : "bg-risk-review-bg text-risk-review"}>
                    {cl.status}
                  </Pill>
                </div>
                <p className="mt-1.5 text-sm text-ink-soft">{cl.message}</p>
                {cl.response && (
                  <div className="mt-3 rounded-lg bg-canvas p-3">
                    <p className="text-xs text-ink-muted">
                      Vendor · {cl.respondedAt ? formatDateTime(cl.respondedAt) : ""}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{cl.response}</p>
                    {cl.responseDocId && (
                      <a href={`/api/doc/${cl.responseDocId}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand-600">
                        View submitted document →
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* decision */}
      {bid.decision && (
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Recorded Decision</h2>
          <div className="mt-3 flex items-center gap-3">
            <Pill
              tone={bid.decision.verdict === "QUALIFIED" ? "bg-risk-low-bg text-risk-low" : "bg-risk-high-bg text-risk-high"}
              dot
            >
              {bid.decision.verdict}
            </Pill>
            <span className="text-xs text-ink-muted">{formatDateTime(bid.decision.decidedAt)}</span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{bid.decision.reason}</p>
          <a href={`/api/dossier/${bid.id}`} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-4">
            <Download className="h-4 w-4" /> Download compliance dossier
          </a>
        </section>
      )}

      {/* audit */}
      <section className="card card-pad">
        <h2 className="text-base font-bold text-ink">Verification Audit Trail</h2>
        <p className="mb-4 text-xs text-ink-muted">Immutable, time-stamped record for this bid</p>
        <div className="max-h-[520px] overflow-y-auto scroll-thin pr-2">
          <AuditTimeline events={audit} dense />
        </div>
      </section>
    </div>
  );
}
