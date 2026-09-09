"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { Activity, FileWarning, IndianRupee, Timer } from "lucide-react";

type Stat = {
  icon: typeof Activity;
  label: string;
  value: number;
  format: (n: number) => string;
  suffix?: string;
};

const nfIN = new Intl.NumberFormat("en-IN");

const stats: Stat[] = [
  {
    icon: Activity,
    label: "Total Bids Evaluated via AI",
    value: 245892,
    format: (n) => nfIN.format(Math.round(n)),
  },
  {
    icon: Timer,
    label: "Processing Hours Saved",
    value: 85400,
    format: (n) => nfIN.format(Math.round(n)),
    suffix: "+",
  },
  {
    icon: FileWarning,
    label: "Tampered Documents Flagged",
    value: 1204,
    format: (n) => nfIN.format(Math.round(n)),
  },
  {
    icon: IndianRupee,
    label: "Public Funds Protected",
    value: 450.5,
    format: (n) => `₹${n.toFixed(1)} Cr`,
  },
];

function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = (v: number) => {
      el.textContent = stat.format(v) + (stat.suffix ?? "");
    };
    if (reduce || !inView) {
      render(stat.value);
      return;
    }
    const controls = animate(0, stat.value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: render,
    });
    return () => controls.stop();
  }, [inView, reduce, stat]);

  return (
    <span ref={ref} className="data text-3xl font-extrabold text-white sm:text-[2.1rem]">
      0
    </span>
  );
}

export function LiveStats() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="bg-gov-navy py-14">
      <div className="section">
        <div className="mb-8 flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange/90">Live platform metrics</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Real-time impact across the Government e-Marketplace
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gov-green" />
            Updated {now ?? "—"} IST
          </span>
        </div>

        <dl className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-gov-navy p-6">
              <s.icon className="h-6 w-6 text-gov-saffron" aria-hidden />
              <dd className="mt-3">
                <Counter stat={s} />
              </dd>
              <dt className="mt-1.5 text-[13px] leading-snug text-white/70">{s.label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-center text-[11px] text-white/45 sm:text-left">
          Figures are illustrative prototype data for Smart India Hackathon 2026.
        </p>
      </div>
    </section>
  );
}
