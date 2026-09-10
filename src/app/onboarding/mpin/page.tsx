import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AuthShell } from "@/components/auth/auth-shell";
import { MpinReveal } from "@/components/vendor/mpin-reveal";
import { getDict } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Save your MPIN" };

export default async function MpinOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/onboarding/mpin");
  if (session.user.role !== "VENDOR" || !session.user.vendorId) redirect("/dashboard");

  const profile = await db.vendorProfile.findUnique({
    where: { id: session.user.vendorId },
    select: { orgName: true, mpin: true, mpinAckAt: true, registryBidderId: true },
  });
  if (!profile?.mpin) redirect("/vendor");
  if (profile.mpinAckAt) redirect("/vendor");

  const { dict } = getDict();
  const t = dict.mpin;

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold tracking-tight text-gov-navy">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {profile.orgName} {t.intro}
        {profile.registryBidderId ? ` ${t.introAs} ${profile.registryBidderId}` : ""}. {t.introTail}
      </p>
      <MpinReveal mpin={profile.mpin} />
    </AuthShell>
  );
}
