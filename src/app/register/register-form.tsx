"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { registerAction } from "@/lib/actions";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const CONSTITUTIONS = [
  "Private Limited Company", "Public Limited Company", "Limited Liability Partnership",
  "Partnership Firm", "Proprietorship", "Society / Trust", "Cooperative",
];

function SubmitButton({ role }: { role: string }) {
  const { pending } = useFormStatus();
  const { dict } = useI18n();
  const t = dict.register;
  return (
    <button
      type="submit"
      className="btn w-full rounded-md bg-gov-orange text-white hover:bg-gov-orange-dark"
      disabled={pending}
    >
      {pending
        ? role === "VENDOR"
          ? t.creatingVendor
          : t.creatingOfficer
        : role === "VENDOR"
          ? t.submitVendor
          : t.submitOfficer}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function Field({
  label,
  name,
  hint,
  children,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {hint && <span className="font-normal text-ink-muted">{hint}</span>}
      </label>
      {children ?? <input id={name} name={name} className="field mt-1.5" {...rest} />}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 border-b border-line pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
      {children}
    </p>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, formAction] = useFormState(registerAction, undefined);
  const [role, setRole] = useState<"VENDOR" | "OFFICER">("VENDOR");
  const [isMsme, setIsMsme] = useState(false);
  const { dict } = useI18n();
  const t = dict.register;
  const fx = t.fields;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="redirectTo" value={callbackUrl ?? ""} />
      <input type="hidden" name="isMsme" value={isMsme ? "yes" : "no"} />

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { v: "VENDOR", label: t.roleVendor, icon: Building2 },
            { v: "OFFICER", label: t.roleOfficer, icon: ShieldCheck },
          ] as const
        ).map((o) => (
          <button
            type="button"
            key={o.v}
            onClick={() => setRole(o.v)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors",
              role === o.v
                ? "border-gov-navy bg-gov-navy text-white"
                : "border-line bg-white text-ink-soft hover:bg-canvas",
            )}
          >
            <o.icon className="h-4 w-4" />
            {o.label}
          </button>
        ))}
      </div>

      <SectionTitle>{t.sections.account}</SectionTitle>
      <Field
        label={role === "VENDOR" ? fx.legalName : fx.fullName}
        name="name"
        required
        placeholder={role === "VENDOR" ? "e.g. Apollo Instruments Pvt Ltd" : "e.g. R. Menon"}
      />
      <Field
        label={role === "VENDOR" ? fx.workEmail : fx.govEmail}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={fx.password} name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Field label={fx.confirm} name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </div>

      {role === "VENDOR" && (
        <>
          <SectionTitle>{t.sections.entity}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fx.constitution} name="constitution">
              <select id="constitution" name="constitution" required className="field mt-1.5" defaultValue="Private Limited Company">
                {CONSTITUTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label={fx.cin} name="cin" hint={fx.cinHint} placeholder="U72900KA2015PTC000001" maxLength={21} style={{ textTransform: "uppercase" }} />
          </div>
          <Field label={fx.address} name="registeredAddress">
            <textarea id="registeredAddress" name="registeredAddress" required rows={2} placeholder={fx.addressPlaceholder} className="field mt-1.5" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fx.state} name="state">
              <select id="state" name="state" required className="field mt-1.5" defaultValue="">
                <option value="" disabled>{fx.select}</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label={fx.sector} name="sector" hint={fx.optional} placeholder="e.g. IT Hardware" />
          </div>

          <SectionTitle>{t.sections.statutory}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fx.pan} name="pan" required placeholder="AAAAA0000A" maxLength={10} style={{ textTransform: "uppercase" }} />
            <Field label={fx.gstin} name="gstin" required placeholder="29AAAAA0000A1Z5" maxLength={15} style={{ textTransform: "uppercase" }} />
          </div>
          <Field
            label={fx.aadhaar}
            name="aadhaar"
            hint={fx.aadhaarHint}
            inputMode="numeric"
            maxLength={12}
            placeholder={fx.aadhaarPlaceholder}
          />

          <SectionTitle>{t.sections.msme}</SectionTitle>
          <div>
            <span className="label">{fx.msmeQuestion}</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[
                { v: false, label: fx.msmeNo },
                { v: true, label: fx.msmeYes },
              ].map((o) => (
                <button
                  type="button"
                  key={String(o.v)}
                  onClick={() => setIsMsme(o.v)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    isMsme === o.v ? "border-gov-navy bg-gov-navy text-white" : "border-line bg-white text-ink-soft hover:bg-canvas",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {isMsme && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={fx.udyam} name="udyamNo" required={isMsme} placeholder="UDYAM-KA-03-0000000" style={{ textTransform: "uppercase" }} />
              <Field label={fx.msmeClass} name="msmeClass">
                <select id="msmeClass" name="msmeClass" required={isMsme} className="field mt-1.5" defaultValue="">
                  <option value="" disabled>{fx.select}</option>
                  <option value="Micro">Micro</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                </select>
              </Field>
            </div>
          )}

          <SectionTitle>{t.sections.financials}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fx.turnover} name="turnoverCr" required type="number" step="0.01" min="0" placeholder="e.g. 42.60" />
            <Field label={fx.caUdin} name="caUdin" hint={fx.optional} placeholder="e.g. 24541576MXGKYM5021" style={{ textTransform: "uppercase" }} />
          </div>
          <Field label={fx.mii} name="miiPct" required type="number" min="0" max="100" placeholder="0 – 100" />

          <SectionTitle>{t.sections.director}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fx.directorName} name="directorName" required placeholder={fx.directorNamePlaceholder} />
            <Field label={fx.directorDin} name="directorDin" required inputMode="numeric" maxLength={8} placeholder={fx.dinPlaceholder} />
          </div>

          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-[12px] leading-relaxed text-brand-800">
            {t.mpinNotice}
          </p>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">{error}</p>
      )}

      <SubmitButton role={role} />

      <p className="text-center text-[11px] leading-relaxed text-ink-muted">{t.terms}</p>
    </form>
  );
}
