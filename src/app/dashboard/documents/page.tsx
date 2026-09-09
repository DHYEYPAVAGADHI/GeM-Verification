import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import { db } from "@/lib/db";
import { DOC_TYPE_LABEL, docStatusMeta } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const docs = await db.bidDocument.findMany({
    include: { bid: { include: { vendor: true, tender: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  const verified = docs.filter((d) => d.status === "VERIFIED").length;
  const flagged = docs.filter((d) => d.status === "DISCREPANCY" || d.status === "FAILED").length;
  const confs = docs
    .map((d) => {
      try {
        return JSON.parse(d.extractedJson ?? "{}")?._meta?.confidence ?? 0;
      } catch {
        return 0;
      }
    })
    .filter((n) => n > 0);
  const avg = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;

  return (
    <div className="space-y-6">
      <PageHeading title="Documents" subtitle="Every uploaded document, its extraction and cross-verification status" />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { k: "Documents processed", v: docs.length },
          { k: "Verified against source", v: verified },
          { k: "Discrepancies flagged", v: flagged },
        ].map((s) => (
          <div key={s.k} className="card card-pad">
            <p className="text-sm text-ink-muted">{s.k}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">Document Register</h2>
          <span className="text-xs text-ink-muted">Avg OCR confidence {avg.toFixed(1)}%</span>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-semibold">File</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Bidder</th>
                <th className="px-3 py-3 font-semibold">Tender</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-canvas/60">
                  <td className="px-5 py-3.5">
                    <a href={`/api/doc/${d.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 font-medium text-ink hover:text-brand-700">
                      <FileText className="h-4 w-4 text-ink-muted" />
                      {d.fileName}
                    </a>
                  </td>
                  <td className="px-3 py-3.5 text-ink-muted">{DOC_TYPE_LABEL[d.declaredType] ?? d.declaredType}</td>
                  <td className="px-3 py-3.5">
                    <Link href={`/dashboard/bids/${d.bidId}`} className="text-ink-soft hover:text-brand-700">
                      {d.bid.vendor.orgName}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 data text-xs text-ink-muted">{d.bid.tender.refNo}</td>
                  <td className="px-3 py-3.5">
                    <Pill tone={docStatusMeta[d.status]?.tone}>{docStatusMeta[d.status]?.label ?? d.status}</Pill>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-muted">{formatDateTime(d.uploadedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
