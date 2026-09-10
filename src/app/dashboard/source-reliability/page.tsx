import type { Metadata } from "next";
import { Activity, Zap } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { getSourceReliability } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Source Reliability" };

export default async function SourceReliabilityPage() {
  const { rows, totalChecks, avgLatency, degraded } = await getSourceReliability();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Source Reliability"
        subtitle="How each government source and engine module has performed across every verification run"
      />

      <div className="card card-pad flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Activity className="h-4 w-4 text-brand-600" /> {totalChecks.toLocaleString("en-IN")} checks answered
        </span>
        <span className="text-ink-muted">
          Avg response <span className="data font-medium text-ink">{avgLatency} ms</span>
        </span>
        <span className={degraded ? "font-medium text-risk-review" : "text-ink-muted"}>
          {degraded ? `${degraded} source${degraded === 1 ? "" : "s"} degraded` : "All sources operational"}
        </span>
      </div>

      {rows.length === 0 ? (
        <Empty
          title="No checks recorded yet"
          hint="Run a verification from the Bids console — each check records which source answered it and how it resolved."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-3 py-3 font-semibold">Checks</th>
                  <th className="px-3 py-3 font-semibold">Outcome mix</th>
                  <th className="px-3 py-3 font-semibold">Clean-match rate</th>
                  <th className="px-3 py-3 font-semibold">Latency</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.source} className="hover:bg-canvas/50">
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-ink">{r.code}</span>
                      <span className="block text-xs text-ink-muted">{r.name}</span>
                    </td>
                    <td className="px-3 py-3.5 data font-semibold text-ink">{r.total}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex h-2 w-32 overflow-hidden rounded-full bg-canvas">
                        {r.verified > 0 && <div className="bg-risk-low" style={{ width: `${(r.verified / r.total) * 100}%` }} />}
                        {r.warning > 0 && <div className="bg-risk-review" style={{ width: `${(r.warning / r.total) * 100}%` }} />}
                        {r.failed > 0 && <div className="bg-risk-high" style={{ width: `${(r.failed / r.total) * 100}%` }} />}
                      </div>
                      <span className="mt-1 block text-[11px] text-ink-muted">
                        {r.verified} clear · {r.warning} review · {r.failed} adverse
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="data font-semibold text-ink">{r.matchRate}%</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        <Zap className="h-3 w-3 text-ink-muted" />
                        {r.latencyMs ? `${r.latencyMs} ms` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Pill tone={r.status === "Operational" ? "bg-risk-low-bg text-risk-low" : "bg-risk-review-bg text-risk-review"}>
                        {r.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-ink-muted">
        &ldquo;Clean-match rate&rdquo; is the share of checks a source resolved as fully verified. A low rate is not a
        source fault &mdash; it reflects the bidders checked (e.g. the debarment list correctly returning adverse hits).
      </p>
    </div>
  );
}
