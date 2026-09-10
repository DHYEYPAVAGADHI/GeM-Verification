import Link from "next/link";
import { ArrowRight, CircleAlert, FileWarning, Gauge, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { getNotifications, getOpenTenders, getVendorContext, profileReadiness } from "@/lib/queries";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { bidStatusMeta } from "@/lib/domain";
import { formatDate, inr, timeAgo } from "@/lib/utils";

export default async function VendorDashboard() {
  const session = await auth();
  const ctx = await getVendorContext(session!.user.vendorId!);
  if (!ctx) return null;
  const { profile, bids } = ctx;
  const readiness = profileReadiness(profile);
  const expiring = profile.documents.filter(
    (d) => d.expiryDate && d.expiryDate.getTime() - Date.now() < 45 * 864e5,
  );
  const openTenders = await getOpenTenders();
  const myTenderIds = new Set(bids.map((b) => b.tenderId));
  const { items: notifications } = await getNotifications(session!.user.id, 6);
  const alerts = notifications.filter((n) => !n.readAt);

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((n) => (
            <Link
              key={n.id}
              href={n.href ?? "/vendor/bids"}
              className={
                n.kind === "BID_DISQUALIFIED"
                  ? "flex items-start gap-3 rounded-xl border border-risk-high/30 bg-risk-high-bg/50 p-4 transition-colors hover:bg-risk-high-bg/80"
                  : "flex items-start gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:bg-canvas"
              }
            >
              <XCircle
                className={
                  n.kind === "BID_DISQUALIFIED"
                    ? "mt-0.5 h-5 w-5 shrink-0 text-risk-high"
                    : "mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                }
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-muted">{timeAgo(n.createdAt)}</p>
              </div>
              <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{profile.orgName}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {[profile.sector, profile.state, profile.constitution].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="card card-pad">
          <div className="flex items-center gap-4">
            <RiskGauge score={readiness} size={72} stroke={7} />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Gauge className="h-4 w-4 text-brand-600" /> Bid readiness
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {readiness >= 90 ? "Ready to bid" : "Complete your profile to bid faster"}
              </p>
              <Link href="/vendor/profile" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                Review profile <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <FileWarning className="h-4 w-4 text-risk-review" /> Documents to renew
          </p>
          {expiring.length === 0 ? (
            <p className="mt-2 text-xs text-ink-muted">Nothing expiring in the next 45 days.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-ink-soft">
              {expiring.map((d) => (
                <li key={d.id} className="flex justify-between">
                  <span>{d.fileName}</span>
                  <span className="text-risk-review">{formatDate(d.expiryDate!)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CircleAlert className="h-4 w-4 text-brand-600" /> Active bids
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{bids.filter((b) => b.status !== "WITHDRAWN").length}</p>
          <p className="text-xs text-ink-muted">
            {bids.filter((b) => b.status === "CLARIFICATION_REQUESTED").length} need your response
          </p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">My bids</h2>
          <Link href="/vendor/bids" className="text-sm font-semibold text-brand-600">
            View all
          </Link>
        </div>
        {bids.length === 0 ? (
          <Empty title="You haven't started any bids" hint="Browse open tenders below to begin." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bids.slice(0, 4).map((b) => (
              <Link key={b.id} href={`/vendor/bids/${b.id}`} className="card card-pad block transition-shadow hover:shadow-pop">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{b.tender.title}</p>
                    <p className="data text-xs text-ink-muted">{b.tender.refNo}</p>
                  </div>
                  <Pill tone={bidStatusMeta[b.status]?.tone}>{bidStatusMeta[b.status]?.label}</Pill>
                </div>
                {b.run && (
                  <p className="mt-3 text-xs text-ink-muted">
                    Compliance score <span className="font-bold text-ink">{b.run.score}/100</span> · {b.run.recommendation}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">Open tenders</h2>
        <div className="space-y-3">
          {openTenders.map((t) => (
            <div key={t.id} className="card card-pad flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="data text-xs text-ink-muted">{t.refNo}</span>
                  {myTenderIds.has(t.id) && <Pill tone="bg-brand-50 text-brand-700">Bid started</Pill>}
                </div>
                <p className="mt-0.5 font-semibold text-ink">{t.title}</p>
                <p className="text-xs text-ink-muted">
                  {t.buyer} · est. {inr(t.estValueCr)} · {t.criteria.length} criteria · closes {formatDate(t.closeDate)}
                </p>
              </div>
              <Link href={`/vendor/tenders/${t.id}`} className="btn-ghost">
                View & bid <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
