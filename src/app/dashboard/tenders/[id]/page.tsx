import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RecommendationBadge } from "@/components/dashboard/recommendation-badge";
import { Pill } from "@/components/ui/pill";
import { db } from "@/lib/db";
import { bidStatusMeta, CRITERION_TYPE_LABEL, tenderStatusMeta } from "@/lib/domain";
import { formatDate, inr, initials } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const t = await db.tender.findUnique({ where: { id: params.id } });
  return { title: t?.refNo ?? "Tender" };
}

export default async function TenderWorkspace({ params }: { params: { id: string } }) {
  const tender = await db.tender.findUnique({
    where: { id: params.id },
    include: {
      criteria: { orderBy: { order: "asc" } },
      requiredDocs: { orderBy: { order: "asc" } },
      bids: {
        where: { status: { not: "DRAFT" } },
        include: { vendor: true, decision: true, runs: { orderBy: { startedAt: "desc" }, take: 1 } },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!tender) notFound();

  const ranked = [...tender.bids].sort((a, b) => (b.runs[0]?.score ?? 0) - (a.runs[0]?.score ?? 0));

  return (
    <div className="space-y-6">
      <Link href="/dashboard/tenders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> All tenders
      </Link>

      <PageHeading
        title={tender.title}
        subtitle={`${tender.refNo} · ${tender.buyer}`}
        action={<Pill tone={tenderStatusMeta[tender.status]?.tone}>{tenderStatusMeta[tender.status]?.label}</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { k: "Estimated value", v: inr(tender.estValueCr) },
          { k: "EMD", v: `₹${(tender.emdAmount / 100000).toFixed(1)} L` },
          { k: "Local content", v: tender.localContentClass },
          { k: "Closes", v: formatDate(tender.closeDate) },
        ].map((s) => (
          <div key={s.k} className="card card-pad">
            <p className="text-xs text-ink-muted">{s.k}</p>
            <p className="mt-1 text-lg font-bold text-ink">{s.v}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">Bidders ({ranked.length})</h2>
          <p className="text-xs text-ink-muted">Ranked by compliance score</p>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">Bidder</th>
                <th className="px-3 py-3 font-semibold">Score</th>
                <th className="px-3 py-3 font-semibold">Recommendation</th>
                <th className="px-3 py-3 font-semibold">Financial bid</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ranked.map((b, i) => (
                <tr key={b.id} className="group hover:bg-canvas/60">
                  <td className="px-5 py-3.5 text-ink-muted">{i + 1}</td>
                  <td className="px-3 py-3.5">
                    <Link href={`/dashboard/bids/${b.id}`} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                        {initials(b.vendor.orgName)}
                      </span>
                      <span className="font-semibold text-ink group-hover:text-brand-700">{b.vendor.orgName}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5">{b.runs[0] ? <RiskGauge score={b.runs[0].score} size={38} stroke={4} /> : "—"}</td>
                  <td className="px-3 py-3.5">
                    {b.runs[0] ? (
                      <RecommendationBadge verdict={b.runs[0].recommendation as "Recommended" | "Review Required" | "Not Recommended"} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3.5 data text-ink-soft">{b.financialTotalCr ? inr(b.financialTotalCr) : "—"}</td>
                  <td className="px-3 py-3.5">
                    <Pill tone={bidStatusMeta[b.status]?.tone}>{bidStatusMeta[b.status]?.label}</Pill>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <Link href={`/dashboard/bids/${b.id}`}>
                      <ChevronRight className="h-4 w-4 text-ink-muted/50 group-hover:text-brand-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Eligibility Criteria</h2>
          <ul className="mt-3 space-y-2">
            {tender.criteria.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>
                  {c.label}
                  <span className="ml-1.5 text-xs text-ink-muted">
                    · {CRITERION_TYPE_LABEL[c.type] ?? c.type}
                    {!c.mandatory && " (optional)"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Required Documents</h2>
          <ul className="mt-3 space-y-2">
            {tender.requiredDocs.map((d) => (
              <li key={d.id} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {d.label}
                {!d.mandatory && <span className="text-xs text-ink-muted">(optional)</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
