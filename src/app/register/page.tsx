import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { getDict } from "@/lib/i18n/server";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const { dict } = getDict();

  return (
    <AuthShell wide>
      <h2 className="text-2xl font-bold tracking-tight text-gov-navy">{dict.register.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {dict.register.already}{" "}
        <Link href="/login" className="font-semibold text-gov-orange hover:underline">
          {dict.common.signIn}
        </Link>
      </p>

      <RegisterForm callbackUrl={searchParams.callbackUrl} />

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/" className="font-semibold text-gov-orange">
          ← {dict.common.backToWebsite}
        </Link>
      </p>
    </AuthShell>
  );
}
