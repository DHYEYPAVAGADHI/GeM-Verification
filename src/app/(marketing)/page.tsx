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

const portals = [
  {
    icon: Building2,
    audience: "Procurement Officers",
    role: "Buyers",
    body: "Log in to ingest tenders, set eligibility rules, and view a bidder-by-bidder compliance matrix with click-to-source evidence.",
    points: ["Bulk tender & bid-packet ingestion", "Compliance score and risk ranking", "Record decisions with a hash-chained dossier"],
    cta: { label: "Procurement Officer Login", href: "/login" },
    accent: "bg-gov-navy",
  },
  {
    icon: Store,
    audience: "Bidders / Vendors",
    role: "Sellers",
    body: "Track evaluation status in real time and see automated MSE and DPIIT-Startup exemptions applied to your bid — no black-box rejections.",
    points: ["Live evaluation status tracker", "Automatic EMD & turnover exemptions", "Guided seven-step bid submission wizard"],
    cta: { label: "Register as a Vendor", href: "/register" },
    accent: "bg-gov-orange",
  },
  {
    icon: ShieldAlert,
    audience: "Vigilance / Audit",
    role: "Oversight",
    body: "Access the NetworkX Cartel Radar to surface bid-rigging syndicates — supposedly competing firms sharing a director, address or bank account.",
    points: ["Relational graph of bidder linkages", "Tamper-detection forensic queue", "Full audit trail and export"],
    cta: { label: "Open Vigilance Console", href: "/login" },
    accent: "bg-gov-green",
  },
];

const capabilities = [
  {
    icon: ScanEye,
    title: "Multimodal Vision Extraction",
    meta: "Claude 3.5 Sonnet",
    body: "High-accuracy structured extraction from degraded scans and non-standard certificate layouts — identifiers, dates, turnover and local-content figures.",
  },
  {
    icon: Network,
    title: "Network Relational Graphing",
    meta: "Cartel Check",
    body: "NetworkX graph engine flags collusion between bidders that share a Director Identification Number, registered address or bank account.",
  },
  {
    icon: FileScan,
    title: "Error Level Analysis",
    meta: "Image Forensics",
    body: "OpenCV-driven ELA heatmaps highlight digitally altered figures on balance sheets, turnover certificates and statutory seals.",
  },
  {
    icon: Route,
    title: "Dynamic Policy Routing",
    meta: "Make-in-India",
    body: "Automatically applies MII local-content thresholds, MSE Order 2012 relaxations and Startup exemptions to each bidder's rule set.",
  },
  {
    icon: Building2,
    title: "Sandbox API Integration",
    meta: "GSTIN / PAN",
    body: "Cross-verifies every identifier against the Udyam, GSTN, PAN, MCA21 and EPFO sandbox — contracts that mirror live KYC-aggregator APIs.",
  },
  {
    icon: MousePointerClick,
    title: "Zero Black-Box Auditing",
    meta: "Click-to-Source",
    body: "Every flag and score links to the exact highlighted line on the original document, so an officer can defend the evaluation on the record.",
  },
];

export default function MarketingHome() {
  return (
    <>
      <HeroCarousel />

      <LiveStats />

      {/* Stakeholder portals */}
      <section id="portals" className="bg-white py-16 sm:py-20">
        <div className="section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange">Stakeholder portals</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gov-navy sm:text-3xl">
              One platform, three points of entry
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              Buyers evaluate, sellers track, and vigilance teams investigate — each with a purpose-built console.
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
            {portals.map((p) => (
              <StaggerItem
                key={p.audience}
                className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-card"
              >
                <div className={`h-1.5 rounded-t-xl ${p.accent}`} />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-white ${p.accent}`}>
                      <p.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-gov-navy">{p.audience}</h3>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{p.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink-soft">{p.body}</p>
                  <ul className="mt-4 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-[13px] text-ink-muted">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gov-orange" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.cta.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gov-orange hover:text-gov-orange-dark"
                  >
                    {p.cta.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* AI verification capabilities */}
      <section id="capabilities" className="border-y border-slate-200 bg-gov-wash py-16 sm:py-20">
        <div className="section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange">AI verification capabilities</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gov-navy sm:text-3xl">
              Detection that goes far beyond an active / inactive status check
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              Six engines run on every bid packet — extraction, forensics, graph analysis, policy routing, source
              verification and a fully auditable trail.
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, i) => (
              <StaggerItem
                key={c.title}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gov-navy/5 text-gov-navy">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-extrabold text-gov-navy/10">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-gov-navy">{c.title}</h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-gov-orange">{c.meta}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.body}</p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="mt-8 flex items-center gap-3 rounded-lg border border-gov-navy/10 bg-white px-4 py-3">
            <Eye className="h-5 w-5 shrink-0 text-gov-navy" />
            <p className="text-sm font-medium text-gov-navy">
              The AI recommends. The Procurement Officer decides. Every override is recorded.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gov-navy py-16">
        <Reveal className="section flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            See a full bidder verification, end to end
          </h2>
          <p className="max-w-xl text-sm text-white/75">
            Sign in with a demo officer account to walk a tender through compliance scoring, forgery flags, the cartel
            graph, click-to-source evidence and the audit trail.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn rounded-md bg-gov-orange px-7 py-3 text-white hover:bg-gov-orange-dark">
              View AI Audit Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="btn rounded-md border border-white/25 bg-transparent px-7 py-3 text-white hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}

