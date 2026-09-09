import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";

export function ComingSoon({
  title,
  description,
  bullets = [],
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeading title={title} subtitle="Planned module" />
      <div className="card card-pad">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Hammer className="h-5 w-5" />
        </span>
        <p className="mt-4 max-w-2xl text-sm text-ink-soft">{description}</p>
        {bullets.length > 0 && (
          <ul className="mt-4 space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-ink-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {b}
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
