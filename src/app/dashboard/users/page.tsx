import type { Metadata } from "next";
import { ShieldCheck, Building2, KeyRound } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Pill } from "@/components/ui/pill";
import { getUserDirectory } from "@/lib/queries";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "User Management" };

const roleTone: Record<string, string> = {
  OFFICER: "bg-brand-50 text-brand-700",
  ADMIN: "bg-gov-navy/10 text-gov-navy",
  VENDOR: "bg-canvas text-ink-soft",
};

export default async function UsersPage() {
  const { users, counts, total } = await getUserDirectory();

  return (
    <div className="space-y-6">
      <PageHeading title="User Management" subtitle="Every account with access to the platform" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Procurement officers" value={counts.OFFICER + counts.ADMIN} sub={`${counts.ADMIN} admin`} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="Registered vendors" value={counts.VENDOR} sub="bidder accounts" />
        <Stat icon={<KeyRound className="h-4 w-4" />} label="Total accounts" value={total} sub="across all roles" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Linked entity</th>
                <th className="px-3 py-3 font-semibold">MPIN</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-canvas/50">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600">
                        {initials(u.name)}
                      </span>
                      <span className="font-semibold text-ink">{u.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 data text-xs text-ink-soft">{u.email}</td>
                  <td className="px-3 py-3.5">
                    <Pill tone={roleTone[u.role]}>{u.role}</Pill>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-ink-muted">
                    {u.vendor ? (
                      <>
                        <span className="block text-ink-soft">{u.vendor.orgName}</span>
                        <span className="data block">{u.vendor.registryBidderId ?? u.vendor.pan}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-xs">
                    {u.role !== "VENDOR" ? (
                      <span className="text-ink-muted">n/a</span>
                    ) : u.vendor?.mpinAckAt ? (
                      <span className="text-risk-low">Active</span>
                    ) : u.vendor?.mpin ? (
                      <span className="text-risk-review">Not acknowledged</span>
                    ) : (
                      <span className="text-ink-muted">Not issued</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-muted">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="card card-pad">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {icon} {label}
      </span>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}
