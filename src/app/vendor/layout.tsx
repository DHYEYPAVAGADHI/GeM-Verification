import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { VendorNav } from "@/components/vendor/vendor-nav";

export const metadata: Metadata = {
  title: { default: "Bidder Portal", template: "%s · GeM Verify" },
};

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/vendor");
  if (session.user.role !== "VENDOR" || !session.user.vendorId) redirect("/dashboard");

  const profile = await db.vendorProfile.findUnique({
    where: { id: session.user.vendorId },
    select: { orgName: true },
  });

  return (
    <div className="min-h-screen bg-canvas">
      <VendorNav org={profile?.orgName ?? "Vendor"} />
      <main className="section py-8">{children}</main>
    </div>
  );
}
