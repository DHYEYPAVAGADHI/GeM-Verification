"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/ui/user-menu";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/vendor" },
  { label: "Tenders", href: "/vendor/tenders" },
  { label: "My Bids", href: "/vendor/bids" },
  { label: "Company Profile", href: "/vendor/profile" },
  { label: "Document Vault", href: "/vendor/vault" },
];

export function VendorNav({ org }: { org: string }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="h-1 w-full bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
      <div className="section flex h-16 items-center gap-6">
        <Logo href="/vendor" />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active(n.href) ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-canvas",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <UserMenu name={org} sub="Bidder portal" initials={initials(org)} />
        </div>
      </div>
      <nav className="section flex gap-1 overflow-x-auto scroll-thin border-t border-line py-2 md:hidden">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium",
              active(n.href) ? "bg-brand-50 text-brand-700" : "text-ink-soft",
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
