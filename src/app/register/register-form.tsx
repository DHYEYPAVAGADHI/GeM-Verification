"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { registerAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn w-full rounded-md bg-gov-orange text-white hover:bg-gov-orange-dark"
      disabled={pending}
    >
      {pending ? "Creating account…" : "Create account"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, formAction] = useFormState(registerAction, undefined);
  const [role, setRole] = useState<"VENDOR" | "OFFICER">("VENDOR");

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="redirectTo" value={callbackUrl ?? ""} />

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { v: "VENDOR", label: "Vendor / Bidder", icon: Building2 },
            { v: "OFFICER", label: "Procurement Officer", icon: ShieldCheck },
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

      <div>
        <label className="label" htmlFor="name">
          {role === "VENDOR" ? "Organisation name" : "Full name"}
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={role === "VENDOR" ? "e.g. Apollo Instruments Pvt Ltd" : "e.g. R. Menon"}
          className="field mt-1.5"
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          {role === "VENDOR" ? "Work email" : "Government email"}
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field mt-1.5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="field mt-1.5"
          />
        </div>
      </div>

      {role === "VENDOR" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pan">
              PAN <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <input
              id="pan"
              name="pan"
              placeholder="AAAAA0000A"
              maxLength={10}
              className="field mt-1.5 uppercase"
              style={{ textTransform: "uppercase" }}
            />
          </div>
          <div>
            <label className="label" htmlFor="gstin">
              GSTIN <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <input
              id="gstin"
              name="gstin"
              placeholder="27AAAAA0000A1Z5"
              maxLength={15}
              className="field mt-1.5"
              style={{ textTransform: "uppercase" }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">{error}</p>
      )}

      <SubmitButton />

      <p className="text-center text-[11px] leading-relaxed text-ink-muted">
        By creating an account you agree to the platform&rsquo;s Terms of Use and confirm the information
        provided is accurate. This is a prototype environment.
      </p>
    </form>
  );
}
