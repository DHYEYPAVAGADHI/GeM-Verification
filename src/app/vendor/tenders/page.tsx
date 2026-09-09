import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOpenTenders } from "@/lib/queries";
import { Pill } from "@/components/ui/pill";
import { formatDate, inr } from "@/lib/utils";

export const metadata = { title: "Tenders" };

export default async function VendorTendersPage() {
  const session = await auth();
  const [tenders, myBids] = await Promise.all([
    getOpenTenders(),
    db.bid.findMany({ where: { vendorId: session!.user.vendorId! }, select: { tenderId: true, id: true, status: true } }),
  ]);
  const byTender = new Map(myBids.map((b) => [b.tenderId, b]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Open Tenders</h1>
        <p className="mt-1 text-sm text-ink-muted">Bid opportunities you are eligible to participate in.</p>
      </div>

      <div className="space-y-4">
        {tenders.map((t) => {
          const mine = byTender.get(t.id);
          return (
            <div key={t.id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="data text-xs text-ink-muted">{t.refNo}</span>
                    <Pill tone="bg-risk-low-bg text-risk-low">Open for bids</Pill>
                    {mine && <Pill tone="bg-brand-50 text-brand-700">{mine.status === "DRAFT" ? "Draft saved" : "Submitted"}</Pill>}
                  </div>
                  <h2 className="mt-1 text-base font-bold text-ink">{t.title}</h2>
                  <p className="text-xs text-ink-muted">{t.buyer} · {t.category}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                    <span>Est. value <span className="font-medium text-ink">{inr(t.estValueCr)}</span></span>
                    <span>EMD <span className="font-medium text-ink">₹{(t.emdAmount / 100000).toFixed(1)} L</span></span>
                    <span>{t.criteria.length} criteria · {t.requiredDocs.length} documents</span>
                    <span>Closes <span className="font-medium text-ink">{formatDate(t.closeDate)}</span></span>
                  </div>
                </div>
                <Link href={`/vendor/tenders/${t.id}`} className="btn-primary shrink-0">
                  {mine ? "Continue" : "View & check eligibility"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
