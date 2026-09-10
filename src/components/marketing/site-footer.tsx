import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Emblem } from "@/components/ui/logo";
import { getDict } from "@/lib/i18n/server";

function NicMark({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 text-white/80">
      <span className="rounded bg-white px-1.5 py-0.5 text-[13px] font-extrabold tracking-tight text-gov-navy-deep">
        NIC
      </span>
      <span className="hidden text-[11px] leading-tight sm:block">{label}</span>
    </span>
  );
}

export function SiteFooter() {
  const { dict } = getDict();
  const f = dict.footer;
  const columns = [
    { id: undefined as string | undefined, ...f.columns.about },
    { id: "policies", ...f.columns.policies },
    { id: "helpdesk", ...f.columns.help },
    { id: undefined, ...f.columns.links },
  ];

  return (
    <footer className="mt-auto bg-gov-navy-deep text-white">
      {/* Contact strip */}
      <div className="border-b border-white/10">
        <div className="section grid gap-4 py-6 text-sm sm:grid-cols-3">
          <span className="flex items-start gap-2.5 text-white/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gov-saffron" />
            {f.address}
          </span>
          <a href="tel:18004193436" className="flex items-center gap-2.5 text-white/80 hover:text-white">
            <Phone className="h-4 w-4 shrink-0 text-gov-saffron" /> {f.tollFree}
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
          <p className="mt-3 text-[13px] leading-relaxed text-white/65">{f.blurb}</p>
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
          <p>{f.copyright}</p>
          <NicMark label={f.nic} />
        </div>
      </div>

      <div className="h-1.5 w-full bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
    </footer>
  );
}
