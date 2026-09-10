"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { googleSignInAction, loginAction } from "@/lib/actions";
import { useI18n } from "@/lib/i18n/provider";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { dict } = useI18n();
  return (
    <button type="submit" className="btn w-full rounded-md bg-gov-orange text-white hover:bg-gov-orange-dark" disabled={pending}>
      {pending ? dict.login.signingIn : dict.common.signIn}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  const { dict } = useI18n();
  return (
    <button type="submit" className="btn-ghost w-full" disabled={pending}>
      <GoogleGlyph />
      {pending ? dict.login.connecting : dict.login.continueGoogle}
    </button>
  );
}

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled?: boolean;
}) {
  const [error, formAction] = useFormState(loginAction, undefined);
  const { dict } = useI18n();

  return (
    <div className="mt-6 space-y-4">
      {googleEnabled && (
        <>
          <form action={googleSignInAction}>
            <GoogleButton />
          </form>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            {dict.login.orWithEmail}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={callbackUrl || "/dashboard"} />
        <div>
          <label className="label" htmlFor="email">
            {dict.login.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue="officer@gem.gov.in"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            {dict.login.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue="Demo@12345"
            className="field mt-1.5"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-risk-high-bg px-3 py-2 text-sm font-medium text-risk-high">{error}</p>
        )}
        <SubmitButton />
      </form>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 3-2.26 5.53-4.78 7.24l7.73 6c4.51-4.18 7.09-10.36 7.09-17.71z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
