import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Clarifications" };

export default async function ClarificationsPage() {
  const clarifications = await db.clarification.findMany({
    include: { bid: { include: { vendor: true, tender: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeading title="Clarifications" subtitle="Requests sent to bidders and their responses" />

      {clarifications.length === 0 ? (
        <Empty title="No clarifications yet" hint="Open a bid and use “Request clarification” to start a thread." />
      ) : (
        <div className="space-y-4">
          {clarifications.map((c) => (
            <div key={c.id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{c.bid.vendor.orgName}</span>
                    <Pill tone={c.status === "RESPONDED" ? "bg-risk-low-bg text-risk-low" : c.status === "OPEN" ? "bg-risk-review-bg text-risk-review" : "bg-slate-100 text-ink-muted"}>
                      {c.status}
                    </Pill>
                  </div>
                  <p className="data text-xs text-ink-muted">
                    {c.bid.tender.refNo} · raised {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <Link href={`/dashboard/bids/${c.bidId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                  Open bid <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{c.message}</p>
              {c.response && (
                <div className="mt-3 rounded-lg bg-canvas p-3 text-sm text-ink-soft">
                  <p className="text-xs text-ink-muted">Vendor response · {c.respondedAt ? formatDateTime(c.respondedAt) : ""}</p>
                  {c.response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
