import type { Metadata } from "next";
import { Download, FileSpreadsheet, ScrollText, Gavel, FileText } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { db } from "@/lib/db";
import { getTendersWithBids } from "@/lib/queries";
import { RosterReportPicker } from "@/components/dashboard/roster-report-picker";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [decisionCount, auditCount, tenders] = await Promise.all([
    db.decision.count(),
    db.auditEntry.count(),
    getTendersWithBids(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeading title="Reports" subtitle="Export the verification record for filing, audit and oversight" />

      <div className="grid gap-4 md:grid-cols-2">
        <ReportCard
          icon={<Gavel className="h-5 w-5" />}
          title="Decision register"
          body={`Every recorded qualify / disqualify decision with its reason — ${decisionCount} to date.`}
          href="/api/reports/decisions.csv"
          cta="Download CSV"
        />
        <ReportCard
          icon={<ScrollText className="h-5 w-5" />}
          title="Audit log export"
          body={`The full hash-chained action log with per-row chain status — ${auditCount.toLocaleString("en-IN")} entries.`}
          href="/api/reports/audit.csv"
          cta="Download CSV"
        />
      </div>

      <section className="card card-pad">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Tender roster</h2>
            <p className="text-xs text-ink-muted">Every bidder on one tender with AI score, flags and the officer decision.</p>
          </div>
        </div>
        <div className="mt-4">
          {tenders.length === 0 ? (
            <p className="text-sm text-ink-muted">No tenders have received bids yet.</p>
          ) : (
            <RosterReportPicker
              tenders={tenders.map((t) => ({ id: t.id, label: `${t.refNo} — ${t.title}`, count: t.total }))}
            />
          )}
        </div>
      </section>

      <section className="card card-pad">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Per-bidder compliance dossier</h2>
            <p className="text-xs text-ink-muted">
              A signed PDF of one bidder&rsquo;s score, every check, the officer decision and the audit-chain head.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Open any bid from{" "}
          <a href="/dashboard/bids" className="font-semibold text-brand-600">
            Bids
          </a>{" "}
          and use &ldquo;Download compliance dossier&rdquo;, or &ldquo;All N as one PDF&rdquo; for the consolidated document set.
        </p>
      </section>
    </div>
  );
}

function ReportCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="card card-pad flex flex-col">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <h2 className="mt-3 text-base font-bold text-ink">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-ink-muted">{body}</p>
      <a href={href} className="btn-ghost mt-4 self-start text-sm">
        <Download className="h-4 w-4" /> {cta}
      </a>
    </div>
  );
}
