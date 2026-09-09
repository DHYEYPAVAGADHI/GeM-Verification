import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPublicTenders, type PublicTender, type PublicTenderList } from "@/lib/public-tenders";
import { TendersBrowser } from "./tenders-browser";

export const metadata: Metadata = {
  title: "Ongoing Bids",
  description:
    "Browse ongoing Government e-Marketplace bids. Filter by ministry, sort by closing date, and participate once signed in.",
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Real PUBLISHED tenders in the DB → same shape as the public feed, with
 *  their real ids so "Participate" lands on a working /vendor/tenders/<id>. */
async function realOpenTenders(): Promise<PublicTender[]> {
  try {
    const rows = await db.tender.findMany({
      where: { status: "PUBLISHED", closeDate: { gt: new Date() } },
      orderBy: { closeDate: "asc" },
    });
    return rows.map((t) => ({
      id: t.id,
      bid_no: t.refNo,
      title: t.title,
      ministry: t.buyer,
      department: "Government e-Marketplace",
      category: t.category,
      quantity: 1,
      est_value_cr: t.estValueCr,
      emd_amount: t.emdAmount,
      mse_exemption: t.emdExemptionMsme,
      start_date: iso(t.publishDate),
      end_date: iso(t.closeDate),
      days_left: Math.round((t.closeDate.getTime() - Date.now()) / 86_400_000),
    }));
  } catch {
    return [];
  }
}

function merge(real: PublicTender[], feed: PublicTenderList): PublicTenderList {
  const seen = new Set(real.map((r) => r.bid_no));
  const results = [...real, ...feed.results.filter((f) => !seen.has(f.bid_no))];
  return {
    count: results.length,
    ministries: [...new Set(results.map((r) => r.ministry))].sort(),
    results,
  };
}

export default async function PublicTendersPage() {
  const [session, feed, real] = await Promise.all([
    auth(),
    getPublicTenders(),
    realOpenTenders(),
  ]);
  const data = merge(real, feed);

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-gov-wash">
        <div className="section py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange">
            Government e-Marketplace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gov-navy sm:text-3xl">
            Ongoing Bids
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            {data.count.toLocaleString("en-IN")} live bid opportunities across central
            ministries and departments. Browsing is open to all — signing in is required
            only to participate.
          </p>
        </div>
      </div>

      <div className="section py-8">
        <TendersBrowser data={data} isLoggedIn={!!session?.user} />
      </div>
    </div>
  );
}
