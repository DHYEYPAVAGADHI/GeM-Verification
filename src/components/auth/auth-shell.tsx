import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { I18nProvider } from "@/lib/i18n/provider";
import { getDict } from "@/lib/i18n/server";

export function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const { locale, dict } = getDict();

  return (
    <I18nProvider locale={locale}>
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gov-navy p-12 text-white lg:flex">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
          <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
          <Logo href="/" onLight={false} />
          <div className="relative">
            <h1 className="text-3xl font-bold leading-tight">{dict.authShell.heading}</h1>
            <p className="mt-4 max-w-md text-sm text-white/80">{dict.authShell.blurb}</p>
          </div>
          <p className="relative flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4" /> {dict.authShell.prototype}
          </p>
        </div>

        <div
          className={
            "relative flex justify-center p-6 sm:p-12 " +
            (wide ? "items-start lg:max-h-screen lg:overflow-y-auto" : "items-center")
          }
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-gov-saffron via-white to-gov-green lg:hidden" />
          <div className="absolute right-4 top-4 z-10">
            <LanguageToggle variant="pill" />
          </div>
          <div className={wide ? "w-full max-w-xl py-4" : "w-full max-w-md"}>
            <div className="mb-8 lg:hidden">
              <Logo href="/" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </I18nProvider>
  );
}
