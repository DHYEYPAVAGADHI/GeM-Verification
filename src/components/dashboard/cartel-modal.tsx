"use client";

import { useEffect, useState } from "react";
import { Network, ShieldAlert, X, Zap } from "lucide-react";
import { fetchCartelRing, SEEDED_RING, type CartelRing } from "@/lib/bulk-audit";
import { cn } from "@/lib/utils";

/**
 * Full-screen NetworkX cartel graph.
 * Two bidder nodes wired through one shared-director node — drawn as plain SVG
 * so it renders identically everywhere, with live data from the graph engine
 * when `/v1/ai/cartel/check` is reachable.
 */
export function CartelModal({
  open,
  din,
  onClose,
}: {
  open: boolean;
  din: string | null;
  onClose: () => void;
}) {
  const [ring, setRing] = useState<CartelRing>(SEEDED_RING);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !din) return;
    let cancelled = false;
    setLoading(true);
    fetchCartelRing(din)
      .then((r) => {
        if (cancelled) return;
        setRing(r.ring);
        setLive(r.live);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, din]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const [leftName, rightName] = [
    ring.company_names[0] ?? "Bidder A",
    ring.company_names[1] ?? "Bidder B",
  ];
  const [leftBid, rightBid] = [
    ring.connected_bids[0] ?? "—",
    ring.connected_bids[1] ?? "—",
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cartel network graph"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-pop ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gov-navy px-5 py-4 text-white">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Network className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                NetworkX Relational Graph · Cartel Radar
              </p>
              <h2 className="text-base font-bold">Bid-rigging ring detected</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:flex",
                live ? "bg-risk-low/20 text-risk-low" : "bg-white/10 text-white/70",
              )}
            >
              <Zap className="h-3 w-3" />
              {loading ? "Querying engine…" : live ? "Live from graph engine" : "Seeded dataset"}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          {/* Warning banner */}
          <div className="flex items-start gap-3 border-b border-risk-high/25 bg-risk-high/10 px-5 py-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-risk-high" />
            <p className="text-[13px] leading-relaxed text-red-100">
              <span className="font-bold text-red-200">Collusion signal — Section 3(3), Competition Act 2002.</span>{" "}
              {ring.ring_size} supposedly competing bidders on this tender are controlled through the same
              Director Identification Number. Independent-bid declarations submitted by both firms are
              contradicted by MCA21 master data. Refer to the Vigilance Officer before financial opening.
            </p>
          </div>

          {/* The graph */}
          <div className="bg-slate-950 px-2 py-4">
            <svg viewBox="0 0 720 400" className="h-auto w-full" role="img" aria-label="Cartel network graph">
              <defs>
                <radialGradient id="ct-red" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </radialGradient>
                <radialGradient id="ct-blue" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#7dabf8" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </radialGradient>
                <filter id="ct-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="10" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* faint grid */}
              <g stroke="#ffffff" strokeOpacity="0.05">
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 90} y1="0" x2={i * 90} y2="400" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 100} x2="720" y2={i * 100} />
                ))}
              </g>

              {/* edges */}
              <g stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                <line x1="170" y1="150" x2="360" y2="250">
                  <animate attributeName="stroke-opacity" values="0.45;1;0.45" dur="2s" repeatCount="indefinite" />
                </line>
                <line x1="550" y1="150" x2="360" y2="250">
                  <animate attributeName="stroke-opacity" values="1;0.45;1" dur="2s" repeatCount="indefinite" />
                </line>
              </g>
              <g stroke="#ef4444" strokeWidth="3" strokeDasharray="7 9" strokeLinecap="round" opacity="0.9">
                <line x1="170" y1="150" x2="360" y2="250">
                  <animate attributeName="stroke-dashoffset" from="32" to="0" dur="1s" repeatCount="indefinite" />
                </line>
                <line x1="550" y1="150" x2="360" y2="250">
                  <animate attributeName="stroke-dashoffset" from="32" to="0" dur="1s" repeatCount="indefinite" />
                </line>
              </g>

              {/* edge labels */}
              <text x="250" y="192" fill="#fca5a5" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="var(--font-sans)">
                DIRECTOR_OF
              </text>
              <text x="470" y="192" fill="#fca5a5" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="var(--font-sans)">
                DIRECTOR_OF
              </text>

              {/* left bidder node */}
              <g>
                <circle cx="170" cy="150" r="52" fill="url(#ct-blue)" />
                <circle cx="170" cy="150" r="52" fill="none" stroke="#93c5fd" strokeWidth="2" strokeOpacity="0.6" />
                <text x="170" y="146" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                  {leftBid}
                </text>
                <text x="170" y="164" fill="#dbeafe" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
                  BIDDER
                </text>
                <text x="170" y="230" fill="#e2e8f0" fontSize="12.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-sans)">
                  {leftName.length > 30 ? `${leftName.slice(0, 29)}…` : leftName}
                </text>
              </g>

              {/* right bidder node */}
              <g>
                <circle cx="550" cy="150" r="52" fill="url(#ct-blue)" />
                <circle cx="550" cy="150" r="52" fill="none" stroke="#93c5fd" strokeWidth="2" strokeOpacity="0.6" />
                <text x="550" y="146" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                  {rightBid}
                </text>
                <text x="550" y="164" fill="#dbeafe" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
                  BIDDER
                </text>
                <text x="550" y="230" fill="#e2e8f0" fontSize="12.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-sans)">
                  {rightName.length > 30 ? `${rightName.slice(0, 29)}…` : rightName}
                </text>
              </g>

              {/* shared director node */}
              <g filter="url(#ct-glow)">
                <circle cx="360" cy="290" r="62" fill="url(#ct-red)" />
                <circle cx="360" cy="290" r="62" fill="none" stroke="#fecaca" strokeWidth="2.5">
                  <animate attributeName="r" values="62;70;62" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.9;0.1;0.9" dur="2.4s" repeatCount="indefinite" />
                </circle>
              </g>
              <text x="360" y="280" fill="#fff" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
                SHARED DIRECTOR
              </text>
              <text x="360" y="299" fill="#fff" fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                {ring.director_din}
              </text>
              <text x="360" y="315" fill="#fee2e2" fontSize="10.5" textAnchor="middle" fontFamily="var(--font-sans)">
                {ring.director_name}
              </text>
              <text x="360" y="376" fill="#fca5a5" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
                1 director · {ring.ring_size} competing bidders · ring size {ring.ring_size}
              </text>
            </svg>
          </div>

          {/* Evidence rows */}
          <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-3">
            {[
              { k: "Shared DIN", v: ring.director_din, s: ring.director_name },
              { k: "Linked bidders", v: ring.connected_bids.join(" · "), s: "Same tender, same director" },
              { k: "Source", v: "MCA21 master data", s: "Cross-checked at ingestion" },
            ].map((row) => (
              <div key={row.k} className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{row.k}</p>
                <p className="data mt-1 text-sm font-bold text-white">{row.v}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{row.s}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-[11px] leading-relaxed text-white/45">
              Detection method: an undirected graph is built with a node per company and a node per
              Director Identification Number; an edge joins a company to each of its directors. Any DIN
              node whose degree exceeds one distinct company is surfaced as a ring. The AI flags — the
              Procurement Officer decides, and the override is written to the audit trail.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 bg-slate-900 px-5 py-3">
          <button onClick={onClose} className="btn rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
