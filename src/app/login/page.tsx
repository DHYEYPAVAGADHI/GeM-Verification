import type { Metadata } from "next";
import Link from "next/link";
import { googleEnabled } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { getDict } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  // `redirect` is used by the public /tenders "Participate" intercept;
  // `callbackUrl` is the Auth.js default — support both.
  searchParams: { redirect?: string; callbackUrl?: string };
}) {
  const dest = searchParams.redirect ?? searchParams.callbackUrl;
  const isApplyRedirect = !!dest && dest.startsWith("/vendor/tenders/");
  const { dict } = getDict();
  const t = dict.login;

  const demoAccounts = [
    { role: t.roles.officer, email: "officer@gem.gov.in", goes: t.goes.console },
    { role: t.roles.apollo, email: "apollo@apollotech.in", goes: t.goes.portal },
    { role: t.roles.greenfield, email: "sales@greenfieldtraders.co.in", goes: t.goes.portal },
  ];

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold tracking-tight text-gov-navy">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {t.subtitle}{" "}
        <Link href="/register" className="font-semibold text-gov-orange hover:underline">
          {dict.common.createAccount}
        </Link>
      </p>

      {isApplyRedirect && (
        <p className="mt-4 rounded-lg border border-gov-navy/10 bg-blue-50 px-3 py-2 text-sm font-medium text-gov-navy">
          {t.applyNotice}
        </p>
      )}

      <LoginForm callbackUrl={dest} googleEnabled={googleEnabled} />

      <div className="mt-8">
        <p className="eyebrow">{t.demoAccounts}</p>
        <div className="mt-2 space-y-2">
          {demoAccounts.map((a) => (
            <div
              key={a.email}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-xs"
            >
              <span>
                <span className="block font-semibold text-ink">{a.role}</span>
                <span className="data block text-ink-muted">{a.email}</span>
              </span>
              <span className="text-ink-muted">{a.goes}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/" className="font-semibold text-gov-orange">
          ← {dict.common.backToWebsite}
        </Link>
      </p>
    </AuthShell>
  );
}
