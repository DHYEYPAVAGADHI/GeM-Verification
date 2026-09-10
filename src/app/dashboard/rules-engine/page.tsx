import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import {
  confidenceModel,
  criterionTypes,
  engineChecks,
  forensicBands,
  forensicSignals,
  recommendationBands,
  scoreCaps,
  statusValues,
} from "@/lib/engine/rulebook";

export const metadata: Metadata = { title: "Rules Engine" };

export default function RulesEnginePage() {
  const weightSum = engineChecks.reduce((s, c) => s + c.weight, 0);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Rules Engine"
        subtitle="The complete rulebook the verification engine applies to every bid"
      />

      <div className="card card-pad flex items-start gap-3 text-sm text-ink-soft">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <p>
          Read-only reference. These weights and thresholds are fixed in the engine so every bid is scored
          identically; changing them is a deployment action, not a console setting.
        </p>
      </div>

      <Section title="Verification checks & weights" caption={`Weighted average of all checks (total weight ${weightSum}+ per bid). “Gate” checks can cap the whole score.`}>
        <Table
          head={["Check", "Source", "Weight", "Gate", "What it requires"]}
          rows={engineChecks.map((c) => [
            c.label,
            <span key="s" className="text-xs text-ink-muted">{c.source}</span>,
            <span key="w" className="data font-semibold">{c.weight}</span>,
            c.gate ? <Pill key="g" tone="bg-risk-high-bg text-risk-high">Gate</Pill> : <span key="g" className="text-ink-muted">—</span>,
            <span key="n" className="text-xs text-ink-soft">{c.note}</span>,
          ])}
        />
      </Section>

      <Section title="Check outcomes → score" caption="Each check contributes a fraction of its weight based on how it resolved.">
        <Table
          head={["Outcome", "Contributes", "Meaning"]}
          rows={statusValues.map((s) => [
            <span key="s" className="font-semibold text-ink">{s.status}</span>,
            <span key="v" className="data">{s.value}</span>,
            <span key="n" className="text-xs text-ink-soft">{s.note}</span>,
          ])}
        />
      </Section>

      <Section title="Tender eligibility criteria" caption="Officers attach these to a tender; the engine evaluates each against verified data, applying policy relaxations.">
        <Table
          head={["Criterion", "Evaluates", "Auto-relaxation"]}
          rows={criterionTypes.map((c) => [
            <span key="l" className="font-semibold text-ink">{c.label}</span>,
            <span key="c" className="text-xs text-ink-soft">{c.checks}</span>,
            c.relaxation === "—"
              ? <span key="r" className="text-ink-muted">—</span>
              : <Pill key="r" tone="bg-brand-50 text-brand-700">{c.relaxation}</Pill>,
          ])}
        />
      </Section>

      <Section title="Document forensics" caption="Each submitted file starts at 100 and loses points for these signals.">
        <Table
          head={["Signal", "Deduction", "What it catches"]}
          rows={forensicSignals.map((f) => [
            <span key="s" className="text-ink-soft">{f.signal}</span>,
            <span key="d" className="data font-semibold text-risk-high">{f.deduction}</span>,
            <span key="c" className="text-xs text-ink-muted">{f.catches}</span>,
          ])}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {forensicBands.map((b) => (
            <div key={b.verdict} className="rounded-lg border border-line p-3">
              <p className="text-sm font-bold capitalize text-ink">{b.verdict} <span className="data text-xs font-normal text-ink-muted">{b.range}</span></p>
              <p className="mt-1 text-xs text-ink-muted">{b.effect}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Score caps" caption="After the weighted average, the score is capped when any of these hold.">
        <Table
          head={["Condition", "Score capped at", "Recommendation"]}
          rows={scoreCaps.map((c) => [
            <span key="w" className="text-ink-soft">{c.when}</span>,
            <span key="c" className="data font-semibold text-ink">{c.cap}</span>,
            <span key="r" className="text-xs text-ink-muted">{c.result}</span>,
          ])}
        />
      </Section>

      <Section title="Recommendation bands">
        <Table
          head={["Recommendation", "Rule"]}
          rows={recommendationBands.map((b) => [
            <span key="b" className="font-semibold text-ink">{b.band}</span>,
            <span key="r" className="text-xs text-ink-soft">{b.rule}</span>,
          ])}
        />
      </Section>

      <Section title="Confidence model" caption="Reported alongside every score — how sure the engine is of its own assessment.">
        <p className="text-sm text-ink-soft">Base: <span className="data">{confidenceModel.base}</span></p>
        <ul className="mt-2 space-y-1.5">
          {confidenceModel.adjustments.map((a) => (
            <li key={a} className="flex gap-2 text-sm text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {a}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="card card-pad">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {caption && <p className="mt-0.5 text-xs text-ink-muted">{caption}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top first:pl-0">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
