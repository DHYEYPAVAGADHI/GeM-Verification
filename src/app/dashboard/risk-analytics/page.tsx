import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/page-heading";
import { RiskDistributionChart } from "@/components/dashboard/charts/risk-distribution-chart";
import { StatusOverviewChart } from "@/components/dashboard/charts/status-overview-chart";
import { getDashboardStats, getRiskFactors } from "@/lib/queries";

export const metadata: Metadata = { title: "Risk Analytics" };

export default async function RiskAnalyticsPage() {
  const [stats, factors] = await Promise.all([getDashboardStats(), getRiskFactors()]);
  const max = Math.max(1, ...factors.map((f) => f.count));

  return (
    <div className="space-y-6">
      <PageHeading title="Risk Analytics" subtitle="Portfolio-level view of bidder risk and its drivers" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Score Distribution</h2>
          <div className="mt-5">
            <RiskDistributionChart data={stats.distribution} />
          </div>
        </section>
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">By Recommendation</h2>
          <div className="mt-3">
            <StatusOverviewChart
              data={[
                { name: "Recommended", value: stats.low, fill: "#15803d" },
                { name: "Review", value: stats.review, fill: "#b45309" },
                { name: "Not Rec.", value: stats.high, fill: "#b91c1c" },
              ]}
            />
          </div>
        </section>
      </div>

      <section className="card card-pad">
        <h2 className="text-base font-bold text-ink">Top Risk Factors</h2>
        <p className="text-xs text-ink-muted">Most frequent failed / warning checks across verified bids</p>
        {factors.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No flags recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {factors.map((f) => (
              <li key={f.factor}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{f.factor}</span>
                  <span className="data font-semibold text-ink">{f.count}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(f.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
