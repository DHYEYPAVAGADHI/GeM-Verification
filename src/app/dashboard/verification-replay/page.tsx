import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Empty } from "@/components/ui/empty";
import { ReplayPlayer } from "@/components/dashboard/replay-player";
import { getBids, getBid } from "@/lib/queries";
import { cn, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Verification Replay" };

export default async function VerificationReplayPage({
  searchParams,
}: {
  searchParams: { bid?: string };
}) {
  const bids = (await getBids()).filter((b) => b.run);
  const activeId = searchParams.bid ?? bids[0]?.id ?? null;
  const bid = activeId ? await getBid(activeId) : null;
  const run = bid?.run ?? null;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Verification Replay"
        subtitle="Step through exactly how the engine reached its assessment for one bid"
      />

      {bids.length === 0 ? (
        <Empty title="Nothing to replay yet" hint="Submit and verify a bid, then replay its run here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <nav className="space-y-1">
            {bids.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/verification-replay?bid=${b.id}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                  b.id === activeId ? "border-brand-300 bg-brand-50" : "border-line bg-white hover:bg-canvas",
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-600">
                  {initials(b.vendor.orgName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{b.vendor.orgName}</span>
                  <span className="data block text-[10px] text-ink-muted">{b.tender.refNo}</span>
                </span>
              </Link>
            ))}
          </nav>

          {run && bid ? (
            <ReplayPlayer
              bidder={bid.vendor.orgName}
              tender={`${bid.tender.refNo} — ${bid.tender.title}`}
              startedAt={run.startedAt.toISOString()}
              finalScore={run.score}
              recommendation={run.recommendation}
              confidence={run.confidence}
              rationale={run.rationale}
              checks={run.checks.map((c) => ({
                key: c.key,
                label: c.label,
                source: c.source,
                status: c.status,
                detail: c.detail,
                contribution: c.contribution,
              }))}
            />
          ) : (
            <Empty title="Select a bid" hint="Pick a bid on the left to replay its verification run." />
          )}
        </div>
      )}
    </div>
  );
}
