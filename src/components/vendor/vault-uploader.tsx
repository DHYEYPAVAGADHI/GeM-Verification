"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ShieldQuestion, UploadCloud } from "lucide-react";
import { uploadVaultDocument } from "@/lib/actions";
import { DOC_TYPE_LABEL } from "@/lib/domain";

const UPLOADABLE_TYPES = [
  "GST_CERT",
  "UDYAM_CERT",
  "PAN_CARD",
  "TURNOVER_CERT",
  "OEM_AUTH",
  "WORK_ORDER",
  "ISO_CERT",
  "EPFO_ECR",
  "MAKE_IN_INDIA",
  "EXPERIENCE",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary shrink-0">
      <UploadCloud className="h-4 w-4" /> {pending ? "Uploading…" : "Upload"}
    </button>
  );
}

/** Clears the file/type inputs once a submission finishes without an error. */
function ResetOnSuccess({ error, formRef }: { error: string | undefined; formRef: React.RefObject<HTMLFormElement> }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(pending);
  useEffect(() => {
    if (wasPending.current && !pending && !error) formRef.current?.reset();
    wasPending.current = pending;
  }, [pending, error, formRef]);
  return null;
}

export function VaultUploader() {
  const [error, formAction] = useFormState(uploadVaultDocument, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="card card-pad">
      <div className="flex items-start gap-2.5 rounded-lg bg-canvas px-3 py-2.5 text-xs text-ink-muted">
        <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Every upload here is queued for a Procurement Officer to approve before it counts as part of
        your official vendor file.
      </div>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <ResetOnSuccess error={error} formRef={formRef} />
        <div className="flex-1">
          <label className="label" htmlFor="docType">
            Document type
          </label>
          <select id="docType" name="docType" required className="field mt-1" defaultValue="">
            <option value="" disabled>
              Choose a type…
            </option>
            {UPLOADABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="file">
            PDF file
          </label>
          <input id="file" name="file" type="file" accept="application/pdf" required className="field mt-1" />
        </div>
        <SubmitButton />
      </form>

      {error && <p className="mt-3 rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">{error}</p>}
    </div>
  );
}
