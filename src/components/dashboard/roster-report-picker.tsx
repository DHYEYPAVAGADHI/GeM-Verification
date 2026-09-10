"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function RosterReportPicker({
  tenders,
}: {
  tenders: { id: string; label: string; count: number }[];
}) {
  const [id, setId] = useState(tenders[0]?.id ?? "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={id} onChange={(e) => setId(e.target.value)} className="field max-w-md">
        {tenders.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label} ({t.count} bid{t.count === 1 ? "" : "s"})
          </option>
        ))}
      </select>
      <a href={`/api/reports/tender/${id}/roster.csv`} className="btn-primary text-sm">
        <Download className="h-4 w-4" /> Download roster CSV
      </a>
    </div>
  );
}
