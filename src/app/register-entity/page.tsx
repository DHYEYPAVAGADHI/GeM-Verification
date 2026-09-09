"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldAlert,
  UploadCloud,
  X,
} from "lucide-react";
import { Emblem } from "@/components/ui/logo";
import {
  GSTIN_RE,
  PAN_RE,
  panFromGstin,
  registerVendor,
  rememberVerifiedBidder,
} from "@/lib/vendor-sandbox";
import { cn } from "@/lib/utils";

type TextForm = {
  company_name: string;
  cin_number: string;
  pan_number: string;
  gstin: string;
  registered_address: string;
  director_name: string;
  director_din: string;
  udyam_reg_no: string;
  mii_percentage: string;
  fy_turnover_cr: string;
  ca_udin: string;
};

const EMPTY: TextForm = {
  company_name: "",
  cin_number: "",
  pan_number: "",
  gstin: "",
  registered_address: "",
  director_name: "",
  director_din: "",
  udyam_reg_no: "",
  mii_percentage: "",
  fy_turnover_cr: "",
  ca_udin: "",
};

const CIN_RE = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const DIN_RE = /^[0-9]{6,8}$/;
const UDYAM_RE = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
const UDIN_RE = /^[0-9]{2}[A-Z0-9]{16}$/;

function resolveRedirect(redirect: string | null, bidderId: string) {
  if (!redirect) return "/tenders";
  const m = redirect.match(/\/(?:dashboard\/apply|vendor\/tenders)\/([^/?#]+)/);
  if (m) return `/vendor/tenders/${m[1]}?bidder_id=${encodeURIComponent(bidderId)}`;
  return redirect;
}

/* ------------------------------------------------------------------ */
/*  Drag-and-drop PDF uploader                                        */
/* ------------------------------------------------------------------ */
function PdfDropzone({
  label,
  hint,
  file,
  onFile,
  required,
  error,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File | null) => void;
  required?: boolean;
  error?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      const ok = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      onFile(ok ? f : null);
      if (!ok) alert(`${label}: only PDF files are accepted.`);
    },
    [label, onFile],
  );

  return (
    <div>
      <span className="block text-sm font-semibold text-gov-navy">
        {label} {required && <span className="text-risk-high">*</span>}
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging
            ? "border-gov-orange bg-gov-wash"
            : error
              ? "border-risk-high/50 bg-risk-high-bg"
              : "border-slate-300 bg-canvas hover:border-gov-navy/40",
        )}
      >
        {file ? (
          <div className="flex w-full items-center gap-2.5">
            <FileText className="h-5 w-5 shrink-0 text-gov-navy" />
            <span className="min-w-0 flex-1 truncate text-left text-sm text-ink">{file.name}</span>
            <span className="shrink-0 text-xs text-ink-muted">
              {(file.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label={`Remove ${label}`}
              className="rounded p-1 text-ink-muted hover:bg-slate-200 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-ink-muted" />
            <p className="mt-1.5 text-sm font-medium text-gov-navy">
              Drag &amp; drop or <span className="text-gov-orange">browse</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-risk-high">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field primitives                                                  */
/* ------------------------------------------------------------------ */
function Field({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  hint,
  upper,
  className,
}: {
  label: string;
  name: keyof TextForm;
  value: string;
  onChange: (name: keyof TextForm, v: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  upper?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-semibold text-gov-navy">
        {label} <span className="text-risk-high">*</span>
      </label>
      <input
        id={name}
        value={value}
        onChange={(e) => onChange(name, upper ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn("field mt-1.5", upper && "data tracking-wide", error && "border-risk-high")}
        aria-invalid={!!error}
      />
      {error ? (
        <p className="mt-1 text-xs font-medium text-risk-high">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard                                                            */
/* ------------------------------------------------------------------ */
function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<TextForm>(EMPTY);
  const [isMsme, setIsMsme] = useState(false);
  const [turnoverCert, setTurnoverCert] = useState<File | null>(null);
  const [gstCert, setGstCert] = useState<File | null>(null);
  const [udyamCert, setUdyamCert] = useState<File | null>(null);

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ bidder_id: string; company_name: string } | null>(null);

  // The PAN was auto-derived from a well-formed GSTIN (user hasn't edited it).
  const [panAuto, setPanAuto] = useState(false);

  const set = (name: keyof TextForm, v: string) => {
    setForm((f) => {
      const next = { ...f, [name]: v };
      if (name === "gstin") {
        const g = v.trim().toUpperCase();
        if (GSTIN_RE.test(g) && (f.pan_number.trim() === "" || panAuto)) {
          next.pan_number = panFromGstin(g);
          setPanAuto(true);
        }
      }
      if (name === "pan_number") setPanAuto(false);
      return next;
    });
    setErrors((e) => ({
      ...e,
      [name]: undefined,
      ...(name === "gstin" ? { pan_number: undefined } : {}),
    }));
  };

  function prefillSample() {
    setForm({
      company_name: "Sagar Infra Pvt Ltd",
      cin_number: "U29309MH2020PTC123456",
      pan_number: "SGRCI4521K",
      gstin: "27SGRCI4521K1Z8",
      registered_address: "Plot 22, MIDC Chakan Industrial Area, Pune - 410501",
      director_name: "Sagar Deshpande",
      director_din: "09541278",
      udyam_reg_no: "UDYAM-MH-18-0044120",
      mii_percentage: "64",
      fy_turnover_cr: "31.75",
      ca_udin: "24123456ABCDEF1234",
    });
    setIsMsme(true);
    setPanAuto(false);
    setErrors({});
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (form.company_name.trim().length < 3) e.company_name = "Enter the registered company name.";
    if (!CIN_RE.test(form.cin_number.trim()))
      e.cin_number = "CIN must be 21 characters, e.g. U29309MH2020PTC123456.";
    if (!PAN_RE.test(form.pan_number.trim()))
      e.pan_number = "Enter a valid 10-character PAN (AAAAA0000A).";
    if (!GSTIN_RE.test(form.gstin.trim()))
      e.gstin = "GSTIN must be 15 characters, e.g. 27AAAAA0000A1Z5.";
    else if (
      PAN_RE.test(form.pan_number.trim()) &&
      panFromGstin(form.gstin) !== form.pan_number.trim()
    )
      e.pan_number = `This GSTIN belongs to PAN ${panFromGstin(form.gstin)} — clear the PAN field to auto-fill it.`;
    if (form.registered_address.trim().length < 10)
      e.registered_address = "Enter the full registered address.";
    if (form.director_name.trim().length < 3) e.director_name = "Enter the director’s name.";
    if (!DIN_RE.test(form.director_din.trim())) e.director_din = "DIN is 6–8 digits.";
    if (isMsme && !UDYAM_RE.test(form.udyam_reg_no.trim()))
      e.udyam_reg_no = "Udyam number must match UDYAM-MH-18-0099999.";
    const mii = Number(form.mii_percentage);
    if (form.mii_percentage === "" || Number.isNaN(mii) || mii < 0 || mii > 100)
      e.mii_percentage = "Enter a Make-in-India percentage between 0 and 100.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    const t = Number(form.fy_turnover_cr);
    if (form.fy_turnover_cr === "" || Number.isNaN(t) || t < 0)
      e.fy_turnover_cr = "Enter the audited FY turnover in ₹ Cr.";
    if (!UDIN_RE.test(form.ca_udin.trim()))
      e.ca_udin = "UDIN is 18 characters, e.g. 24123456ABCDEF1234.";
    if (!turnoverCert) e.turnover_certificate = "Turnover Certificate (PDF) is mandatory.";
    if (!gstCert) e.gst_certificate = "GSTIN Certificate (PDF) is mandatory.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validateStep2()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const fd = new FormData();
      fd.set("company_name", form.company_name.trim());
      fd.set("cin_number", form.cin_number.trim());
      fd.set("pan_number", form.pan_number.trim());
      fd.set("gstin", form.gstin.trim());
      fd.set("is_msme", String(isMsme));
      fd.set("udyam_reg_no", isMsme ? form.udyam_reg_no.trim() : "NA");
      fd.set("fy_turnover_cr", String(Number(form.fy_turnover_cr)));
      fd.set("ca_udin", form.ca_udin.trim());
      fd.set("mii_percentage", String(Number(form.mii_percentage)));
      fd.set("director_name", form.director_name.trim());
      fd.set("director_din", form.director_din.trim());
      fd.set("registered_address", form.registered_address.trim());
      fd.set("turnover_certificate", turnoverCert!);
      fd.set("gst_certificate", gstCert!);
      if (udyamCert) fd.set("udyam_certificate", udyamCert);

      const res = await registerVendor(fd);
      setDone({ bidder_id: res.bidder_id, company_name: res.company_name });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function finish() {
    if (!done) return;
    const target = resolveRedirect(redirect, done.bidder_id);
    const m = redirect?.match(/([^/?#]+)$/);
    if (m) rememberVerifiedBidder(done.bidder_id, m[1]);
    router.push(target);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/tenders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-orange">
        <ArrowLeft className="h-4 w-4" /> Back to Ongoing Bids
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gov-navy">
            Create your GeM Account
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Two steps — corporate &amp; tax details, then financials and statutory PDFs. On submission
            GeM verifies your certificates, adds the entity to the national registry, and issues a
            Bidder ID.
          </p>
        </div>
        {step === 1 && (
          <button
            type="button"
            onClick={prefillSample}
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-canvas"
          >
            Prefill sample values
          </button>
        )}
      </div>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-3 text-sm">
        {[
          { n: 1, label: "Corporate & Tax Details" },
          { n: 2, label: "Financials & Documents" },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                step >= (s.n as 1 | 2) ? "bg-gov-navy text-white" : "bg-slate-200 text-ink-muted",
              )}
            >
              {s.n}
            </span>
            <span className={cn("font-medium", step === s.n ? "text-gov-navy" : "text-ink-muted")}>
              {s.label}
            </span>
            {i === 0 && <span className="h-px w-8 bg-slate-300" />}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        {/* STEP 1 -------------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-5">
            <Field label="Company / Entity Name" name="company_name" value={form.company_name} onChange={set} error={errors.company_name} placeholder="Falcon Robotics Pvt Ltd" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="CIN" name="cin_number" value={form.cin_number} onChange={set} error={errors.cin_number} placeholder="U29309MH2020PTC123456" upper />
              <Field
                label="Company PAN"
                name="pan_number"
                value={form.pan_number}
                onChange={set}
                error={errors.pan_number}
                placeholder="AAAAA0000A"
                upper
                hint={panAuto && form.pan_number ? "Auto-filled from the GSTIN — edit to override." : undefined}
              />
            </div>
            <Field label="GSTIN" name="gstin" value={form.gstin} onChange={set} error={errors.gstin} placeholder="27AAAAA0000A1Z5" upper hint="Enter the GSTIN first — the PAN is filled from it automatically." />
            <Field label="Registered Address" name="registered_address" value={form.registered_address} onChange={set} error={errors.registered_address} placeholder="Plot 7, MIDC Bhosari, Pune - 411026" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Director Name" name="director_name" value={form.director_name} onChange={set} error={errors.director_name} placeholder="A. Mehta" />
              <Field label="Director DIN" name="director_din" value={form.director_din} onChange={set} error={errors.director_din} placeholder="09876543" />
            </div>

            {/* MSME toggle */}
            <div className="rounded-xl border border-slate-200 bg-canvas p-4">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold text-gov-navy">
                    Registered as an MSME (Udyam)
                  </span>
                  <span className="block text-xs text-ink-muted">
                    Enables EMD exemption and turnover relaxation under MSE Order 2012.
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMsme}
                  onClick={() => setIsMsme((v) => !v)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    isMsme ? "bg-gov-green" : "bg-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      isMsme ? "translate-x-[22px]" : "translate-x-0.5",
                    )}
                  />
                </button>
              </label>
              {isMsme && (
                <div className="mt-3">
                  <Field
                    label="Udyam Registration Number"
                    name="udyam_reg_no"
                    value={form.udyam_reg_no}
                    onChange={set}
                    error={errors.udyam_reg_no}
                    placeholder="UDYAM-MH-18-0099999"
                    upper
                  />
                </div>
              )}
            </div>

            <Field label="Make-in-India (MII) %" name="mii_percentage" value={form.mii_percentage} onChange={set} error={errors.mii_percentage} placeholder="68" hint="Local content percentage of your offering (0–100)." />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => validateStep1() && setStep(2)}
                className="btn rounded-md bg-gov-navy px-5 py-2.5 text-white hover:bg-gov-navy-deep"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 -------------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Audited FY Turnover (₹ Cr)" name="fy_turnover_cr" value={form.fy_turnover_cr} onChange={set} error={errors.fy_turnover_cr} placeholder="27.50" />
              <Field label="CA UDIN" name="ca_udin" value={form.ca_udin} onChange={set} error={errors.ca_udin} placeholder="24123456ABCDEF1234" upper />
            </div>

            <PdfDropzone
              label="Turnover Certificate"
              hint="CA-certified statement of the audited FY turnover · PDF"
              file={turnoverCert}
              onFile={(f) => {
                setTurnoverCert(f);
                setErrors((e) => ({ ...e, turnover_certificate: undefined }));
              }}
              required
              error={errors.turnover_certificate}
            />
            <PdfDropzone
              label="GSTIN Certificate"
              hint="GST registration certificate (REG-06) · PDF"
              file={gstCert}
              onFile={(f) => {
                setGstCert(f);
                setErrors((e) => ({ ...e, gst_certificate: undefined }));
              }}
              required
              error={errors.gst_certificate}
            />
            <PdfDropzone
              label="Udyam Certificate"
              hint={isMsme ? "Udyam registration certificate · PDF" : "Optional — upload if MSME registered"}
              file={udyamCert}
              onFile={setUdyamCert}
            />

            {serverError && (
              <p className="flex items-center gap-2 rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">
                <ShieldAlert className="h-4 w-4 shrink-0" /> {serverError}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn rounded-md border border-slate-300 bg-white px-4 py-2.5 text-ink-soft hover:bg-canvas"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="btn rounded-md bg-gov-orange px-5 py-2.5 text-white hover:bg-gov-orange-dark disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>Submit Registration <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success modal -------------------------------------------------- */}
      {done && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gov-navy/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-pop">
            <div className="h-1 w-full bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
            <div className="p-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-risk-low-bg">
                <CheckCircle2 className="h-8 w-8 text-risk-low" />
              </span>
              <h2 className="mt-3 text-lg font-bold text-gov-navy">Entity Registered</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {done.company_name} has been added to the national mock registry.
              </p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">Your Bidder ID</p>
                <p className="data mt-0.5 text-xl font-extrabold text-gov-navy">{done.bidder_id}</p>
              </div>
              <button
                type="button"
                onClick={finish}
                className="btn mt-5 w-full rounded-md bg-gov-orange px-4 py-2.5 text-white hover:bg-gov-orange-dark"
              >
                Continue to Tender Application <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/tenders"
                className="mt-2 block text-xs font-semibold text-ink-muted hover:text-gov-navy"
              >
                Browse other tenders instead
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterEntityPage() {
  return (
    <div className="min-h-screen bg-gov-wash">
      <div className="h-1.5 w-full bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-4 py-3">
          <Emblem className="h-8 w-8" />
          <span className="text-sm font-bold text-gov-navy">
            GeM · Vendor Verification &amp; Registration Engine
          </span>
        </div>
      </header>
      <Suspense fallback={<div className="p-10 text-center text-sm text-ink-muted">Loading…</div>}>
        <Wizard />
      </Suspense>
    </div>
  );
}
