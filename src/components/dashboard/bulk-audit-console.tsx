"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  FileText,
  FileWarning,
  Layers,
  Loader2,
  MousePointerClick,
  Network,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Users,
  XCircle,
} from "lucide-react";
import type { BulkExtractRow } from "@/app/api/bulk-extract/route";
import { BENCHMARK_CASES, type AuditCase } from "@/lib/bulk-audit";
import { EvidenceViewer } from "@/components/dashboard/evidence-viewer";
import { CartelModal } from "@/components/dashboard/cartel-modal";
import { cn } from "@/lib/utils";

type Summary = {
  count: number;
  matched: number;
  eligible: number;
  distinctBidders: number;
  rows: BulkExtractRow[];
};

export function BulkAuditConsole() {
  /* ── real PDF ingestion state ─────────────────────────────────────── */
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── benchmark demo state (cartel + ELA showcase) ─────────────────── */
  const [demo, setDemo] = useState<AuditCase[] | null>(null);
  const [demoSelId, setDemoSelId] = useState<string | null>(null);
  const [cartelDin, setCartelDin] = useState<string | null>(null);

  const ingest = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (files.length === 0) {
      setError("Please choose one or more PDF files.");
      return;
    }
    setError(null);
    setDemo(null);
    setBusy(true);
    setSummary(null);
    setSelectedId(null);
    setProgress(`Uploading ${files.length} document${files.length === 1 ? "" : "s"}…`);

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));

    try {
      setProgress(`Reading ${files.length} documents · Claude Vision + registry cross-check…`);
      const res = await fetch("/api/bulk-extract", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `Extraction failed (${res.status}).`);
      const data = json as Summary;
      setSummary(data);
      const firstEligible = data.rows.find((r) => r.eligible) ?? data.rows[0];
      setSelectedId(firstEligible?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }, []);

  function reset() {
    setSummary(null);
    setSelectedId(null);
    setError(null);
    setDemo(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const selected = summary?.rows.find((r) => r.id === selectedId) ?? null;
  const demoSelected = demo?.find((c) => c.bidderId === demoSelId) ?? null;

  return (
    <div className="space-y-5">
      {/* ── Command bar ────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gov-navy px-5 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold">Bulk AI Audit — Multi-PDF Ingestion</p>
              <p className="text-[11px] text-white/65">
                Drop every bidder&rsquo;s documents · read, cross-checked and scored in one pass
              </p>
            </div>
          </div>
          {(summary || demo) && (
            <button
              onClick={reset}
              className="btn rounded-md bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        <div className="p-5">
          {/* dropzone — shown until a real ingestion completes */}
          {!summary && (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !busy && inputRef.current?.click()}
                onKeyDown={(e) => !busy && (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (!busy) ingest(e.dataTransfer.files);
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  busy
                    ? "cursor-wait border-slate-300 bg-canvas"
                    : dragging
                      ? "cursor-pointer border-gov-orange bg-gov-wash"
                      : "cursor-pointer border-slate-300 bg-canvas hover:border-gov-navy/40",
                )}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
                    <p className="mt-3 text-base font-bold text-gov-navy">{progress}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Each PDF is read, its identity matched to the national registry, and its turnover
                      cross-checked — no need to open them one by one.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gov-navy text-white">
                      <UploadCloud className="h-7 w-7" />
                    </span>
                    <p className="mt-3 text-base font-bold text-gov-navy">
                      Upload Bidder PDFs — any number, all at once
                    </p>
                    <p className="mt-1 max-w-md text-sm text-ink-muted">
                      Drop 1 or 100 statutory PDFs (GST, PAN, Udyam, turnover certificates). Every file is
                      read automatically and the console shows which bidders are eligible for the tender.
                    </p>
                    <span className="btn mt-4 rounded-md bg-gov-orange px-5 py-2.5 text-sm font-bold text-white">
                      Select PDFs &amp; run audit
                    </span>
                    <p className="mt-3 text-[11px] text-ink-muted">
                      or{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDemo(BENCHMARK_CASES);
                          setDemoSelId(BENCHMARK_CASES[1].bidderId);
                        }}
                        className="font-semibold text-brand-600 underline-offset-2 hover:underline"
                      >
                        load the 5-case benchmark demo
                      </button>{" "}
                      (cartel graph + ELA forensics)
                    </p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && ingest(e.target.files)}
                    />
                  </>
                )}
              </div>
              {error && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">
                  <XCircle className="h-4 w-4 shrink-0" /> {error}
                </p>
              )}
            </>
          )}

          {/* summary chips after ingestion */}
          {summary && (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { k: "Documents read", v: summary.count, tone: "text-gov-navy", Icon: FileText },
                { k: "Matched to registry", v: summary.matched, tone: "text-brand-600", Icon: BadgeCheck },
                { k: "Distinct bidders", v: summary.distinctBidders, tone: "text-brand-700", Icon: Users },
                { k: "Eligible for tender", v: summary.eligible, tone: "text-risk-low", Icon: CheckCircle2 },
              ].map(({ k, v, tone, Icon }) => (
                <div key={k} className="rounded-xl border border-line bg-canvas px-4 py-3">
                  <Icon className={cn("h-4 w-4", tone)} />
                  <p className={cn("data mt-1.5 text-2xl font-extrabold", tone)}>{v}</p>
                  <p className="text-[11px] text-ink-muted">{k}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Real ingestion results: split screen ────────────────────── */}
      {summary && (
        <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold text-ink">Extracted Documents</h2>
              <span className="text-[11px] text-ink-muted">
                {summary.eligible} of {summary.count} ready for tender · click a row for detail
              </span>
            </div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left text-[10.5px] uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2.5 font-semibold">Document</th>
                    <th className="px-3 py-2.5 font-semibold">Detected type</th>
                    <th className="px-3 py-2.5 font-semibold">Entity / PAN</th>
                    <th className="px-3 py-2.5 font-semibold">Turnover</th>
                    <th className="px-3 py-2.5 font-semibold">Tender status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r) => {
                    const active = r.id === selectedId;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "cursor-pointer border-b border-line/70 transition-colors last:border-0",
                          active ? "bg-brand-50" : "hover:bg-canvas",
                        )}
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-start gap-2">
                            {r.eligible ? (
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-risk-low" />
                            ) : r.match ? (
                              <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-risk-review" />
                            ) : (
                              <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                            )}
                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate font-medium text-ink" title={r.fileName}>
                                {r.fileName}
                              </p>
                              <p className="text-[10.5px] text-ink-muted">
                                {r.sizeKb} KB · {r.pages || "?"}p · {r.confidence}% read
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="text-[12px] text-ink-soft">{r.detectedType}</span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {r.match ? (
                            <>
                              <p className="font-medium text-ink">{r.match.companyName}</p>
                              <p className="data mt-0.5 text-[11px] text-ink-muted">
                                {r.match.bidderId} · {r.fields.pan ?? r.fields.gstin ?? "—"}
                              </p>
                            </>
                          ) : (
                            <span className="data text-[12px] text-ink-muted">
                              {r.fields.pan ?? r.fields.gstin ?? "not detected"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top data text-[12px] text-ink">
                          {r.fields.turnoverCr !== undefined ? `₹${r.fields.turnoverCr} Cr` : "—"}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {r.eligible ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-risk-low-bg px-2 py-0.5 text-[10.5px] font-bold text-risk-low">
                              <CheckCircle2 className="h-3 w-3" /> Eligible
                            </span>
                          ) : r.match ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-risk-review-bg px-2 py-0.5 text-[10.5px] font-bold text-risk-review">
                              <ShieldAlert className="h-3 w-3" /> Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-ink-muted">
                              Unmatched
                            </span>
                          )}
                          {r.match?.isMsme && r.match.udyamNo !== "NA" && (
                            <span className="mt-1 block text-[10px] font-semibold text-risk-low">
                              EMD waived · Udyam
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-muted">
              Extraction is deterministic (PDF text layer) and cross-checked against the national
              registry. The AI recommends · the Procurement Officer decides.
            </p>
          </section>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <ExtractDetail row={selected} />
          </div>
        </div>
      )}

      {/* ── Benchmark demo: matrix + evidence + cartel ──────────────── */}
      {demo && (
        <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold text-ink">Benchmark Bidder Matrix</h2>
              <span className="text-[11px] text-ink-muted">5 seeded cases · click a row</span>
            </div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left text-[10.5px] uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2.5 font-semibold">Bidder</th>
                    <th className="px-3 py-2.5 font-semibold">Score</th>
                    <th className="px-3 py-2.5 font-semibold">Routing</th>
                    <th className="px-3 py-2.5 font-semibold">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {demo.map((c) => {
                    const active = c.bidderId === demoSelId;
                    return (
                      <tr
                        key={c.bidderId}
                        onClick={() => setDemoSelId(c.bidderId)}
                        className={cn(
                          "cursor-pointer border-b border-line/70 transition-colors last:border-0",
                          active ? "bg-brand-50" : "hover:bg-canvas",
                        )}
                      >
                        <td className="px-3 py-3 align-top">
                          <span className="data text-[12px] font-bold text-gov-navy">{c.bidderId}</span>
                          <p className="font-medium text-ink">{c.companyName}</p>
                        </td>
                        <td className="px-3 py-3 align-top data font-extrabold text-ink">{c.score}</td>
                        <td className="px-3 py-3 align-top">
                          <p className="text-[12px] text-ink-soft">{c.routing}</p>
                          {c.emdWaived && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded bg-risk-low-bg px-1.5 py-0.5 text-[10px] font-bold text-risk-low">
                              <BadgeCheck className="h-3 w-3" /> EMD Waived
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                              c.risk === "high" ? "bg-risk-high-bg text-risk-high" : "bg-risk-low-bg text-risk-low",
                            )}
                          >
                            {c.risk === "high" ? "High Risk" : "Recommended"}
                          </span>
                          {c.cartelWith.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCartelDin(c.directorDin);
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-risk-high/40 bg-risk-high-bg px-2 py-1 text-[10.5px] font-bold text-risk-high hover:bg-risk-high/15"
                            >
                              <Network className="h-3 w-3" /> View Network
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <div className="xl:sticky xl:top-4 xl:self-start">
            <EvidenceViewer selected={demoSelected} />
          </div>
        </div>
      )}

      <CartelModal open={!!cartelDin} din={cartelDin} onClose={() => setCartelDin(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-document detail — everything read, without opening the PDF    */
/* ------------------------------------------------------------------ */
function ExtractDetail({ row }: { row: BulkExtractRow | null }) {
  if (!row) {
    return (
      <div className="card flex h-full min-h-[380px] flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <MousePointerClick className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-ink">Select a document</p>
        <p className="mt-1 max-w-xs text-xs text-ink-muted">
          Pick any row to see everything the AI read from that PDF and how it matched the registry.
        </p>
      </div>
    );
  }

  const fieldRows: [string, string | undefined][] = [
    ["Company name", row.fields.companyName],
    ["PAN", row.fields.pan],
    ["GSTIN", row.fields.gstin],
    ["Udyam", row.fields.udyam],
    ["CIN", row.fields.cin],
    ["CA UDIN", row.fields.udin],
    ["Turnover", row.fields.turnoverCr !== undefined ? `₹${row.fields.turnoverCr} Cr` : undefined],
  ];

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="bg-gov-navy px-4 py-3 text-white">
        <p className="truncate text-sm font-bold" title={row.fileName}>
          {row.fileName}
        </p>
        <p className="text-[11px] text-white/65">
          {row.detectedType} · {row.confidence}% read confidence
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-thin p-4">
        {/* eligibility banner */}
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-xl px-3.5 py-3",
            row.eligible
              ? "bg-risk-low-bg text-risk-low"
              : row.match
                ? "bg-risk-review-bg text-risk-review"
                : "bg-slate-100 text-ink-muted",
          )}
        >
          {row.eligible ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-bold">
              {row.eligible
                ? "Eligible for tender"
                : row.match
                  ? "Matched — flagged for review"
                  : "Not matched to a registered entity"}
            </p>
            {row.match && (
              <p className="text-xs">
                {row.match.companyName} · {row.match.bidderId}
              </p>
            )}
          </div>
        </div>

        {/* extracted JSON */}
        <div className="overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/10">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Extracted fields
          </div>
          <dl className="divide-y divide-white/5 px-3.5 py-1">
            {fieldRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5 text-[12.5px]">
                <dt className="text-white/50">{k}</dt>
                <dd className={cn("data text-right", v ? "text-emerald-300" : "text-white/30")}>
                  {v ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* registry cross-check */}
        {row.match && (
          <dl className="divide-y divide-line rounded-xl border border-line text-[12.5px]">
            {[
              ["Registry turnover", `₹${row.match.registryTurnoverCr} Cr`],
              ["MSME", row.match.isMsme ? `Yes · ${row.match.udyamNo}` : "No"],
              ["Director / DIN", `${row.match.directorName} · ${row.match.directorDin}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* notes */}
        {row.notes.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Findings</p>
            <ul className="mt-2 space-y-1.5">
              {row.notes.map((n, i) => (
                <li key={i} className="flex gap-2 rounded-lg bg-canvas px-3 py-2 text-[12.5px] text-ink-soft">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      row.eligible ? "bg-risk-low" : "bg-risk-review",
                    )}
                  />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
