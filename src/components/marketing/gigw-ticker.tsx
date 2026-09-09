"use client";

import { AlertTriangle, Megaphone, Pause, Play } from "lucide-react";
import { useState } from "react";

const alerts = [
  {
    icon: AlertTriangle,
    text: "ALERT: New OpenCV forensic tamper-detection rules implemented across all live tenders.",
  },
  {
    icon: Megaphone,
    text: "UPDATE: Automatic EMD exemptions now live for Udyam-verified MSEs and DPIIT-recognised Startups.",
  },
  {
    icon: Megaphone,
    text: "NOTICE: NetworkX Cartel Radar now cross-checks Director Identification Numbers against MCA21.",
  },
  {
    icon: AlertTriangle,
    text: "ALERT: GSTIN / PAN sandbox verification latency restored to normal after scheduled maintenance.",
  },
];

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 pr-10"
      aria-hidden={ariaHidden || undefined}
    >
      {alerts.map((a, i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap text-[13px] font-medium">
          <a.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {a.text}
        </span>
      ))}
    </div>
  );
}

export function GigwTicker() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="gigw-ticker border-y border-red-100 bg-red-50 text-red-700">
      <div className="section flex items-center gap-3 py-2">
        <span className="hidden shrink-0 items-center gap-1.5 rounded bg-red-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:flex">
          <AlertTriangle className="h-3 w-3" aria-hidden /> Live
        </span>

        <div className="relative flex-1 overflow-hidden">
          <div
            className="gigw-ticker-track flex w-max"
            style={paused ? { animationPlayState: "paused" } : undefined}
          >
            <Row />
            <Row ariaHidden />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          className="shrink-0 rounded p-1 text-red-700 transition-colors hover:bg-red-100"
          aria-label={paused ? "Resume scrolling alerts" : "Pause scrolling alerts"}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
