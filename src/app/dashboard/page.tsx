import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Gauge,
  Layers,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { StatCard } from "@/components/dashboard/stat-card";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Pill } from "@/components/ui/pill";
import { RiskDistributionChart } from "@/components/dashboard/charts/risk-distribution-chart";
import { StatusOverviewChart } from "@/components/dashboard/charts/status-overview-chart";
import { AuditTimeline } from "@/components/dashboard/audit-timeline";
import { getBids, getDashboardStats, getAuditEntries } from "@/lib/queries";
import { verifyAuditChain } from "@/lib/engine/audit";
import { bidStatusMeta } from "@/lib/domain";
import { formatDateTime, initials } from "@/lib/utils";

export default async function DashboardOverview() {
  const [stats, bids, audit, chain] = await Promise.all([
    getDashboardStats(),
    getBids(),
    getAuditEntries(7),
    verifyAuditChain(),
  ]);

  const recent = bids.slice(0, 6);
  const statusChart = [
    { name: "Recommended", value: stats.low, fill: "#15803d" },
    { name: "Review", value: stats.review, fill: "#b45309" },
    { name: "Not Rec.", value: stats.high, fill: "#b91c1c" },
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Bidder Verification Dashboard"
        subtitle="AI-powered background verification & risk intelligence"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Bids in verification" value={stats.totalBids} icon={Layers} tone="brand" />
        <StatCard label="Recommended (low risk)" value={stats.low} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Review required" value={stats.review} icon={Clock} tone="amber" />
        <StatCard label="Not recommended" value={stats.high} icon={TriangleAlert} tone="red" />
        <StatCard label="Average score" value={stats.avgScore} suffix="/ 100" icon={Gauge} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-bold text-ink">Recent Bids</h2>
            <Link href="/dashboard/bids" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Bidder</th>
                  <th className="px-3 py-3 font-semibold">Tender</th>
                  <th className="px-3 py-3 font-semibold">Score</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((b) => (
                  <tr key={b.id} className="group hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/bids/${b.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                          {initials(b.vendor.orgName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink group-hover:text-brand-700">
                            {b.vendor.orgName}
                          </span>
                          <span className="data block text-xs text-ink-muted">{b.vendor.pan}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className="data text-xs text-ink-muted">{b.tender.refNo}</span>
                    </td>
                    <td className="px-3 py-3">
                      {b.run ? <RiskGauge score={b.run.score} size={40} stroke={4} /> : <span className="text-xs text-ink-muted">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={bidStatusMeta[b.status]?.tone}>{bidStatusMeta[b.status]?.label ?? b.status}</Pill>
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-muted">
                      {b.submittedAt ? formatDateTime(b.submittedAt) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/dashboard/bids/${b.id}`}>
                        <ChevronRight className="h-4 w-4 text-ink-muted/50 group-hover:text-brand-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 text-xs text-ink-muted">
            {stats.decided} decided · {stats.pendingClar} awaiting vendor clarification
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Risk Score Distribution</h2>
          <p className="text-xs text-ink-muted">Across {stats.scored} verified bids</p>
          <div className="mt-5">
            <RiskDistributionChart data={stats.distribution} />
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-bold text-ink">By recommendation</h3>
            <StatusOverviewChart data={statusChart} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="card card-pad">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Recent Audit Trail</h2>
            <Link href="/dashboard/audit-trail" className="text-sm font-semibold text-brand-600">
              View all
            </Link>
          </div>
          <p className="mb-4 mt-1 flex items-center gap-2 text-xs">
            <ShieldCheck className={chain.intact ? "h-4 w-4 text-risk-low" : "h-4 w-4 text-risk-high"} />
            <span className={chain.intact ? "font-semibold text-risk-low" : "font-semibold text-risk-high"}>
              {chain.intact ? "Hash chain intact" : `Chain broken at #${chain.brokenAtSeq}`}
            </span>
            <span className="data text-ink-muted">head {chain.head.slice(0, 10)}…</span>
          </p>
          <AuditTimeline events={audit} dense />
        </section>

        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Needs your attention</h2>
          <ul className="mt-3 divide-y divide-line">
            {bids
              .filter((b) => b.run && (b.run.recommendation !== "Recommended" || b.status === "CLARIFICATION_REQUESTED") && !b.decision)
              .slice(0, 6)
              .map((b) => (
                <li key={b.id}>
                  <Link href={`/dashboard/bids/${b.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{b.vendor.orgName}</span>
                      <span className="block text-xs text-ink-muted">
                        {b.tender.refNo} · {b.run?.recommendation}
                      </span>
                    </span>
                    {b.run && <RiskBadge level={b.run.riskLevel as "low" | "review" | "high"} />}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
