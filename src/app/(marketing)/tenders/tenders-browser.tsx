"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, LogIn, Search, SlidersHorizontal } from "lucide-react";
import { type PublicTender, type PublicTenderList } from "@/lib/public-tenders";
import { TenderParticipateModal } from "@/components/vendor/tender-participate-modal";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

type SortKey = "end_date_asc" | "end_date_desc" | "value_desc";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtQty = (n: number) => n.toLocaleString("en-IN");

function DaysLeftPill({ days }: { days: number }) {
  if (days <= 0) return <Pill tone="bg-slate-100 text-ink-muted">Closed</Pill>;
  const tone =
    days <= 3 ? "bg-risk-high-bg text-risk-high" : days <= 7 ? "bg-risk-review-bg text-risk-review" : "bg-risk-low-bg text-risk-low";
  return <Pill tone={tone}>{days} day{days === 1 ? "" : "s"} left</Pill>;
}

export function TendersBrowser({
  data,
  isLoggedIn,
}: {
  data: PublicTenderList;
  isLoggedIn: boolean;
}) {
  const [ministry, setMinistry] = useState("all");
  const [sort, setSort] = useState<SortKey>("end_date_asc");
  const [query, setQuery] = useState("");
  const [modalTender, setModalTender] = useState<PublicTender | null>(null);

  const rows = useMemo(() => {
    let list = [...data.results];
    if (ministry !== "all") list = list.filter((t) => t.ministry === ministry);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.bid_no.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sort === "value_desc") return b.est_value_cr - a.est_value_cr;
      const d = a.end_date.localeCompare(b.end_date);
      return sort === "end_date_desc" ? -d : d;
    });
    return list;
  }, [data.results, ministry, sort, query]);

  /* --- the participate intercept: verify the entity first ------------- */
  function participate(tender: PublicTender) {
    setModalTender(tender);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-gov-navy/10 bg-blue-50 px-4 py-3 text-sm text-gov-navy">
        <LogIn className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Selecting <span className="font-semibold">Participate</span> verifies your entity by PAN or
          GSTIN against the GeM registry. Verified entities go straight to the application; new
          entities are routed to a quick onboarding wizard.
        </p>
      </div>

      {/* Filter / sort bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-canvas p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item or GeM bid number…"
            className="field pl-9"
            aria-label="Search ongoing bids"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <SlidersHorizontal className="h-4 w-4 text-ink-muted" />
          <span className="sr-only sm:not-sr-only">Ministry</span>
          <select
            value={ministry}
            onChange={(e) => setMinistry(e.target.value)}
            className="field sm:w-64"
            aria-label="Filter by ministry"
          >
            <option value="all">All ministries</option>
            {data.ministries.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <ArrowUpDown className="h-4 w-4 text-ink-muted" />
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="field sm:w-52"
            aria-label="Sort bids"
          >
            <option value="end_date_asc">Closing soonest</option>
            <option value="end_date_desc">Closing latest</option>
            <option value="value_desc">Highest value</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-ink-muted">
        Showing {rows.length} of {data.results.length} bids
        {ministry !== "all" && ` · ${ministry}`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-semibold">GeM Bid No.</th>
              <th className="px-4 py-3 font-semibold">Item / Category</th>
              <th className="px-4 py-3 font-semibold">Ministry / Department</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Bid End Date</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-canvas">
                <td className="px-4 py-3 align-top">
                  <span className="data text-[13px] font-semibold text-gov-navy">{t.bid_no}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.mse_exemption && <Pill tone="bg-gov-wash text-gov-navy">MSE / EMD exempt</Pill>}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="max-w-xs font-medium text-ink">{t.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{t.category}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-ink">{t.ministry}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{t.department}</p>
                </td>
                <td className="px-4 py-3 align-top tabular-nums text-ink">{fmtQty(t.quantity)}</td>
                <td className="px-4 py-3 align-top">
                  <p className="text-ink">{fmtDate(t.end_date)}</p>
                  <div className="mt-1">
                    <DaysLeftPill days={t.days_left} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <button
                    type="button"
                    onClick={() => participate(t)}
                    disabled={t.days_left <= 0}
                    className={cn(
                      "btn rounded-md bg-gov-orange px-4 py-2 text-white hover:bg-gov-orange-dark",
                      t.days_left <= 0 && "pointer-events-none opacity-50",
                    )}
                  >
                    Participate
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No ongoing bids match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TenderParticipateModal
        tender={modalTender}
        open={!!modalTender}
        onClose={() => setModalTender(null)}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
