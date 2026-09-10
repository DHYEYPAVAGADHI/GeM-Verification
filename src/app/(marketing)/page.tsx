import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Eye,
  FileScan,
  MousePointerClick,
  Network,
  Route,
  ScanEye,
  ShieldAlert,
  Store,
} from "lucide-react";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { LiveStats } from "@/components/marketing/live-stats";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { getDict } from "@/lib/i18n/server";

const portalMeta = [
  { key: "officer" as const, icon: Building2, href: "/login", accent: "bg-gov-navy" },
  { key: "vendor" as const, icon: Store, href: "/register", accent: "bg-gov-orange" },
  { key: "vigilance" as const, icon: ShieldAlert, href: "/login", accent: "bg-gov-green" },
];

const capabilityIcons = [ScanEye, Network, FileScan, Route, Building2, MousePointerClick];

export default function MarketingHome() {
  const { dict } = getDict();
  const t = dict;

  return (
    <>
      <HeroCarousel />

      <LiveStats />

      {/* Stakeholder portals */}
      <section id="portals" className="bg-white py-16 sm:py-20">
        <div className="section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange">{t.portals.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gov-navy sm:text-3xl">{t.portals.heading}</h2>
            <p className="mt-3 text-sm text-ink-muted">{t.portals.sub}</p>
          </Reveal>

          <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
            {portalMeta.map((p) => {
              const copy = t.portals[p.key];
              return (
                <StaggerItem
                  key={p.key}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-card"
                >
                  <div className={`h-1.5 rounded-t-xl ${p.accent}`} />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-white ${p.accent}`}>
                        <p.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-gov-navy">{copy.audience}</h3>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{copy.role}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-ink-soft">{copy.body}</p>
                    <ul className="mt-4 space-y-2">
                      {copy.points.map((pt) => (
                        <li key={pt} className="flex gap-2.5 text-[13px] text-ink-muted">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gov-orange" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={p.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gov-orange hover:text-gov-orange-dark"
                    >
                      {copy.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* AI verification capabilities */}
      <section id="capabilities" className="border-y border-slate-200 bg-gov-wash py-16 sm:py-20">
        <div className="section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange">{t.capabilities.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gov-navy sm:text-3xl">{t.capabilities.heading}</h2>
            <p className="mt-3 text-sm text-ink-muted">{t.capabilities.sub}</p>
          </Reveal>

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.capabilities.items.map((c, i) => {
              const Icon = capabilityIcons[i] ?? ScanEye;
              return (
                <StaggerItem
                  key={c.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gov-navy/5 text-gov-navy">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-2xl font-extrabold text-gov-navy/10">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-bold text-gov-navy">{c.title}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-gov-orange">{c.meta}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.body}</p>
                </StaggerItem>
              );
            })}
          </Stagger>

          <Reveal className="mt-8 flex items-center gap-3 rounded-lg border border-gov-navy/10 bg-white px-4 py-3">
            <Eye className="h-5 w-5 shrink-0 text-gov-navy" />
            <p className="text-sm font-medium text-gov-navy">{t.capabilities.footNote}</p>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gov-navy py-16">
        <Reveal className="section flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.finalCta.heading}</h2>
          <p className="max-w-xl text-sm text-white/75">{t.finalCta.sub}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn rounded-md bg-gov-orange px-7 py-3 text-white hover:bg-gov-orange-dark">
              {t.finalCta.primary} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="btn rounded-md border border-white/25 bg-transparent px-7 py-3 text-white hover:bg-white/10"
            >
              {t.finalCta.secondary}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
