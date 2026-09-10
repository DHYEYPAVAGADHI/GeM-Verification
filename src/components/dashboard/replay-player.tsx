"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { CheckStatusIcon } from "@/components/ui/check-status";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { RecommendationBadge } from "@/components/dashboard/recommendation-badge";
import { cn, formatDateTime } from "@/lib/utils";

type ReplayCheck = {
  key: string;
  label: string;
  source: string;
  status: string;
  detail: string;
  contribution: number;
};

export function ReplayPlayer({
  bidder,
  tender,
  startedAt,
  finalScore,
  recommendation,
  confidence,
  rationale,
  checks,
}: {
  bidder: string;
  tender: string;
  startedAt: string;
  finalScore: number;
  recommendation: string;
  confidence: number;
  rationale: string;
  checks: ReplayCheck[];
}) {
  const total = checks.length;
  const [step, setStep] = useState(0); // 0 = not started, total+1 = finished (verdict shown)
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= total + 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(timer.current);
  }, [playing, total]);

  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  const revealed = checks.slice(0, Math.min(step, total));
  const runningScore = useMemo(() => {
    if (step === 0) return null;
    if (step > total) return finalScore;
    // Illustrative running tally: mean of the weight fraction each revealed check earned.
    const weights = revealed.map((c) => Math.max(2, Math.abs(c.contribution) || 6));
    const earned = revealed.map((c, i) => {
      const w = weights[i];
      const frac = c.status === "verified" || c.status === "exempt" ? 1 : c.status === "warning" ? 0.5 : c.status === "pending" ? 0.4 : 0;
      return w * frac;
    });
    const ws = weights.reduce((a, b) => a + b, 0);
    return ws ? Math.round((earned.reduce((a, b) => a + b, 0) / ws) * 100) : 0;
  }, [step, revealed, total, finalScore]);

  const finished = step > total;

  return (
    <div className="space-y-4">
      <div className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{bidder}</h2>
            <p className="data text-xs text-ink-muted">{tender}</p>
            <p className="mt-1 text-xs text-ink-muted">Run started {formatDateTime(startedAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">
              {finished ? "Final score" : step === 0 ? "Ready" : `Step ${Math.min(step, total)} of ${total}`}
            </p>
            <p className="data text-3xl font-bold text-ink">{runningScore ?? "—"}<span className="text-base text-ink-muted">/100</span></p>
          </div>
        </div>

        {/* progress */}
        <div className="mt-4 flex gap-1">
          {checks.map((c, i) => (
            <div
              key={c.key}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < step
                  ? c.status === "failed"
                    ? "bg-risk-high"
                    : c.status === "warning"
                      ? "bg-risk-review"
                      : "bg-risk-low"
                  : "bg-canvas",
              )}
            />
          ))}
        </div>

        {/* controls */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => {
              if (finished) reset();
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : finished ? "Replay" : step === 0 ? "Play" : "Resume"}
          </button>
          <button
            onClick={() => setStep((s) => Math.min(total + 1, s + 1))}
            disabled={finished}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-canvas disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" /> Step
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-canvas"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* revealed checks */}
      <div className="card card-pad">
        <h3 className="text-sm font-bold text-ink">Checks, in the order the engine ran them</h3>
        {step === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Press play to replay the run check by check.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {revealed.map((c) => (
              <li key={c.key} className="flex gap-3 py-3">
                <CheckStatusIcon status={c.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{c.label}</p>
                    <span className="data shrink-0 text-xs text-ink-muted">{c.source}</span>
                  </div>
                  <p className="text-sm text-ink-muted">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* verdict */}
      {finished && (
        <div className="card card-pad">
          <div className="flex items-center gap-4">
            <RiskGauge score={finalScore} size={64} stroke={6} />
            <div>
              <div className="flex items-center gap-2">
                <RecommendationBadge verdict={recommendation as "Recommended" | "Review Required" | "Not Recommended"} />
                <span className="text-xs text-ink-muted">{confidence}% confidence</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{rationale}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
