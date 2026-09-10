import type { Metadata } from "next";
import Link from "next/link";
import { Layers, UploadCloud } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { BulkAuditConsole } from "@/components/dashboard/bulk-audit-console";
import { TenderRoster } from "@/components/dashboard/tender-roster";
import { Empty } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { getTendersWithBids, getTenderRoster } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Bulk AI Audit" };

export default async function BulkVerificationPage({
  searchParams,
}: {
  searchParams: { tab?: string; tender?: string };
}) {
  const tab = searchParams.tab === "adhoc" ? "adhoc" : "roster";
  const tenders = await getTendersWithBids();
  const activeTenderId = searchParams.tender ?? tenders[0]?.id ?? null;
  const roster = tab === "roster" && activeTenderId ? await getTenderRoster(activeTenderId) : null;

  return (
    <div className="space-y-5">
      <PageHeading
        title="Bulk AI Audit"
        subtitle="Every bid submitted through the portal lands here already read, cross-checked and scored — clear a whole tender in one pass"
      />

      <div className="flex gap-1 border-b border-line">
        <TabLink href="/dashboard/bulk-verification" active={tab === "roster"} icon={<Layers className="h-4 w-4" />}>
          Tender rosters
        </TabLink>
        <TabLink href="/dashboard/bulk-verification?tab=adhoc" active={tab === "adhoc"} icon={<UploadCloud className="h-4 w-4" />}>
          Ad-hoc document audit
        </TabLink>
      </div>

      {tab === "adhoc" ? (
        <BulkAuditConsole />
      ) : tenders.length === 0 ? (
        <Empty
          title="No bids submitted yet"
          hint="When a bidder submits through the vendor portal, their bid is verified automatically and appears here grouped by tender."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <nav className="space-y-1">
            {tenders.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/bulk-verification?tender=${t.id}`}
                className={cn(
                  "block rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  t.id === activeTenderId
                    ? "border-brand-300 bg-brand-50"
                    : "border-line bg-white hover:bg-canvas",
                )}
              >
                <span className="data block text-[11px] text-ink-muted">{t.refNo}</span>
                <span className="mt-0.5 block truncate font-semibold text-ink">{t.title}</span>
                <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
                  <span>{t.total} bid{t.total === 1 ? "" : "s"}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {t.decided}/{t.total} decided
                  </span>
                  {t.closeDate && (
                    <>
                      <span aria-hidden>·</span>
                      <span>closes {formatDate(t.closeDate)}</span>
                    </>
                  )}
                </span>
              </Link>
            ))}
          </nav>

          {roster ? (
            <TenderRoster
              tender={roster.tender}
              rows={roster.rows.map((r) => ({ ...r, submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null, decision: r.decision ? { ...r.decision, decidedAt: r.decision.decidedAt.toISOString() } : null }))}
              summary={roster.summary}
            />
          ) : (
            <Empty title="Select a tender" hint="Pick a tender on the left to see its bidder roster." />
          )}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-ink-muted hover:text-ink",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
