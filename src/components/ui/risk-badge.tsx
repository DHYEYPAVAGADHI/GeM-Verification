import { cn, riskMeta, type RiskLevel } from "@/lib/utils";

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}) {
  const m = riskMeta[level];
  return (
    <span className={cn("chip", m.bg, m.text, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}
