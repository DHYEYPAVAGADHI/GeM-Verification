"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { navSections } from "./sidebar-nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto scroll-thin px-3 py-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink-soft hover:bg-slate-50 hover:text-ink",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          active ? "text-brand-600" : "text-slate-400",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          All systems operational
        </p>
        <p className="mt-1 text-[11px] text-ink-muted">Last updated 25 Aug 2026, 19:42</p>
      </div>
    </div>
  );
}
