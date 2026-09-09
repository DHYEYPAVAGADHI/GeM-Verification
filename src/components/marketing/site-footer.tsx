import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Emblem } from "@/components/ui/logo";

const columns = [
  {
    id: undefined as string | undefined,
    title: "About GeM",
    links: [
      "Platform Vision & Mission",
      "AI Bid Compliance Overview",
      "Problem Statement 26100 (SIH 2026)",
      "Newsroom & Press Releases",
      "Careers with GeM",
      "Contact the Programme Office",
    ],
  },
  {
    id: "policies",
    title: "Policies",
    links: [
      "Privacy Policy",
      "Terms of Use",
      "Make-in-India (MII) Order 2017",
      "Public Procurement (MSE) Order 2012",
      "General Financial Rules (GFR) 2017",
      "GIGW 3.0 Accessibility Statement",
    ],
  },
  {
    id: "helpdesk",
    title: "Help & Training",
    links: [
      "Raise a Support Ticket",
      "Procurement Officer Training",
      "Vendor Onboarding Guide",
      "Video Tutorials & Webinars",
      "Frequently Asked Questions",
      "Downloads & User Manuals",
    ],
  },
  {
    id: undefined,
    title: "Important Links",
    links: [
      "Startup India",
      "Digital India",
      "Make in India",
      "Udyam Registration",
      "GST Portal",
      "MCA21 Portal",
      "Central Public Procurement Portal",
    ],
  },
];

function NicMark() {
  return (
    <span className="flex items-center gap-2 text-white/80">
      <span className="rounded bg-white px-1.5 py-0.5 text-[13px] font-extrabold tracking-tight text-gov-navy-deep">
        NIC
      </span>
      <span className="hidden text-[11px] leading-tight sm:block">
        राष्ट्रीय सूचना विज्ञान केंद्र
        <br />
        National Informatics Centre
      </span>
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-gov-navy-deep text-white">
      {/* Contact strip */}
      <div className="border-b border-white/10">
        <div className="section grid gap-4 py-6 text-sm sm:grid-cols-3">
          <span className="flex items-start gap-2.5 text-white/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gov-saffron" />
            Government e-Marketplace, Jeevan Tara Building, Sansad Marg, New Delhi – 110001
          </span>
          <a href="tel:18004193436" className="flex items-center gap-2.5 text-white/80 hover:text-white">
            <Phone className="h-4 w-4 shrink-0 text-gov-saffron" /> Toll-Free 1800-419-3436
          </a>
          <a href="mailto:helpdesk@gem.gov.in" className="flex items-center gap-2.5 text-white/80 hover:text-white">
            <Mail className="h-4 w-4 shrink-0 text-gov-saffron" /> helpdesk-bidverify@gem.gov.in
          </a>
        </div>
      </div>

      {/* Fat 4-column body */}
      <div className="section grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <Emblem className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-tight text-white">GeM Verify</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-white/65">
            An AI-powered integrated bid compliance verification platform accelerating technical
            evaluation while enforcing zero tolerance for document forgery — decision support for the
            Procurement Officer, never a black box.
          </p>
          <div className="mt-4 h-1 w-24 rounded bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
        </div>

        {columns.map((col) => (
          <nav key={col.title} id={col.id} aria-label={col.title} className="scroll-mt-24">
            <h2 className="text-sm font-bold uppercase tracking-wide text-white">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="text-[13px] leading-snug text-white/65 transition-colors hover:text-gov-saffron"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="section flex flex-col items-center justify-between gap-3 py-4 text-center text-xs text-white/70 sm:flex-row sm:text-left">
          <p>
            © 2026 Government e-Marketplace. Designed for Smart India Hackathon (SIH 2026) by Team{" "}
            <span className="font-semibold text-white/90">HACK-ATHLETE</span>. Compliant with GIGW 3.0.
          </p>
          <NicMark />
        </div>
      </div>

      <div className="h-1.5 w-full bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
    </footer>
  );
}
