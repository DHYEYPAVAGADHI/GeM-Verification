"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn, riskFromScore, riskMeta } from "@/lib/utils";

export function RiskGauge({
  score,
  size = 56,
  stroke = 5,
  showValue = true,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  showValue?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const level = riskFromScore(score);
  const color = riskMeta[level].stroke;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c - pct * c : c }}
          whileInView={{ strokeDashoffset: c - pct * c }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {showValue && (
        <span className="absolute font-bold text-ink" style={{ fontSize: size * 0.28 }}>
          {score}
        </span>
      )}
    </div>
  );
}
