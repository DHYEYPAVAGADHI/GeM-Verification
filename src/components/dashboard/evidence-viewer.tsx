"use client";

import { useState } from "react";
import {
  BadgeCheck,
  FileText,
  MousePointerClick,
  ScanEye,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { RISK_META, type AuditCase } from "@/lib/bulk-audit";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Claude Vision extraction — JSON evidence card                     */
/* ------------------------------------------------------------------ */
function JsonCard({ c }: { c: AuditCase }) {
  const rows: [string, string, "str" | "num" | "bool"][] = [
    ["company_name", `"${c.companyName}"`, "str"],
    ["pan_number", `"${c.pan}"`, "str"],
    ["gstin", `"${c.gstin}"`, "str"],
    ["turnover_cr", String(c.extractedTurnoverCr.toFixed(2)), "num"],
    ["ca_udin", `"${c.caUdin}"`, "str"],
    ["is_msme", String(c.isMsme), "bool"],
  ];
  return (
    <div className="overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Claude Vision Extraction
        </span>
        <span className="data rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
          {c.extractionConfidence}% conf
        </span>
      </div>
      <pre className="data overflow-x-auto scroll-thin px-3.5 py-3 text-[12px] leading-relaxed">
        <span className="text-slate-500">{"{"}</span>
        {rows.map(([k, v, t]) => (
          <span key={k} className="block pl-3">
            <span className="text-amber-300">&quot;{k}&quot;</span>
            <span className="text-slate-500">: </span>
            <span
              className={cn(
                t === "str" && "text-emerald-300",
                t === "num" && "text-sky-300",
                t === "bool" && "text-fuchsia-300",
              )}
            >
              {v}
            </span>
            <span className="text-slate-500">,</span>
          </span>
        ))}
        <span className="text-slate-500">{"}"}</span>
      </pre>
      <p className="border-t border-white/10 px-3.5 py-2 text-[10.5px] text-white/40">
        model: claude-3-5-sonnet-20240620 · POST /v1/ai/extract
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Document surfaces — original scan vs OpenCV ELA heatmap           */
/* ------------------------------------------------------------------ */
function OriginalDoc({ c }: { c: AuditCase }) {
  return (
    <svg viewBox="0 0 380 260" className="h-auto w-full rounded-lg" role="img" aria-label="CA turnover certificate">
      <rect width="380" height="260" fill="#ffffff" />
      <rect width="380" height="260" fill="none" stroke="#e5e8f0" />
      <rect x="0" y="0" width="380" height="34" fill="#f6f7fb" />
      <text x="14" y="16" fontSize="9" fontWeight="700" fill="#1b2a5e" fontFamily="var(--font-sans)">
        SHARMA &amp; ASSOCIATES
      </text>
      <text x="14" y="27" fontSize="7" fill="#6b7488" fontFamily="var(--font-sans)">
        Chartered Accountants · FRN 004821W
      </text>
      <circle cx="352" cy="17" r="11" fill="none" stroke="#c9a227" strokeWidth="1.4" />
      <text x="352" y="20" fontSize="6.5" fill="#c9a227" textAnchor="middle" fontFamily="var(--font-sans)">
        ICAI
      </text>

      <text x="190" y="58" fontSize="10.5" fontWeight="700" fill="#111726" textAnchor="middle" fontFamily="var(--font-sans)">
        CERTIFICATE OF ANNUAL TURNOVER
      </text>
      <line x1="112" y1="63" x2="268" y2="63" stroke="#1b2a5e" strokeWidth="0.9" />

      <text x="20" y="86" fontSize="8" fill="#3a4358" fontFamily="var(--font-sans)">
        This is to certify that the annual turnover of
      </text>
      <text x="20" y="100" fontSize="8.5" fontWeight="700" fill="#111726" fontFamily="var(--font-sans)">
        {c.companyName.length > 42 ? `${c.companyName.slice(0, 41)}…` : c.companyName}
      </text>
      <text x="20" y="114" fontSize="8" fill="#3a4358" fontFamily="var(--font-sans)">
        (PAN {c.pan}) for FY 2025-26 as per audited books is:
      </text>

      <rect x="20" y="126" width="340" height="42" rx="4" fill="#f6f7fb" stroke="#dbe2ef" />
      <text x="32" y="143" fontSize="7.5" fill="#6b7488" fontFamily="var(--font-sans)">
        TOTAL TURNOVER (₹ in crore)
      </text>
      <text x="32" y="160" fontSize="17" fontWeight="800" fill="#111726" fontFamily="var(--font-mono)">
        ₹ {c.extractedTurnoverCr.toFixed(2)} Cr
      </text>

      {[186, 198, 210].map((y, i) => (
        <rect key={y} x="20" y={y} width={i === 2 ? 180 : 300} height="4" rx="2" fill="#eef2fc" />
      ))}

      <text x="20" y="238" fontSize="7" fill="#6b7488" fontFamily="var(--font-mono)">
        UDIN: {c.caUdin}
      </text>
      <path d="M292 232 c10 -12 22 6 32 -8" fill="none" stroke="#1b2a5e" strokeWidth="1.4" strokeLinecap="round" />
      <text x="308" y="248" fontSize="6.5" fill="#6b7488" textAnchor="middle" fontFamily="var(--font-sans)">
        Signature &amp; Seal
      </text>
    </svg>
  );
}

function ElaDoc({ c }: { c: AuditCase }) {
  const hot = c.tampered;
  return (
    <svg viewBox="0 0 380 260" className="h-auto w-full rounded-lg" role="img" aria-label="Error Level Analysis heatmap">
      <defs>
        <radialGradient id="ela-hot" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff4dd2" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#b026ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
        </radialGradient>
        <filter id="ela-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width="380" height="260" fill="#07060f" />

      {/* faint structural residual — untouched regions barely register */}
      <g fill="#1e2a5a" opacity="0.55">
        <rect x="0" y="0" width="380" height="34" />
        <rect x="14" y="10" width="120" height="6" rx="2" fill="#24346b" />
        <rect x="14" y="22" width="150" height="4" rx="2" fill="#1b2650" />
      </g>
      <g fill="#1a2450">
        <rect x="112" y="52" width="156" height="8" rx="2" />
        <rect x="20" y="80" width="230" height="5" rx="2" />
        <rect x="20" y="95" width="200" height="6" rx="2" />
        <rect x="20" y="109" width="250" height="5" rx="2" />
        <rect x="20" y="182" width="300" height="4" rx="2" />
        <rect x="20" y="194" width="300" height="4" rx="2" />
        <rect x="20" y="206" width="180" height="4" rx="2" />
        <rect x="20" y="232" width="170" height="4" rx="2" />
      </g>
      <rect x="20" y="126" width="340" height="42" rx="4" fill="none" stroke="#243063" strokeWidth="1" />
      <rect x="32" y="136" width="120" height="4" rx="2" fill="#1e2a5a" />

      {hot ? (
        <>
          {/* the altered turnover figure blazes */}
          <ellipse cx="92" cy="155" rx="78" ry="26" fill="url(#ela-hot)" filter="url(#ela-blur)" />
          <text x="32" y="161" fontSize="17" fontWeight="800" fill="#ffe3fb" fontFamily="var(--font-mono)">
            ₹ {c.extractedTurnoverCr.toFixed(2)} Cr
          </text>
          <rect x="24" y="132" width="140" height="32" rx="3" fill="none" stroke="#ff4dd2" strokeWidth="1.6" strokeDasharray="5 4">
            <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.9s" repeatCount="indefinite" />
          </rect>
          <text x="170" y="146" fontSize="8" fontWeight="700" fill="#ff8ae2" fontFamily="var(--font-sans)">
            ALTERED REGION
          </text>
          <text x="170" y="158" fontSize="7.5" fill="#c084fc" fontFamily="var(--font-sans)">
            residual {c.elaResidual.toFixed(1)} vs page mean 0.4
          </text>
          <text x="170" y="169" fontSize="7.5" fill="#c084fc" fontFamily="var(--font-sans)">
            recovered value ≈ ₹{c.originalTurnoverCr?.toFixed(2)} Cr
          </text>

          {/* faint secondary hit on the UDIN line */}
          <ellipse cx="90" cy="234" rx="52" ry="12" fill="url(#ela-hot)" opacity="0.45" filter="url(#ela-blur)" />
          <text x="150" y="238" fontSize="7" fill="#a78bfa" fontFamily="var(--font-sans)">
            UDIN block re-saved
          </text>
        </>
      ) : (
        <>
          <rect x="32" y="136" width="120" height="24" rx="3" fill="none" stroke="#1e3a8a" strokeWidth="1.2" />
          <text x="32" y="161" fontSize="17" fontWeight="800" fill="#334680" fontFamily="var(--font-mono)">
            ₹ {c.extractedTurnoverCr.toFixed(2)} Cr
          </text>
          <text x="190" y="212" fontSize="9" fontWeight="700" fill="#4ade80" textAnchor="middle" fontFamily="var(--font-sans)">
            UNIFORM COMPRESSION — NO TAMPER INDICATORS
          </text>
          <text x="190" y="226" fontSize="7.5" fill="#4b5a86" textAnchor="middle" fontFamily="var(--font-sans)">
            mean residual {c.elaResidual.toFixed(2)} · single-save JPEG signature
          </text>
        </>
      )}

      <text x="12" y="253" fontSize="7" fill="#3d4a80" fontFamily="var(--font-mono)">
        ELA q=90 · COLORMAP_JET · POST /v1/ai/forensics/ela
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel                                                             */
/* ------------------------------------------------------------------ */
export function EvidenceViewer({ selected }: { selected: AuditCase | null }) {
  const [view, setView] = useState<"original" | "ela">("original");

  if (!selected) {
    return (
      <div className="card flex h-full min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <MousePointerClick className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-ink">Select a bidder</p>
        <p className="mt-1 max-w-xs text-xs text-ink-muted">
          Pick any row in the Bidder Matrix to open its Claude extraction, the original certificate and
          the OpenCV forensic heatmap — every flag links back to its source.
        </p>
      </div>
    );
  }

  const meta = RISK_META[selected.risk];

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="bg-gov-navy px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="data text-[11px] text-white/60">{selected.bidderId}</p>
            <h2 className="truncate text-sm font-bold">{selected.companyName}</h2>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.tone)}>
            {meta.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.emdWaived && (
            <span className="inline-flex items-center gap-1 rounded bg-risk-low/25 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
              <BadgeCheck className="h-3 w-3" /> EMD Waived · Udyam Verified
            </span>
          )}
          {selected.tampered && (
            <span className="inline-flex items-center gap-1 rounded bg-risk-high/30 px-1.5 py-0.5 text-[10px] font-bold text-red-200">
              <ShieldAlert className="h-3 w-3" /> Tamper detected
            </span>
          )}
          {selected.cartelWith.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-risk-high/30 px-1.5 py-0.5 text-[10px] font-bold text-red-200">
              Cartel · DIN {selected.directorDin}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-thin p-4">
        <JsonCard c={selected} />

        {/* the magic toggle */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Document evidence</p>
            {selected.tampered && view === "original" && (
              <span className="text-[10.5px] font-semibold text-risk-high">Switch to ELA →</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1">
            {(
              [
                ["original", "View Original PDF", FileText],
                ["ela", "Forensic ELA Heatmap", ScanEye],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] font-semibold transition-colors",
                  view === v ? "bg-white text-gov-navy shadow-soft" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-line">
            {view === "original" ? <OriginalDoc c={selected} /> : <ElaDoc c={selected} />}
          </div>

          <p
            className={cn(
              "mt-2 rounded-lg px-3 py-2 text-[11.5px] leading-relaxed",
              view === "ela" && selected.tampered
                ? "bg-risk-high-bg text-risk-high"
                : "bg-canvas text-ink-muted",
            )}
          >
            {view === "original"
              ? `Certificate as submitted — UDIN ${selected.caUdin}, declared ₹${selected.declaredTurnoverCr.toFixed(2)} Cr.`
              : selected.tampered
                ? `Error-Level-Analysis: the turnover figure re-compresses at ${selected.elaResidual.toFixed(1)}× the page mean — it was edited after the last save. Recovered value ≈ ₹${selected.originalTurnoverCr?.toFixed(2)} Cr against ₹${selected.extractedTurnoverCr.toFixed(2)} Cr claimed.`
                : `Error-Level-Analysis: residual is uniform across the page (mean ${selected.elaResidual.toFixed(2)}). No evidence of post-signature editing.`}
          </p>
        </div>

        {/* findings */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Engine findings</p>
          <ul className="mt-2 space-y-1.5">
            {selected.flags.map((f) => (
              <li key={f} className="flex gap-2 rounded-lg bg-canvas px-3 py-2 text-[12.5px] text-ink-soft">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    selected.risk === "high" ? "bg-risk-high" : "bg-risk-low",
                  )}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* policy routing */}
        <dl className="divide-y divide-line rounded-xl border border-line text-[12.5px]">
          {[
            ["Policy routing", selected.routing],
            ["Local content", `${selected.miiPct}%`],
            ["Director / DIN", `${selected.directorName} · ${selected.directorDin}`],
            ["Udyam", selected.udyamNo ?? "Not registered"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 px-3 py-2">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="text-right font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
