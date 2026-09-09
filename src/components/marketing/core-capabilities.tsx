import { BadgeCheck, Fingerprint, MousePointerClick, QrCode, ScanSearch, Workflow } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

const xFactors = [
  {
    icon: ScanSearch,
    title: "Multimodal AI parsing",
    body: "High-accuracy extraction from degraded scans and non-standard certificate layouts — not just clean, digital PDFs.",
  },
  {
    icon: BadgeCheck,
    title: "Dynamic exemption router",
    body: "Automatically waives EMD and prior-turnover requirements for verified MSMEs and DPIIT-recognised Startups.",
  },
  {
    icon: Fingerprint,
    title: "Forensic tamper detection",
    body: "Error-Level-Analysis heatmaps highlight digitally altered figures on balance sheets and turnover certificates.",
  },
  {
    icon: Workflow,
    title: "Cartel / collusion graph",
    body: "Flags supposedly competing bidders that share a Director Identification Number, registered address or bank account.",
  },
  {
    icon: MousePointerClick,
    title: "Click-to-source evidence",
    body: "Every flag links to the exact highlighted line on the original document — audit-ready, never a black box.",
  },
  {
    icon: QrCode,
    title: "QR integrity cross-check",
    body: "Decodes the embedded QR payload on GST and Udyam certificates and compares it against the printed text.",
  },
];

function IconIntegration() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
      <g fill="none" stroke="#16235a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="18" cy="18" rx="11" ry="4.5" />
        <path d="M7 18v10c0 2.5 4.9 4.5 11 4.5s11-2 11-4.5V18" />
        <path d="M29 23h9m0 0-4-4m4 4-4 4" stroke="#e2760c" />
        <rect x="40" y="12" width="18" height="13" rx="2.5" />
        <circle cx="45" cy="18.5" r="2.2" />
        <path d="M50 16h5M50 21h5" />
        <path d="M29 44h9m0 0-4-4m4 4-4 4" stroke="#e2760c" />
        <rect x="40" y="38" width="18" height="13" rx="2.5" />
        <circle cx="45" cy="44.5" r="2.2" />
        <path d="M50 42h5M50 47h5" />
      </g>
    </svg>
  );
}

function IconForensics() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
      <g fill="none" stroke="#16235a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="10" width="30" height="38" rx="3" />
        <rect x="22" y="6" width="30" height="38" rx="3" fill="#fff" />
        <path d="M28 16h18M28 23h18M28 30h12" />
        <rect x="30" y="34" width="7" height="6" rx="1" fill="#e2760c" stroke="none" />
        <rect x="39" y="32" width="6" height="8" rx="1" fill="#f5c518" stroke="none" />
        <circle cx="40" cy="42" r="12" stroke="#e2760c" />
        <line x1="49" y1="51" x2="58" y2="60" stroke="#e2760c" strokeWidth="4" />
      </g>
    </svg>
  );
}

function IconScoring() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
      <g fill="none" strokeWidth="3.2" strokeLinecap="round">
        <path d="M10 40a22 22 0 0 1 44 0" stroke="#e6e9f0" />
        <path d="M10 40a22 22 0 0 1 6.4-15.6" stroke="#e23b3b" />
        <path d="M16.4 24.4A22 22 0 0 1 32 18" stroke="#f5c518" />
        <path d="M32 18a22 22 0 0 1 22 22" stroke="#2fa84f" />
      </g>
      <line x1="32" y1="40" x2="42" y2="27" stroke="#16235a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="40" r="3.4" fill="#16235a" />
      <g fill="#16235a">
        <rect x="18" y="46" width="5" height="10" rx="1" />
        <rect x="27" y="42" width="5" height="14" rx="1" />
        <rect x="36" y="38" width="5" height="18" rx="1" />
      </g>
    </svg>
  );
}

const items = [
  {
    icon: IconIntegration,
    title: "Multi-Portal Integration",
    body: "Automated cross-checking of Udyam, GSTN, PAN, and EPFO / ESIC registrations.",
  },
  {
    icon: IconForensics,
    title: "AI Document Forensics",
    body: "Advanced extraction, automated identification of missing or inconsistent information, and image tampering detection.",
  },
  {
    icon: IconScoring,
    title: "Risk & Compliance Scoring",
    body: "Generating comprehensive compliance scores, bidder risk classification, and AI-driven recommendations.",
  },
];

export function CoreCapabilities() {
  return (
    <section id="features" className="bg-white py-16 sm:py-20">
      <div className="section">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-orange">Core capabilities</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gov-navy sm:text-3xl">
            Detection that goes beyond an &ldquo;active / inactive&rdquo; status check
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            A registration can read &ldquo;active&rdquo; and the bid still be non-compliant, forged or collusive.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-slate-200">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.08} className="px-2 text-center md:px-8">
              <it.icon />
              <h3 className="mt-4 text-lg font-bold text-gov-navy">{it.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{it.body}</p>
            </Reveal>
          ))}
        </div>

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {xFactors.map((x) => (
            <StaggerItem
              key={x.title}
              className="rounded-xl border border-slate-200 bg-canvas p-5 transition-shadow hover:shadow-card"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gov-navy/5 text-gov-navy">
                <x.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3.5 text-[15px] font-bold text-gov-navy">{x.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{x.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
