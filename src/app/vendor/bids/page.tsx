import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { getVendorContext } from "@/lib/queries";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { bidStatusMeta } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Bids" };

export default async function VendorBidsPage() {
  const session = await auth();
  const ctx = await getVendorContext(session!.user.vendorId!);
  const bids = ctx?.bids ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink">My Bids</h1>

      {bids.length === 0 ? (
        <Empty
          title="No bids yet"
          hint="Start from an open tender."
          action={
            <Link href="/vendor/tenders" className="btn-primary mt-2">
              Browse tenders
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {bids.map((b) => (
            <Link key={b.id} href={`/vendor/bids/${b.id}`} className="card card-pad flex flex-wrap items-center justify-between gap-3 transition-shadow hover:shadow-pop">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="data text-xs text-ink-muted">{b.tender.refNo}</span>
                  <Pill tone={bidStatusMeta[b.status]?.tone}>{bidStatusMeta[b.status]?.label}</Pill>
                  {b.clarifications.some((c) => c.status === "OPEN") && (
                    <Pill tone="bg-risk-review-bg text-risk-review">Action needed</Pill>
                  )}
                </div>
                <p className="mt-0.5 font-semibold text-ink">{b.tender.title}</p>
                <p className="text-xs text-ink-muted">
                  {b.submittedAt ? `Submitted ${formatDate(b.submittedAt)}` : "Draft — not submitted"}
                  {b.run && ` · Score ${b.run.score}/100 · ${b.run.recommendation}`}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
