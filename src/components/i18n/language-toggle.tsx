"use client";

import { Globe } from "lucide-react";
import { locales, localeLabel } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * English / हिन्दी switch. `variant="bar"` matches the dark government utility
 * bar; `variant="pill"` is a standalone control for the auth screens.
 */
export function LanguageToggle({
  variant = "bar",
  className,
}: {
  variant?: "bar" | "pill";
  className?: string;
}) {
  const { locale, setLocale } = useI18n();

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-line bg-white px-1 py-0.5 text-xs",
          className,
        )}
      >
        <Globe className="ml-1 h-3.5 w-3.5 text-ink-muted" aria-hidden />
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => l !== locale && setLocale(l)}
            aria-pressed={l === locale}
            className={cn(
              "rounded-full px-2 py-1 font-medium transition-colors",
              l === locale ? "bg-gov-navy text-white" : "text-ink-soft hover:bg-canvas",
            )}
          >
            {localeLabel[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Language">
      <Globe className="mr-0.5 h-3.5 w-3.5 text-white/70" aria-hidden />
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-white/40">/</span>}
          <button
            type="button"
            onClick={() => l !== locale && setLocale(l)}
            aria-pressed={l === locale}
            className={cn("rounded px-1 hover:bg-white/10", l === locale && "font-bold text-gov-saffron")}
          >
            {localeLabel[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
