import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import { db } from "@/lib/db";
import { tenderStatusMeta } from "@/lib/domain";
import { formatDate, inr } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenders" };

export default async function TendersPage() {
  const tenders = await db.tender.findMany({
    include: {
      _count: { select: { bids: true, criteria: true } },
      bids: { where: { status: { not: "DRAFT" } }, include: { runs: { orderBy: { startedAt: "desc" }, take: 1 } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Tenders"
        subtitle="Published tenders and their eligibility criteria"
        action={
          <Link href="/dashboard/tenders/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New tender
          </Link>
        }
      />

      <div className="space-y-4">
        {tenders.map((t) => {
          const flagged = t.bids.filter((b) => b.runs[0] && b.runs[0].recommendation !== "Recommended").length;
          return (
            <Link key={t.id} href={`/dashboard/tenders/${t.id}`} className="card card-pad block transition-shadow hover:shadow-pop">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="data text-xs text-ink-muted">{t.refNo}</span>
                    <Pill tone={tenderStatusMeta[t.status]?.tone}>{tenderStatusMeta[t.status]?.label ?? t.status}</Pill>
                  </div>
                  <h2 className="mt-1 text-base font-bold text-ink">{t.title}</h2>
                  <p className="text-xs text-ink-muted">
                    {t.buyer} · {t.category} · est. {inr(t.estValueCr)} · closes {formatDate(t.closeDate)}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-right text-sm">
                  <div>
                    <p className="font-bold text-ink">{t.bids.length}</p>
                    <p className="text-xs text-ink-muted">bids</p>
                  </div>
                  <div>
                    <p className={`font-bold ${flagged ? "text-risk-high" : "text-ink"}`}>{flagged}</p>
                    <p className="text-xs text-ink-muted">flagged</p>
                  </div>
                  <div>
                    <p className="font-bold text-ink">{t._count.criteria}</p>
                    <p className="text-xs text-ink-muted">criteria</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-muted" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
