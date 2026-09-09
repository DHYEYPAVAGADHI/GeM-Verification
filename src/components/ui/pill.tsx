import { cn } from "@/lib/utils";

export function Pill({
  children,
  tone = "bg-slate-100 text-ink-soft",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span className={cn("chip", tone, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
