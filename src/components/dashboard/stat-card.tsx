import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion/count-up";

const tones: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "brand" | "emerald" | "amber" | "red" | "violet";
}) {
  return (
    <div className="card card-hover card-pad">
      <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
        {typeof value === "number" ? <CountUp value={value} /> : value}
        {suffix && <span className="text-base font-semibold text-ink-muted"> {suffix}</span>}
      </p>
    </div>
  );
}
