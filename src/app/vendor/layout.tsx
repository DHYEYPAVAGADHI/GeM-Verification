import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getNotifications } from "@/lib/queries";
import { VendorNav } from "@/components/vendor/vendor-nav";

export const metadata: Metadata = {
  title: { default: "Bidder Portal", template: "%s · GeM Verify" },
};

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/vendor");
  if (session.user.role !== "VENDOR" || !session.user.vendorId) redirect("/dashboard");

  const [profile, notifs] = await Promise.all([
    db.vendorProfile.findUnique({
      where: { id: session.user.vendorId },
      select: { orgName: true, mpin: true, mpinAckAt: true },
    }),
    getNotifications(session.user.id, 15),
  ]);

  // A vendor who has an MPIN but hasn't confirmed they saved it is held at the
  // one-time reveal screen before they can use the portal.
  if (profile?.mpin && !profile.mpinAckAt) redirect("/onboarding/mpin");

  return (
    <div className="min-h-screen bg-canvas">
      <VendorNav
        org={profile?.orgName ?? "Vendor"}
        unread={notifs.unread}
        notifications={notifs.items.map((n) => ({
          id: n.id,
          kind: n.kind,
          title: n.title,
          body: n.body,
          href: n.href,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
      <main className="section py-8">{children}</main>
    </div>
  );
}
