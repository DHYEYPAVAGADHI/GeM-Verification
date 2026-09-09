"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { applyPath, type PublicTender } from "@/lib/public-tenders";
import {
  classifyIdentifier,
  rememberVerifiedBidder,
  verifyVendor,
  type VendorRecord,
} from "@/lib/vendor-sandbox";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

type Phase = "enter" | "verifying" | "found" | "notfound" | "error";

export function TenderParticipateModal({
  tender,
  open,
  onClose,
  isLoggedIn,
}: {
  tender: PublicTender | null;
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [phase, setPhase] = useState<Phase>("enter");
  const [record, setRecord] = useState<VendorRecord | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // reset whenever the modal is (re)opened for a tender
  useEffect(() => {
    if (open) {
      setIdentifier("");
      setPhase("enter");
      setRecord(null);
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, tender?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !tender) return null;

  const kind = classifyIdentifier(identifier);
  const canSubmit = kind !== "invalid" && phase !== "verifying";

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPhase("verifying");
    setMessage("");
    try {
      const res = await verifyVendor(identifier);
      if (res.ok) {
        setRecord(res.record);
        setPhase("found");
      } else {
        setMessage(res.data.message);
        setPhase("notfound");
      }
    } catch (err) {
      setMessage((err as Error).message || "The verification service is unavailable.");
      setPhase("error");
    }
  }

  function proceed() {
    if (!record || !tender) return;
    rememberVerifiedBidder(record.bidder_id, tender.id);
    const target = `${applyPath(tender.id)}?bidder_id=${encodeURIComponent(record.bidder_id)}`;
    router.push(isLoggedIn ? target : `/login?redirect=${encodeURIComponent(target)}`);
  }

  function registerNewEntity() {
    if (!tender) return;
    const back = `/dashboard/apply/${tender.id}`;
    router.push(`/register-entity?redirect=${encodeURIComponent(back)}`);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-gov-navy/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Verify your entity to participate"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-pop sm:rounded-2xl">
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-gov-saffron via-white to-gov-green" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gov-navy px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Entity Verification · GeM Mock Registry
            </p>
            <h2 className="mt-0.5 truncate text-base font-bold">{tender.title}</h2>
            <p className="data mt-0.5 text-[11px] text-white/60">{tender.bid_no}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* ENTER / VERIFYING / ERROR ------------------------------------ */}
          {(phase === "enter" || phase === "verifying" || phase === "error") && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="vendor-identifier" className="block text-sm font-semibold text-gov-navy">
                  Verify your identity — enter PAN or GSTIN
                </label>
                <p className="mt-1 text-xs text-ink-muted">
                  Your registration is checked against the national mock registry
                  ( <span className="data">gem_bidders_registry_1000.csv</span> ).
                </p>
                <input
                  ref={inputRef}
                  id="vendor-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="AAACA1234A  or  27AAACA1234A1Z5"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={15}
                  className="field data mt-2 tracking-wide"
                  aria-invalid={identifier.length > 0 && kind === "invalid"}
                />
                <p className="mt-1.5 text-xs">
                  {identifier.length === 0 ? (
                    <span className="text-ink-muted">10-character PAN or 15-character GSTIN.</span>
                  ) : kind === "pan" ? (
                    <span className="text-risk-low">✓ Looks like a valid PAN</span>
                  ) : kind === "gstin" ? (
                    <span className="text-risk-low">✓ Looks like a valid GSTIN</span>
                  ) : (
                    <span className="text-risk-review">
                      Enter a 10-char PAN or a 15-char GSTIN
                    </span>
                  )}
                </p>
              </div>

              {phase === "error" && (
                <p className="flex items-center gap-2 rounded-lg bg-risk-high-bg px-3 py-2 text-[13px] font-medium text-risk-high">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {message}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn w-full rounded-md bg-gov-navy px-4 py-2.5 text-white hover:bg-gov-navy-deep disabled:opacity-40"
              >
                {phase === "verifying" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying identity…
                  </>
                ) : (
                  "Verify Identity"
                )}
              </button>
            </form>
          )}

          {/* FOUND ------------------------------------------------------- */}
          {phase === "found" && record && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-risk-low/30 bg-risk-low-bg px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-risk-low" />
                <div>
                  <p className="text-sm font-bold text-risk-low">Entity verified</p>
                  <p className="text-xs text-ink-soft">
                    Found in the GeM mock registry — pre-filled details below.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-navy/5 text-gov-navy">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gov-navy">{record.company_name}</p>
                    <p className="data text-[11px] text-ink-muted">{record.bidder_id}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Pill tone="bg-gov-wash text-gov-navy">
                    <BadgeCheck className="mr-1 inline h-3 w-3" />
                    GSTIN {record.gstin}
                  </Pill>
                  {record.is_msme ? (
                    <Pill tone="bg-risk-low-bg text-risk-low">MSME · Udyam {record.udyam_reg_no}</Pill>
                  ) : (
                    <Pill tone="bg-slate-100 text-ink-muted">Not registered as MSME</Pill>
                  )}
                  <Pill tone="bg-slate-100 text-ink-soft">
                    FY turnover ₹{record.fy_turnover_cr.toFixed(2)} Cr
                  </Pill>
                  {record.tampered_flag && (
                    <Pill tone="bg-risk-high-bg text-risk-high">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      Prior tamper flag
                    </Pill>
                  )}
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <dt className="text-ink-muted">Director</dt>
                  <dd className="text-ink">{record.director_name}</dd>
                  <dt className="text-ink-muted">DIN</dt>
                  <dd className="data text-ink">{record.director_din}</dd>
                  <dt className="text-ink-muted">Make-in-India</dt>
                  <dd className="text-ink">{record.mii_percentage.toFixed(1)}%</dd>
                </dl>
              </div>

              <button
                type="button"
                onClick={proceed}
                className="btn w-full rounded-md bg-gov-orange px-4 py-2.5 text-white hover:bg-gov-orange-dark"
              >
                Proceed to Tender Application <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* NOT FOUND ------------------------------------------------- */}
          {phase === "notfound" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-risk-review/40 bg-risk-review-bg px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-risk-review" />
                <div>
                  <p className="text-sm font-bold text-risk-review">
                    Entity Not Found in GeM Mock Registry
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    The PAN / GSTIN you entered isn&rsquo;t registered on GeM
                    {identifier ? (
                      <> — <span className="data font-medium text-gov-navy">{identifier}</span></>
                    ) : null}
                    . You&rsquo;ll need a new GeM account to participate.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gov-navy/10 bg-gov-wash p-4">
                <p className="text-[13px] font-semibold text-gov-navy">Create a new GeM account</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  Submit your corporate &amp; tax details and upload the statutory PDFs. GeM
                  verifies your{" "}
                  <span className="font-medium text-gov-navy">
                    Turnover, GSTIN and Udyam certificates
                  </span>
                  , registers the entity in the national registry, and issues a fresh{" "}
                  <span className="font-semibold text-gov-navy">Bidder ID</span> — you return
                  straight to this tender with pre-filled details.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPhase("enter")}
                  className="btn rounded-md border border-slate-300 bg-white px-4 py-2.5 text-ink-soft hover:bg-canvas sm:flex-1"
                >
                  Re-check PAN / GSTIN
                </button>
                <button
                  type="button"
                  onClick={registerNewEntity}
                  className="btn rounded-md bg-gov-orange px-4 py-2.5 text-white hover:bg-gov-orange-dark sm:flex-1"
                >
                  Create New GeM Account <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
