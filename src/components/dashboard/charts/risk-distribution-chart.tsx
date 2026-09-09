"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function RiskDistributionChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, r) => s + r.value, 0);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
              {data.map((r) => (
                <Cell key={r.label} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{total}</span>
          <span className="text-xs text-ink-muted">bids</span>
        </div>
      </div>
      <ul className="flex-1 space-y-3">
        {data.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
              {r.label}
            </span>
            <span className="data font-semibold text-ink">
              {r.value}
              <span className="ml-1 font-normal text-ink-muted">
                ({total ? Math.round((r.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
