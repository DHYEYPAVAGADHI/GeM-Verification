"use client";

import { AlertTriangle, Megaphone, Pause, Play } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

const icons = [AlertTriangle, Megaphone, Megaphone, AlertTriangle];

function Row({ items, ariaHidden = false }: { items: string[]; ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 pr-10"
      aria-hidden={ariaHidden || undefined}
    >
      {items.map((text, i) => {
        const Icon = icons[i] ?? Megaphone;
        return (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-[13px] font-medium">
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {text}
          </span>
        );
      })}
    </div>
  );
}

export function GigwTicker() {
  const [paused, setPaused] = useState(false);
  const { dict } = useI18n();
  const items = dict.ticker.items;

  return (
    <div className="gigw-ticker border-y border-red-100 bg-red-50 text-red-700">
      <div className="section flex items-center gap-3 py-2">
        <span className="hidden shrink-0 items-center gap-1.5 rounded bg-red-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:flex">
          <AlertTriangle className="h-3 w-3" aria-hidden /> {dict.ticker.live}
        </span>

        <div className="relative flex-1 overflow-hidden">
          <div
            className="gigw-ticker-track flex w-max"
            style={paused ? { animationPlayState: "paused" } : undefined}
          >
            <Row items={items} />
            <Row items={items} ariaHidden />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          className="shrink-0 rounded p-1 text-red-700 transition-colors hover:bg-red-100"
          aria-label={paused ? dict.ticker.resume : dict.ticker.pause}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
