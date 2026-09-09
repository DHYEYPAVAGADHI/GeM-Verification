import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: { default: "Verification Console", template: "%s · GeM Verify Console" },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  if (session.user.role === "VENDOR") redirect("/vendor");

  return (
    <DashboardShell
      user={{ name: session.user.name ?? "Officer", role: session.user.role }}
    >
      {children}
    </DashboardShell>
  );
}
