"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const riskTabs = [
  { key: "", label: "All" },
  { key: "low", label: "Recommended" },
  { key: "review", label: "Review" },
  { key: "high", label: "Not recommended" },
];

export function BidFilters({ tenders }: { tenders: { id: string; refNo: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.push(`/dashboard/bids?${next.toString()}`);
  };

  return (
    <div className="card card-pad space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            defaultValue={sp.get("q") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value.trim());
            }}
            placeholder="Search name, PAN, GSTIN, sector — press Enter"
            className="field pl-9"
          />
        </div>
        <select
          defaultValue={sp.get("tender") ?? ""}
          onChange={(e) => set("tender", e.target.value)}
          className="field w-auto"
        >
          <option value="">All tenders</option>
          {tenders.map((t) => (
            <option key={t.id} value={t.id}>
              {t.refNo}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {riskTabs.map((t) => {
          const active = (sp.get("risk") ?? "") === t.key;
          return (
            <button
              key={t.key}
              onClick={() => set("risk", t.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active ? "bg-brand-600 text-white" : "border border-line bg-white text-ink-soft hover:bg-canvas",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
