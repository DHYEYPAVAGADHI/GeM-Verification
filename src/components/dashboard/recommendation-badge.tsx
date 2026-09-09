import { cn } from "@/lib/utils";

type Verdict = "Recommended" | "Review Required" | "Not Recommended";

const meta: Record<Verdict, string> = {
  Recommended: "bg-risk-low-bg text-risk-low",
  "Review Required": "bg-risk-review-bg text-risk-review",
  "Not Recommended": "bg-risk-high-bg text-risk-high",
};

export function RecommendationBadge({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  return (
    <span className={cn("chip", meta[verdict], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {verdict}
    </span>
  );
}
