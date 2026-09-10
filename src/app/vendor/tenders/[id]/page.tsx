import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getTenderForVendor } from "@/lib/queries";
import { previewEligibility } from "@/lib/engine/preview";
import { StartBidForm } from "@/components/vendor/start-bid-form";
import { CheckStatusIcon, checkStatusLabel } from "@/components/ui/check-status";
import { Pill } from "@/components/ui/pill";
import { CRITERION_TYPE_LABEL, DOC_TYPE_LABEL } from "@/lib/domain";
import { formatDate, inr } from "@/lib/utils";

const toStatus = (s: string) =>
  s === "pass" ? "verified" : s === "warn" ? "warning" : s === "fail" ? "failed" : s === "exempt" ? "exempt" : "pending";

export default async function VendorTenderPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const vendorId = session!.user.vendorId!;
  const [tender, preview, existing] = await Promise.all([
    getTenderForVendor(params.id),
    previewEligibility(vendorId, params.id),
    db.bid.findUnique({ where: { tenderId_vendorId: { tenderId: params.id, vendorId } } }),
  ]);
  if (!tender) notFound();

  return (
    <div className="space-y-6">
      <Link href="/vendor/tenders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Open tenders
      </Link>

      <div className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="data text-xs text-ink-muted">{tender.refNo}</span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{tender.title}</h1>
            <p className="text-sm text-ink-muted">{tender.buyer} · {tender.category}</p>
          </div>
          {existing ? (
            <Link href={`/vendor/bids/${existing.id}`} className="btn-primary">
              {existing.status === "DRAFT" ? "Continue bid" : "View bid"} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <StartBidForm tenderId={tender.id} />
          )}
        </div>
        <p className="mt-3 max-w-3xl text-sm text-ink-soft">{tender.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
          <span>Estimated value <span className="font-medium text-ink">{inr(tender.estValueCr)}</span></span>
          <span>EMD <span className="font-medium text-ink">₹{(tender.emdAmount / 100000).toFixed(1)} L</span>{tender.emdExemptionMsme && " · MSME exempt"}</span>
          <span>Local content <span className="font-medium text-ink">{tender.localContentClass}</span></span>
          <span>Closes <span className="font-medium text-ink">{formatDate(tender.closeDate)}</span></span>
        </div>
      </div>

      {preview && (
        <section className="card card-pad">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink">Your eligibility</h2>
            <Pill tone={preview.blockers ? "bg-risk-high-bg text-risk-high" : "bg-risk-low-bg text-risk-low"}>
              {preview.met}/{preview.total} criteria met
              {preview.blockers ? ` · ${preview.blockers} blocker${preview.blockers > 1 ? "s" : ""}` : ""}
            </Pill>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Checked against your company profile and live government data. Experience and local content are confirmed from documents when you bid.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {preview.results.map((r, i) => {
              const st = toStatus(r.eval.status);
              return (
                <li key={i} className="flex gap-3 py-3">
                  <CheckStatusIcon status={st} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="text-sm font-semibold text-ink">{r.label}</p>
                      <span className="text-[11px] text-ink-muted">· {CRITERION_TYPE_LABEL[r.type] ?? r.type}</span>
                      <span className="ml-auto text-xs font-semibold text-ink-soft">{checkStatusLabel(st)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">{r.eval.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card card-pad">
        <h2 className="text-base font-bold text-ink">Documents you'll need</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {tender.requiredDocs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {DOC_TYPE_LABEL[d.docType] ?? d.label}
              {!d.mandatory && <span className="text-xs text-ink-muted">(optional)</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
