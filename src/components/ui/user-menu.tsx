"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function UserMenu({
  name,
  sub,
  initials,
}: {
  name: string;
  sub: string;
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-canvas"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold text-ink">{name}</span>
          <span className="block text-[11px] text-ink-muted">{sub}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-ink-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-48 animate-fade-up rounded-xl border border-line bg-white p-1 shadow-pop">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-canvas"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
