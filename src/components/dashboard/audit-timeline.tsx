import {
  Braces,
  CheckCircle2,
  FileSignature,
  FileUp,
  Flag,
  Gavel,
  MessagesSquare,
  Radio,
  ScanText,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

export type AuditRow = {
  seq: number;
  ts: Date | string;
  actor: string;
  action: string;
  summary: string;
};

const meta: Record<string, { icon: typeof Radio; tone: string }> = {
  BID_STARTED: { icon: FileUp, tone: "text-slate-500 bg-slate-100" },
  BID_SUBMITTED: { icon: FileSignature, tone: "text-brand-700 bg-brand-50" },
  BID_WITHDRAWN: { icon: Flag, tone: "text-ink-muted bg-slate-100" },
  DOCUMENT_ANALYSED: { icon: ScanText, tone: "text-brand-700 bg-brand-50" },
  DOCUMENT_REVIEWED: { icon: Braces, tone: "text-brand-700 bg-brand-50" },
  SOURCE_CHECKED: { icon: Radio, tone: "text-brand-700 bg-brand-50" },
  VERIFICATION_STARTED: { icon: Radio, tone: "text-brand-700 bg-brand-50" },
  VERIFICATION_COMPLETED: { icon: CheckCircle2, tone: "text-risk-low bg-risk-low-bg" },
  CLARIFICATION_REQUESTED: { icon: MessagesSquare, tone: "text-risk-review bg-risk-review-bg" },
  CLARIFICATION_RESPONDED: { icon: MessagesSquare, tone: "text-brand-700 bg-brand-50" },
  DECISION_RECORDED: { icon: Gavel, tone: "text-risk-low bg-risk-low-bg" },
  TENDER_PUBLISHED: { icon: Gavel, tone: "text-slate-600 bg-slate-100" },
};

export function AuditTimeline({ events, dense = false }: { events: AuditRow[]; dense?: boolean }) {
  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute bottom-1 left-[11px] top-1 w-px bg-line" />
      {events.map((e) => {
        const m = meta[e.action] ?? { icon: Radio, tone: "text-slate-500 bg-slate-100" };
        const Icon = m.icon;
        return (
          <li key={e.seq} className="relative">
            <span
              className={cn(
                "absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white",
                m.tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className={cn("flex flex-wrap items-baseline gap-x-2", dense ? "text-xs" : "text-sm")}>
              <span className="data text-xs text-ink-muted">{formatDateTime(e.ts)}</span>
              <span className="font-semibold text-ink">{e.actor}</span>
            </div>
            <p className={cn("text-ink-muted", dense ? "text-xs" : "text-sm")}>{e.summary}</p>
          </li>
        );
      })}
    </ol>
  );
}
