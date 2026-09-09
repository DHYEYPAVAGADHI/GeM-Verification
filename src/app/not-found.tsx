import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        404
      </p>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        This page could not be found
      </h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The bidder, tender or module you are looking for does not exist in this
        prototype.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-ghost">
          Home
        </Link>
        <Link href="/dashboard" className="btn-primary">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
