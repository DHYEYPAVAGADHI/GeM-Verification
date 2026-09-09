import { AlertTriangle, CircleCheck, CircleX, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkStatusMeta } from "@/lib/domain";

const icons = {
  verified: CircleCheck,
  warning: AlertTriangle,
  failed: CircleX,
  pending: Clock,
  exempt: Sparkles,
} as const;

export function CheckStatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const m = checkStatusMeta[status] ?? checkStatusMeta.pending;
  const Icon = icons[status as keyof typeof icons] ?? Clock;
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        m.bg,
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", m.text)} strokeWidth={2.2} />
    </span>
  );
}

export function checkStatusLabel(status: string) {
  return (checkStatusMeta[status] ?? checkStatusMeta.pending).label;
}
