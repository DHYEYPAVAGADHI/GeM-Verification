import type { Metadata } from "next";
import { ShieldCheck, ShieldX } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { AuditTimeline } from "@/components/dashboard/audit-timeline";
import { getAuditEntries } from "@/lib/queries";
import { verifyAuditChain } from "@/lib/engine/audit";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Audit Trail" };

export default async function AuditTrailPage() {
  const [entries, chain, count] = await Promise.all([
    getAuditEntries(120),
    verifyAuditChain(),
    db.auditEntry.count(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeading title="Audit Trail" subtitle="Tamper-evident, hash-chained record of every verification action" />

      <div className="card card-pad flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <span className={`flex items-center gap-2 font-semibold ${chain.intact ? "text-risk-low" : "text-risk-high"}`}>
          {chain.intact ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
          {chain.intact ? "Hash chain intact" : `Chain broken at entry #${chain.brokenAtSeq}`}
        </span>
        <span className="text-ink-muted">
          Entries <span className="font-medium text-ink">{count.toLocaleString("en-IN")}</span>
        </span>
        <span className="data text-xs text-ink-muted">head {chain.head}</span>
      </div>

      <section className="card card-pad">
        <div className="max-h-[70vh] overflow-y-auto scroll-thin pr-2">
          <AuditTimeline events={entries} dense />
        </div>
      </section>
    </div>
  );
}
