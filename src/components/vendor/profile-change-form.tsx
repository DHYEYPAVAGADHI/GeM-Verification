"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Clock, Pencil, ShieldQuestion, XCircle } from "lucide-react";
import { submitProfileChangeRequest } from "@/lib/actions";
import { cn } from "@/lib/utils";

export type PendingChange = {
  id: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  note: string | null;
  createdAt: string;
};

export type ReviewedChange = {
  id: string;
  status: "APPROVED" | "REJECTED";
  reviewNote: string | null;
  reviewedAt: string | null;
};

type FieldDef = { name: string; label: string; type?: "number" | "text" };

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Entity",
    fields: [
      { name: "orgName", label: "Legal name" },
      { name: "constitution", label: "Constitution" },
      { name: "cin", label: "CIN" },
      { name: "registeredAddress", label: "Registered address" },
      { name: "worksAddress", label: "Works address" },
    ],
  },
  {
    title: "Statutory registrations",
    fields: [
      { name: "pan", label: "PAN" },
      { name: "gstin", label: "GSTIN" },
      { name: "udyamNo", label: "Udyam number" },
      { name: "startupDpiit", label: "DPIIT Startup recognition no." },
      { name: "epfoCode", label: "EPFO code" },
    ],
  },
  {
    title: "Financials (₹, in crore)",
    fields: [
      { name: "turnoverY1", label: "Turnover FY 2022-23", type: "number" },
      { name: "turnoverY2", label: "Turnover FY 2023-24", type: "number" },
      { name: "turnoverY3", label: "Turnover FY 2024-25", type: "number" },
      { name: "netWorth", label: "Net worth", type: "number" },
    ],
  },
  {
    title: "Banking & workforce",
    fields: [
      { name: "bankAccount", label: "Bank account" },
      { name: "bankIfsc", label: "IFSC" },
      { name: "employees", label: "Employees (declared)", type: "number" },
      { name: "sector", label: "Sector" },
      { name: "state", label: "State" },
    ],
  },
];

const ALL_LABELS: Record<string, string> = Object.fromEntries(
  SECTIONS.flatMap((s) => s.fields.map((f) => [f.name, f.label])),
);

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Submitting…" : "Submit for admin approval"}
    </button>
  );
}

export function ProfileChangeForm({
  profile,
  pending,
  lastReviewed,
}: {
  profile: Record<string, string | number | null>;
  pending: PendingChange | null;
  lastReviewed: ReviewedChange | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, formAction] = useFormState(submitProfileChangeRequest, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [dismissedReview, setDismissedReview] = useState(false);

  // Close the edit form once the request lands (no error, and it just went pending).
  useEffect(() => {
    if (!error && pending) setOpen(false);
  }, [pending, error]);

  return (
    <div className="space-y-4">
      {pending && (
        <div className="card card-pad border-l-4 border-l-risk-review bg-risk-review-bg/40">
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-risk-review" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">Change request awaiting admin approval</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Submitted {new Date(pending.createdAt).toLocaleString("en-IN")}
                {pending.note ? ` · "${pending.note}"` : ""} — the profile shown above still reflects your
                last approved details until an officer reviews this.
              </p>
              <ul className="mt-3 space-y-1.5">
                {Object.entries(pending.changes).map(([field, diff]) => (
                  <li key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-ink">{ALL_LABELS[field] ?? field}:</span>
                    <span className="text-ink-muted line-through">{String(diff.from ?? "—")}</span>
                    <span className="text-ink-muted">→</span>
                    <span className="font-medium text-risk-review">{String(diff.to ?? "—")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!pending && lastReviewed && !dismissedReview && (
        <div
          className={cn(
            "card card-pad flex items-start justify-between gap-3 border-l-4",
            lastReviewed.status === "APPROVED" ? "border-l-risk-low bg-risk-low-bg/40" : "border-l-risk-high bg-risk-high-bg/40",
          )}
        >
          <div className="flex items-start gap-2.5">
            {lastReviewed.status === "APPROVED" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-risk-low" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-risk-high" />
            )}
            <div>
              <p className="text-sm font-bold text-ink">
                {lastReviewed.status === "APPROVED" ? "Your last change request was approved" : "Your last change request was rejected"}
              </p>
              {lastReviewed.reviewNote && (
                <p className="mt-0.5 text-xs text-ink-muted">Officer note: &ldquo;{lastReviewed.reviewNote}&rdquo;</p>
              )}
            </div>
          </div>
          <button onClick={() => setDismissedReview(true)} className="shrink-0 text-xs font-semibold text-ink-muted hover:text-ink">
            Dismiss
          </button>
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          disabled={!!pending}
          className="btn-ghost"
          title={pending ? "You already have a request awaiting approval" : undefined}
        >
          <Pencil className="h-4 w-4" /> {pending ? "Edit disabled — request pending" : "Request a profile update"}
        </button>
      ) : (
        <form ref={formRef} action={formAction} className="card card-pad space-y-6">
          <div className="flex items-start gap-2.5 rounded-lg bg-canvas px-3 py-2.5 text-xs text-ink-muted">
            <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            Changes here don&rsquo;t apply immediately — they&rsquo;re sent to a Procurement Officer as a
            change request. Your profile updates only once it&rsquo;s approved.
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-ink">{section.title}</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.name}>
                    <label className="label" htmlFor={f.name}>
                      {f.label}
                    </label>
                    <input
                      id={f.name}
                      name={f.name}
                      type={f.type === "number" ? "number" : "text"}
                      step={f.type === "number" ? "any" : undefined}
                      defaultValue={profile[f.name] ?? ""}
                      className="field mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="label" htmlFor="note">
              Note to the reviewing officer (optional)
            </label>
            <textarea id="note" name="note" rows={2} className="field mt-1" placeholder="e.g. Bank account updated after a merger" />
          </div>

          {error && <p className="rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">{error}</p>}

          <div className="flex gap-2">
            <SubmitButton />
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
