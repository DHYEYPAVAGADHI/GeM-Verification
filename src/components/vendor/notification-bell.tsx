"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { markNotificationsRead } from "@/lib/actions";

export type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = () => startTransition(() => void markNotificationsRead());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-canvas"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk-high px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[340px] overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[380px] divide-y divide-line overflow-y-auto scroll-thin">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">You&rsquo;re all caught up.</li>
            )}
            {items.map((n) => {
              const body = (
                <div className={cn("flex gap-3 px-4 py-3", !n.readAt && "bg-brand-50/50")}>
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.kind === "BID_DISQUALIFIED"
                        ? "bg-risk-high"
                        : n.kind === "BID_QUALIFIED"
                          ? "bg-risk-low"
                          : "bg-brand-400",
                      n.readAt && "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 line-clamp-3 text-xs text-ink-muted">{n.body}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setOpen(false)} className="block hover:bg-canvas">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
