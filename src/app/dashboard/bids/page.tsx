import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { BidFilters } from "@/components/dashboard/bid-filters";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RecommendationBadge } from "@/components/dashboard/recommendation-badge";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { getBids } from "@/lib/queries";
import { db } from "@/lib/db";
import { bidStatusMeta } from "@/lib/domain";
import { formatDateTime, initials, riskFromScore } from "@/lib/utils";

export const metadata: Metadata = { title: "Bids" };

export default async function BidsPage({
  searchParams,
}: {
  searchParams: { q?: string; risk?: string; tender?: string };
}) {
  const [allBids, tenders] = await Promise.all([
    getBids(),
    db.tender.findMany({ select: { id: true, refNo: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const q = (searchParams.q ?? "").toLowerCase().trim();
  const rows = allBids
    .filter((b) => (searchParams.tender ? b.tenderId === searchParams.tender : true))
    .filter((b) =>
      searchParams.risk && b.run ? riskFromScore(b.run.score) === searchParams.risk : searchParams.risk ? false : true,
    )
    .filter((b) =>
      q
        ? [b.vendor.orgName, b.vendor.pan, b.vendor.gstin, b.vendor.sector, b.vendor.state]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true,
    );

  return (
    <div className="space-y-6">
      <PageHeading title="Bids" subtitle={`${allBids.length} submitted bids across ${tenders.length} tenders`} />
      <BidFilters tenders={tenders} />

      {rows.length === 0 ? (
        <Empty title="No bids match these filters" hint="Try clearing the search or risk filter." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Bidder</th>
                  <th className="px-3 py-3 font-semibold">Identifiers</th>
                  <th className="px-3 py-3 font-semibold">Tender</th>
                  <th className="px-3 py-3 font-semibold">Score</th>
                  <th className="px-3 py-3 font-semibold">Recommendation</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((b) => (
                  <tr key={b.id} className="group hover:bg-canvas/60">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/bids/${b.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                          {initials(b.vendor.orgName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink group-hover:text-brand-700">
                            {b.vendor.orgName}
                          </span>
                          <span className="block text-xs text-ink-muted">
                            {b.vendor.sector} · {b.vendor.state}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="data block text-xs text-ink-soft">{b.vendor.pan}</span>
                      <span className="data block text-xs text-ink-muted">{b.vendor.gstin}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="data text-xs text-ink-muted">{b.tender.refNo}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      {b.run ? <RiskGauge score={b.run.score} size={40} stroke={4} /> : "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      {b.run ? (
                        <RecommendationBadge verdict={b.run.recommendation as "Recommended" | "Review Required" | "Not Recommended"} />
                      ) : (
                        <span className="text-xs text-ink-muted">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <Pill tone={bidStatusMeta[b.status]?.tone}>{bidStatusMeta[b.status]?.label ?? b.status}</Pill>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-muted">
                      {b.submittedAt ? formatDateTime(b.submittedAt) : "—"}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Link href={`/dashboard/bids/${b.id}`}>
                        <ChevronRight className="h-4 w-4 text-ink-muted/50 group-hover:text-brand-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
