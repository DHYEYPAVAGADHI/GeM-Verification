import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import { governmentSources } from "@/lib/gov-sources";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Government Sources" };

export default function GovernmentSourcesPage() {
  const operational = governmentSources.filter((s) => s.status === "Operational").length;
  const avg = Math.round(governmentSources.reduce((s, x) => s + x.latencyMs, 0) / governmentSources.length);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Government Sources"
        subtitle="Integration health for every connected portal, through the Government Source Gateway"
      />

      <div className="card card-pad flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <span className="flex items-center gap-2 font-semibold text-risk-low">
          <Activity className="h-4 w-4" /> {operational}/{governmentSources.length} operational
        </span>
        <span className="text-ink-muted">
          Avg latency <span className="data font-medium text-ink">{avg} ms</span>
        </span>
        <span className="text-ink-muted">
          Demo runs against a seeded sandbox — swap the adapter for live APIs in production.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {governmentSources.map((s) => (
          <div key={s.code} className="card card-pad">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">{s.code}</span>
              <Pill tone={s.status === "Operational" ? "bg-risk-low-bg text-risk-low" : "bg-risk-review-bg text-risk-review"}>
                {s.status}
              </Pill>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{s.name}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
              <span>{s.integration}</span>
              <span className="data">{s.latencyMs} ms</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className={cn("h-full rounded-full", s.latencyMs > 1000 ? "bg-risk-review" : "bg-risk-low")}
                style={{ width: `${Math.min(100, (s.latencyMs / 1600) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
