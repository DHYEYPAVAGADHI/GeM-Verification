import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BidWizard } from "@/components/vendor/bid-wizard";
import { BidTracker } from "@/components/vendor/bid-tracker";
import { BidAcknowledgement } from "@/components/vendor/bid-acknowledgement";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { Pill } from "@/components/ui/pill";
import { CheckStatusIcon, checkStatusLabel } from "@/components/ui/check-status";
import { bidStatusMeta } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

export default async function VendorBidPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const vendorId = session!.user.vendorId!;
  const bid = await db.bid.findUnique({
    where: { id: params.id },
    include: {
      vendor: true,
      tender: { include: { criteria: { orderBy: { order: "asc" } }, requiredDocs: { orderBy: { order: "asc" } } } },
      documents: true,
      criterionResponses: true,
      declarations: true,
      decision: true,
      clarifications: { orderBy: { createdAt: "desc" } },
      runs: { orderBy: { startedAt: "desc" }, take: 1, include: { checks: { orderBy: { order: "asc" } } } },
    },
  });
  if (!bid || bid.vendorId !== vendorId) notFound();
  const run = bid.runs[0];

  if (bid.status === "DRAFT") {
    const vaultDocs = await db.profileDocument.findMany({
      where: { vendorId },
      select: { id: true, docType: true, fileName: true },
    });
    return (
      <div className="space-y-6">
        <Link href="/vendor/tenders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Tenders
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{bid.tender.title}</h1>
          <p className="data mt-1 text-sm text-ink-muted">{bid.tender.refNo} · Draft bid</p>
        </div>
        <BidWizard
          bid={{
            id: bid.id,
            wizardStep: bid.wizardStep,
            localContentPct: bid.localContentPct,
            financialTotalCr: bid.financialTotalCr,
            emdMode: bid.emdMode,
            makeModel: bid.makeModel,
            methodology: bid.methodology,
            vendorIsMsme: !!bid.vendor.udyamNo,
          }}
          tender={{
            title: bid.tender.title,
            refNo: bid.tender.refNo,
            estValueCr: bid.tender.estValueCr,
            localContentClass: bid.tender.localContentClass,
          }}
          criteria={bid.tender.criteria.map((c) => ({ id: c.id, label: c.label, type: c.type, mandatory: c.mandatory }))}
          requiredDocs={bid.tender.requiredDocs.map((r) => ({ id: r.id, docType: r.docType, label: r.label, mandatory: r.mandatory }))}
          documents={bid.documents.map((d) => {
            let extracted;
            try {
              const j = JSON.parse(d.extractedJson ?? "{}");
              const keyRaw =
                d.declaredType === "UDYAM_CERT" && j.udyam
                  ? { k: "Udyam", v: j.udyam }
                  : d.declaredType === "TURNOVER_CERT" && j.turnoverCr != null
                    ? { k: "Turnover", v: `₹${j.turnoverCr} Cr` }
                    : j.gstin
                      ? { k: "GSTIN", v: j.gstin }
                      : j.pan
                        ? { k: "PAN", v: j.pan }
                        : j.udyam
                          ? { k: "Udyam", v: j.udyam }
                          : j.turnoverCr != null
                            ? { k: "Turnover", v: `₹${j.turnoverCr} Cr` }
                            : undefined;
              extracted = {
                detectedType: d.detectedType ?? undefined,
                keyField: keyRaw,
                sourceCheck: j._meta?.sourceCheck ?? null,
                confidence: j._meta?.confidence,
              };
            } catch {
              extracted = undefined;
            }
            return {
              id: d.id,
              declaredType: d.declaredType,
              requiredDocId: d.requiredDocId,
              fileName: d.fileName,
              status: d.status,
              extracted,
            };
          })}
          vaultDocs={vaultDocs}
          responses={bid.criterionResponses.map((r) => ({ criterionId: r.criterionId, complied: r.complied }))}
          declarations={bid.declarations.map((d) => d.key)}
        />
      </div>
    );
  }

  // submitted — tracker + shared results
  return (
    <div className="space-y-6">
      <Link href="/vendor/bids" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> My bids
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{bid.tender.title}</h1>
          <p className="data mt-1 text-sm text-ink-muted">
            {bid.tender.refNo} · submitted {bid.submittedAt ? formatDateTime(bid.submittedAt) : ""}
          </p>
        </div>
        <Pill tone={bidStatusMeta[bid.status]?.tone} dot>
          {bidStatusMeta[bid.status]?.label}
        </Pill>
      </div>

      {bid.decision && (
        <div
          className={
            bid.decision.verdict === "DISQUALIFIED"
              ? "rounded-xl border border-risk-high/30 bg-risk-high-bg/60 p-5"
              : "rounded-xl border border-risk-low/30 bg-risk-low-bg/60 p-5"
          }
        >
          <div className="flex items-start gap-3">
            {bid.decision.verdict === "DISQUALIFIED" ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-risk-high" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-risk-low" />
            )}
            <div>
              <p className="text-sm font-bold text-ink">
                {bid.decision.verdict === "DISQUALIFIED"
                  ? "This bid was not qualified"
                  : "This bid has been qualified"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{bid.decision.reason}</p>
              <p className="mt-2 text-xs text-ink-muted">
                Decision recorded by the Procurement Officer on {formatDateTime(bid.decision.decidedAt)}.
                {bid.decision.verdict === "DISQUALIFIED" &&
                  " If you believe this is in error, raise it with the buyer through the tender's grievance channel."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <BidAcknowledgement
            refNo={bid.tender.refNo}
            title={bid.tender.title}
            submittedAt={bid.submittedAt ? formatDateTime(bid.submittedAt) : "—"}
            hash={bid.bidHash ?? ""}
            docCount={bid.documents.length}
          />
          <BidTracker
            status={bid.status}
            clarifications={bid.clarifications.map((c) => ({
              id: c.id,
              message: c.message,
              status: c.status,
              requestedDocType: c.requestedDocType,
            }))}
          />
        </div>

        {run && (
          <section className="card card-pad">
            <div className="flex items-center gap-4">
              <RiskGauge score={run.score} size={72} stroke={7} />
              <div>
                <p className="text-sm font-semibold text-ink">Compliance check: {run.recommendation}</p>
                <p className="text-xs text-ink-muted">
                  {run.checks.filter((c) => c.status === "verified").length}/{run.checks.length} checks passed
                </p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {run.checks
                .filter((c) => c.status !== "verified")
                .map((c) => (
                  <li key={c.id} className="flex gap-3 py-2.5">
                    <CheckStatusIcon status={c.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {c.label} <span className="text-xs font-normal text-ink-muted">· {checkStatusLabel(c.status)}</span>
                      </p>
                      <p className="text-sm text-ink-muted">{c.detail}</p>
                    </div>
                  </li>
                ))}
              {run.checks.every((c) => c.status === "verified") && (
                <li className="py-3 text-sm text-ink-muted">No open items — every check passed.</li>
              )}
            </ul>
          </section>
        )}
      </div>

      <section className="card card-pad">
        <h2 className="text-base font-bold text-ink">Documents submitted</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {bid.documents.map((d) => (
            <li key={d.id}>
              <a href={`/api/doc/${d.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink-soft hover:text-brand-700">
                <FileText className="h-4 w-4 text-ink-muted" />
                {d.fileName}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
