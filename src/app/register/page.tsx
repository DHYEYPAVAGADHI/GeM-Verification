import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <AuthShell>
      <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Create your account</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-gov-orange hover:underline">
          Sign in
        </Link>
      </p>

      <RegisterForm callbackUrl={searchParams.callbackUrl} />

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/" className="font-semibold text-gov-orange">
          ← Back to the website
        </Link>
      </p>
    </AuthShell>
  );
}
