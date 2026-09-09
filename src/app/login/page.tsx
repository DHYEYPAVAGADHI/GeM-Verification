import type { Metadata } from "next";
import Link from "next/link";
import { googleEnabled } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const demoAccounts = [
  { role: "Procurement Officer", email: "officer@gem.gov.in", goes: "Verification console" },
  { role: "Vendor — Apollo Technologies", email: "apollo@apollotech.in", goes: "Bidder portal" },
  { role: "Vendor — Greenfield Traders", email: "sales@greenfieldtraders.co.in", goes: "Bidder portal" },
];

export default function LoginPage({
  searchParams,
}: {
  // `redirect` is used by the public /tenders "Participate" intercept;
  // `callbackUrl` is the Auth.js default — support both.
  searchParams: { redirect?: string; callbackUrl?: string };
}) {
  const dest = searchParams.redirect ?? searchParams.callbackUrl;
  const isApplyRedirect = !!dest && dest.startsWith("/vendor/tenders/");

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Sign in</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your credentials to continue. New to the platform?{" "}
        <Link href="/register" className="font-semibold text-gov-orange hover:underline">
          Create an account
        </Link>
      </p>

      {isApplyRedirect && (
        <p className="mt-4 rounded-lg border border-gov-navy/10 bg-blue-50 px-3 py-2 text-sm font-medium text-gov-navy">
          Sign in to participate in this bid. We&rsquo;ll take you straight to its upload screen.
        </p>
      )}

      <LoginForm callbackUrl={dest} googleEnabled={googleEnabled} />

      <div className="mt-8">
        <p className="eyebrow">Demo accounts · password Demo@12345</p>
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
          ← Back to the website
        </Link>
      </p>
    </AuthShell>
  );
}
