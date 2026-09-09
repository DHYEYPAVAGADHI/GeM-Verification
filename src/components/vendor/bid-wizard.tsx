"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  FileUp,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Vault,
} from "lucide-react";
import { removeBidDocument, saveBidStep, submitBid, uploadBidDocument } from "@/lib/actions";
import { DOC_TYPE_LABEL, WIZARD_STEPS } from "@/lib/domain";
import { Pill } from "@/components/ui/pill";
import { cn, inr } from "@/lib/utils";

type Extracted = {
  detectedType?: string;
  keyField?: { k: string; v: string };
  sourceCheck?: { label: string; ok: boolean; detail: string } | null;
  confidence?: number;
};
type WDoc = {
  id: string;
  declaredType: string;
  requiredDocId: string | null;
  fileName: string;
  status: string;
  extracted?: Extracted;
};
type Crit = { id: string; label: string; type: string; mandatory: boolean };
type Req = { id: string; docType: string; label: string; mandatory: boolean };
type BoqRow = { desc: string; qty: string; rate: string; gst: string };

const DECLARATIONS = [
  { key: "integrity", label: "Code of Integrity — no bribery, collusion or misrepresentation" },
  { key: "no_blacklist", label: "The firm is not blacklisted or debarred by any Government authority" },
  { key: "authenticity", label: "All uploaded documents are genuine and unaltered" },
  { key: "terms", label: "Accept the tender's terms, conditions and technical specifications" },
];

export function BidWizard({
  bid,
  tender,
  criteria,
  requiredDocs,
  documents,
  vaultDocs,
  responses,
  declarations,
}: {
  bid: {
    id: string;
    wizardStep: number;
    localContentPct: number | null;
    financialTotalCr: number | null;
    emdMode: string | null;
    makeModel: string | null;
    methodology: string | null;
    vendorIsMsme: boolean;
  };
  tender: { title: string; refNo: string; estValueCr: number; localContentClass: string };
  criteria: Crit[];
  requiredDocs: Req[];
  documents: WDoc[];
  vaultDocs: { id: string; docType: string; fileName: string }[];
  responses: { criterionId: string; complied: boolean }[];
  declarations?: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(bid.wizardStep, 7));
  const [dir, setDir] = useState(1);
  const [pending, start] = useTransition();

  const [complied, setComplied] = useState<Record<string, boolean>>(
    Object.fromEntries(responses.map((r) => [r.criterionId, r.complied])),
  );
  const [lc, setLc] = useState(String(bid.localContentPct ?? ""));
  const [emd, setEmd] = useState(bid.emdMode ?? (bid.vendorIsMsme ? "EXEMPT_MSME" : "PAID"));
  const [makeModel, setMakeModel] = useState(bid.makeModel ?? "");
  const [methodology, setMethodology] = useState(bid.methodology ?? "");
  const [decls, setDecls] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((declarations ?? []).map((k) => [k, true])),
  );
  const [dsc, setDsc] = useState(false);
  const [boq, setBoq] = useState<BoqRow[]>([
    { desc: "Supply of goods per technical schedule", qty: "1", rate: String(bid.financialTotalCr ?? tender.estValueCr), gst: "18" },
  ]);

  const boqTotal = boq.reduce((s, r) => {
    const base = (Number(r.qty) || 0) * (Number(r.rate) || 0);
    return s + base * (1 + (Number(r.gst) || 0) / 100);
  }, 0);

  const uploadedFor = useMemo(() => {
    const m = new Map<string, WDoc>();
    for (const d of documents) m.set(d.requiredDocId ?? d.declaredType, d);
    return m;
  }, [documents]);

  const missingDocs = requiredDocs
    .filter((r) => r.mandatory && !(uploadedFor.has(r.id) || uploadedFor.has(r.docType)))
    .map((r) => DOC_TYPE_LABEL[r.docType] ?? r.label);
  const mandatoryDocsDone = missingDocs.length === 0;
  const pendingDecls = DECLARATIONS.filter((d) => !decls[d.key]).length;
  const allDeclsChecked = pendingDecls === 0;
  const pendingCriteria = criteria.filter((c) => !complied[c.id]).length;
  const eligibilityDone = pendingCriteria === 0;

  /** One row per wizard requirement — drives the progress bar and the
   *  "what's left" checklist on the Review step. */
  const checklist = [
    {
      key: "elig",
      label: "Eligibility & compliance",
      step: 1,
      done: eligibilityDone,
      detail: `${pendingCriteria} ${pendingCriteria === 1 ? "criterion" : "criteria"} not yet confirmed`,
    },
    {
      key: "tech",
      label: "Technical bid — local content",
      step: 2,
      done: !!lc,
      detail: "Enter the local-content percentage",
    },
    {
      key: "fin",
      label: "Financial bid (Bill of Quantities)",
      step: 3,
      done: boqTotal > 0,
      detail: "Add at least one priced line item",
    },
    {
      key: "emd",
      label: "Earnest Money Deposit",
      step: 4,
      done: !!emd,
      detail: "Choose how the EMD is furnished",
    },
    {
      key: "docs",
      label: "Mandatory documents",
      step: 5,
      done: mandatoryDocsDone,
      detail: `Upload ${missingDocs.length}: ${missingDocs.join(", ")}`,
    },
    {
      key: "decl",
      label: "Declarations",
      step: 6,
      done: allDeclsChecked,
      detail: `${pendingDecls} of ${DECLARATIONS.length} not accepted`,
    },
    {
      key: "dsc",
      label: "Digital Signature (DSC)",
      step: 7,
      done: dsc,
      detail: "Tick the DSC signing box below",
    },
  ];
  const outstanding = checklist.filter((c) => !c.done);
  const progress = Math.round(((checklist.length - outstanding.length) / checklist.length) * 100);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function persist(nextStep: number) {
    start(async () => {
      try {
        await saveBidStep(bid.id, {
          step: nextStep,
          localContentPct: lc ? Number(lc) : undefined,
          financialTotalCr: boqTotal > 0 ? +boqTotal.toFixed(3) : undefined,
          emdMode: emd,
          makeModel,
          methodology,
          criterionResponses: criteria.map((c) => ({ criterionId: c.id, complied: !!complied[c.id] })),
        });
        go(nextStep);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  function doUpload(form: HTMLFormElement) {
    const fd = new FormData(form);
    start(async () => {
      try {
        const res = await uploadBidDocument(bid.id, fd);
        form.reset();
        router.refresh();
        if (res?.read) toast.success("Document uploaded and read");
        else toast.success("Document saved — automatic read skipped, you can still submit");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed — please try again");
      }
    });
  }

  function doSubmit() {
    start(async () => {
      try {
        await saveBidStep(bid.id, {
          declarations: DECLARATIONS.filter((d) => decls[d.key]).map((d) => ({ key: d.key, label: d.label })),
          criterionResponses: criteria.map((c) => ({ criterionId: c.id, complied: !!complied[c.id] })),
        });
        await submitBid(bid.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Submission failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* progress */}
      <div className="card card-pad">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
          <span>Bid completion</span>
          <span className="data text-ink">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
          <motion.div
            className="h-full rounded-full bg-brand-gradient"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        {outstanding.length > 0 && (
          <button
            onClick={() => go(7)}
            className="mt-2 flex w-full items-center justify-between gap-2 text-left text-xs text-ink-muted hover:text-ink"
          >
            <span>
              Still to complete:{" "}
              <span className="font-semibold text-risk-review">
                {outstanding.map((c) => c.label).join(" · ")}
              </span>
            </span>
            <span className="shrink-0 font-semibold text-brand-600">Review →</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <ol className="hidden space-y-1 lg:block">
          {WIZARD_STEPS.map((s) => (
            <li key={s.n}>
              <button
                onClick={() => go(s.n)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm",
                  step === s.n ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-soft hover:bg-canvas",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    s.n < step ? "bg-risk-low text-white" : step === s.n ? "bg-brand-600 text-white" : "bg-canvas text-ink-muted",
                  )}
                >
                  {s.n < step ? <Check className="h-3 w-3" /> : s.n}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        <div className="card card-pad overflow-hidden">
          <p className="mb-3 text-xs font-semibold text-ink-muted lg:hidden">
            Step {step} of 7 — {WIZARD_STEPS[step - 1].label}
          </p>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: dir * 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
              {step === 1 && (
                <Section title="Eligibility & compliance" hint="Confirm your firm meets each criterion of this tender.">
                  <ul className="divide-y divide-line">
                    {criteria.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                        <span className="text-sm text-ink-soft">
                          {c.label}
                          {c.mandatory && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase text-risk-high/60">mandatory</span>
                          )}
                        </span>
                        <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-ink-muted">
                          <input
                            type="checkbox"
                            checked={!!complied[c.id]}
                            onChange={(e) => setComplied((p) => ({ ...p, [c.id]: e.target.checked }))}
                          />
                          We comply
                        </label>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {step === 2 && (
                <Section title="Technical bid" hint="Details of the goods / services you are offering.">
                  <label className="label">Local content (%)</label>
                  <input value={lc} onChange={(e) => setLc(e.target.value)} type="number" className="field mt-1" placeholder="e.g. 62" />
                  <p className="mt-1 text-xs text-ink-muted">
                    This tender requires {tender.localContentClass}. Attach the bill of materials with your Make in India
                    declaration.
                  </p>
                  <label className="label mt-4 block">Make / model offered</label>
                  <input value={makeModel} onChange={(e) => setMakeModel(e.target.value)} className="field mt-1" />
                  <label className="label mt-4 block">Delivery methodology</label>
                  <textarea value={methodology} onChange={(e) => setMethodology(e.target.value)} rows={3} className="field mt-1" />
                </Section>
              )}

              {step === 3 && (
                <Section title="Financial bid — Bill of Quantities" hint="Sealed until financial opening. Prices in ₹ Cr.">
                  <div className="overflow-x-auto scroll-thin">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                          <th className="py-2 pr-2 font-semibold">Item</th>
                          <th className="py-2 px-2 font-semibold">Qty</th>
                          <th className="py-2 px-2 font-semibold">Unit rate</th>
                          <th className="py-2 px-2 font-semibold">GST %</th>
                          <th className="py-2 pl-2 text-right font-semibold">Amount</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {boq.map((r, i) => {
                          const amt = (Number(r.qty) || 0) * (Number(r.rate) || 0) * (1 + (Number(r.gst) || 0) / 100);
                          return (
                            <tr key={i} className="border-b border-line/60">
                              <td className="py-1.5 pr-2">
                                <input
                                  value={r.desc}
                                  onChange={(e) => setBoq((p) => p.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
                                  className="field px-2 py-1.5 text-xs"
                                />
                              </td>
                              {(["qty", "rate", "gst"] as const).map((f) => (
                                <td key={f} className="py-1.5 px-1">
                                  <input
                                    value={r[f]}
                                    type="number"
                                    onChange={(e) => setBoq((p) => p.map((x, j) => (j === i ? { ...x, [f]: e.target.value } : x)))}
                                    className="field w-16 px-2 py-1.5 text-xs"
                                  />
                                </td>
                              ))}
                              <td className="py-1.5 pl-2 text-right data">{amt.toFixed(2)}</td>
                              <td className="pl-1">
                                {boq.length > 1 && (
                                  <button onClick={() => setBoq((p) => p.filter((_, j) => j !== i))} className="text-risk-high">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => setBoq((p) => [...p, { desc: "", qty: "1", rate: "0", gst: "18" }])}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
                  >
                    <Plus className="h-3 w-3" /> Add line
                  </button>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                    <span className="text-sm font-semibold text-ink">Total quoted price (incl. taxes)</span>
                    <span className="data text-lg font-bold text-ink">{inr(boqTotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">Tender estimate: {inr(tender.estValueCr)}</p>
                </Section>
              )}

              {step === 4 && (
                <Section title="Earnest Money Deposit" hint="Choose how you are furnishing the EMD.">
                  {[
                    { v: "PAID", label: "EMD paid online", d: "Challan reference will be captured" },
                    {
                      v: "EXEMPT_MSME",
                      label: "Claim MSME / Startup exemption",
                      d: bid.vendorIsMsme ? "Your Udyam registration makes you eligible" : "Not available — no Udyam registration on file",
                    },
                    { v: "BANK_GUARANTEE", label: "Bank guarantee", d: "Upload the BG in the documents step" },
                  ].map((o) => (
                    <label
                      key={o.v}
                      className={cn(
                        "mt-2 flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                        emd === o.v ? "border-brand-400 bg-brand-50" : "border-line",
                        o.v === "EXEMPT_MSME" && !bid.vendorIsMsme && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <input
                        type="radio"
                        name="emd"
                        className="mt-1"
                        checked={emd === o.v}
                        disabled={o.v === "EXEMPT_MSME" && !bid.vendorIsMsme}
                        onChange={() => setEmd(o.v)}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-ink">{o.label}</span>
                        <span className="block text-xs text-ink-muted">{o.d}</span>
                      </span>
                    </label>
                  ))}
                </Section>
              )}

              {step === 5 && (
                <Section title="Documents" hint="Upload each required document — we read and cross-check it as you go.">
                  <ul className="space-y-3">
                    {requiredDocs.map((r) => {
                      const done = uploadedFor.get(r.id) ?? uploadedFor.get(r.docType);
                      const vaultMatch = vaultDocs.filter((v) => v.docType === r.docType);
                      return (
                        <li key={r.id} className="rounded-xl border border-line p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-ink">
                              {DOC_TYPE_LABEL[r.docType] ?? r.label}
                              {!r.mandatory && <span className="ml-1 text-xs text-ink-muted">(optional)</span>}
                            </span>
                            {done ? (
                              <Pill tone="bg-risk-low-bg text-risk-low" dot>
                                {done.fileName}
                              </Pill>
                            ) : (
                              <Pill tone="bg-slate-100 text-ink-muted">Not uploaded</Pill>
                            )}
                          </div>

                          {done ? (
                            <div className="mt-2 space-y-1.5">
                              {done.extracted?.keyField && (
                                <p className="text-xs text-ink-muted">
                                  Read: <span className="data text-ink">{done.extracted.keyField.k} {done.extracted.keyField.v}</span>
                                  {done.extracted.confidence ? ` · OCR ${done.extracted.confidence}%` : ""}
                                </p>
                              )}
                              {done.extracted?.sourceCheck && (
                                <p
                                  className={cn(
                                    "inline-flex items-center gap-1 text-xs font-semibold",
                                    done.extracted.sourceCheck.ok ? "text-risk-low" : "text-risk-high",
                                  )}
                                >
                                  {done.extracted.sourceCheck.ok ? (
                                    <CircleCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <CircleX className="h-3.5 w-3.5" />
                                  )}
                                  {done.extracted.sourceCheck.detail} ({done.extracted.sourceCheck.label})
                                </p>
                              )}
                              <button
                                onClick={() => start(async () => { await removeBidDocument(done.id); router.refresh(); })}
                                className="block text-xs font-semibold text-risk-high"
                              >
                                <Trash2 className="mr-1 inline h-3 w-3" /> Remove
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <form onSubmit={(e) => { e.preventDefault(); doUpload(e.currentTarget); }} className="flex items-center gap-2">
                                <input type="hidden" name="declaredType" value={r.docType} />
                                <input type="hidden" name="requiredDocId" value={r.id} />
                                <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required className="text-xs" />
                                <button className="btn-ghost px-2.5 py-1.5 text-xs" disabled={pending}>
                                  <FileUp className="h-3 w-3" /> Upload
                                </button>
                              </form>
                              {vaultMatch.map((vd) => (
                                <form key={vd.id} onSubmit={(e) => { e.preventDefault(); doUpload(e.currentTarget); }}>
                                  <input type="hidden" name="declaredType" value={r.docType} />
                                  <input type="hidden" name="requiredDocId" value={r.id} />
                                  <input type="hidden" name="profileDocId" value={vd.id} />
                                  <button className="btn-ghost px-2.5 py-1.5 text-xs" disabled={pending}>
                                    <Vault className="h-3 w-3" /> Use vault copy
                                  </button>
                                </form>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {step === 6 && (
                <Section title="Declarations" hint="All four are required to submit.">
                  {DECLARATIONS.map((d) => (
                    <label key={d.key} className="mt-2 flex items-start gap-3 rounded-xl border border-line p-3 text-sm text-ink-soft">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={!!decls[d.key]}
                        onChange={(e) => setDecls((p) => ({ ...p, [d.key]: e.target.checked }))}
                      />
                      {d.label}
                    </label>
                  ))}
                </Section>
              )}

              {step === 7 && (
                <Section title="Review & submit" hint="Check everything, sign with your DSC, then submit.">
                  {/* What's left — everything blocking a 100% / submittable bid */}
                  {outstanding.length > 0 ? (
                    <div className="rounded-xl border border-risk-review/40 bg-risk-review-bg p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-risk-review">
                        <CircleX className="h-4 w-4 shrink-0" />
                        {outstanding.length} item{outstanding.length === 1 ? "" : "s"} left before this bid can be
                        submitted ({progress}% complete)
                      </p>
                      <ul className="mt-3 space-y-2">
                        {outstanding.map((c) => (
                          <li
                            key={c.key}
                            className="flex items-start justify-between gap-3 rounded-lg bg-white/80 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink">{c.label}</p>
                              <p className="text-xs text-ink-muted">{c.detail}</p>
                            </div>
                            {c.step === 7 ? (
                              <span className="shrink-0 text-xs font-semibold text-ink-muted">below ↓</span>
                            ) : (
                              <button
                                onClick={() => go(c.step)}
                                className="btn-ghost shrink-0 px-2.5 py-1 text-xs"
                              >
                                Fix <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-risk-low/30 bg-risk-low-bg px-4 py-3 text-sm font-semibold text-risk-low">
                      <CircleCheck className="h-4 w-4 shrink-0" />
                      All sections complete — sign with your DSC and submit.
                    </div>
                  )}

                  <dl className="mt-4 divide-y divide-line text-sm">
                    {(
                      [
                        ["Tender", tender.refNo, true],
                        ["Local content", lc ? `${lc}%` : "Not set", !!lc],
                        ["Financial bid", boqTotal > 0 ? inr(boqTotal) : "Not priced", boqTotal > 0],
                        ["EMD", emd ? emd.replace("_", " ") : "Not chosen", !!emd],
                        [
                          "Mandatory documents",
                          mandatoryDocsDone
                            ? `${documents.length} uploaded · complete`
                            : `${missingDocs.length} missing of ${requiredDocs.filter((r) => r.mandatory).length}`,
                          mandatoryDocsDone,
                        ],
                        [
                          "Declarations",
                          allDeclsChecked ? "All accepted" : `${pendingDecls} pending`,
                          allDeclsChecked,
                        ],
                      ] as [string, string, boolean][]
                    ).map(([k, v, ok]) => (
                      <div key={k} className="flex justify-between py-2">
                        <dt className="text-ink-muted">{k}</dt>
                        <dd className={cn("font-medium", ok ? "text-ink" : "text-risk-review")}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <label
                    className={cn(
                      "mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm text-ink-soft",
                      dsc ? "border-line bg-canvas" : "border-risk-review/50 bg-risk-review-bg",
                    )}
                  >
                    <input type="checkbox" className="mt-0.5" checked={dsc} onChange={(e) => setDsc(e.target.checked)} />
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-brand-600" />
                      I am signing this bid with my registered Digital Signature Certificate (DSC).
                    </span>
                  </label>
                  <button
                    onClick={doSubmit}
                    disabled={pending || outstanding.length > 0}
                    className="btn-primary mt-4 w-full"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {outstanding.length > 0
                      ? `Complete ${outstanding.length} item${outstanding.length === 1 ? "" : "s"} to submit`
                      : "Sign & submit bid"}
                  </button>
                  <p className="mt-2 text-center text-xs text-ink-muted">
                    Submitting locks the bid and generates a hash-stamped acknowledgement.
                  </p>
                </Section>
              )}
          </motion.div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <button onClick={() => go(Math.max(1, step - 1))} disabled={step === 1 || pending} className="btn-ghost">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < 7 && (
              <button onClick={() => persist(step + 1)} disabled={pending} className="btn-primary">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save &amp; continue <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
