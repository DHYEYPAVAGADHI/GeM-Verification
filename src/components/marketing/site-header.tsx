"use client";

import Link from "next/link";
import { useState } from "react";
import { Accessibility, ChevronDown, Menu, Phone, Search, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { GigwTicker } from "@/components/marketing/gigw-ticker";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function setFontScale(scale: "s" | "m" | "l") {
  const el = document.documentElement;
  el.classList.remove("fs-s", "fs-l");
  if (scale === "s") el.classList.add("fs-s");
  if (scale === "l") el.classList.add("fs-l");
}

function TopUtilityBar() {
  const { dict } = useI18n();
  const [reader, setReader] = useState(false);

  return (
    <div className="bg-gov-navy-deep text-white">
      <div className="section flex h-9 items-center justify-between gap-3 text-[12px]">
        <a
          href="tel:18004193436"
          className="flex items-center gap-1.5 font-medium hover:text-gov-saffron"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden />
          {dict.header.tollFree}
        </a>

        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="hidden rounded px-1.5 py-0.5 hover:bg-white/10 focus:bg-white/15 sm:inline"
          >
            {dict.header.skipToContent}
          </a>
          <button
            type="button"
            role="switch"
            aria-checked={reader}
            onClick={() => setReader((v) => !v)}
            className="hidden items-center gap-1 rounded px-1.5 py-0.5 hover:bg-white/10 sm:flex"
          >
            <Accessibility className="h-3.5 w-3.5" aria-hidden />
            {dict.header.screenReader}
          </button>

          <span className="flex items-center gap-1" aria-label={dict.header.textSize}>
            <button
              onClick={() => setFontScale("s")}
              className="rounded px-1 hover:bg-white/10"
              aria-label="Decrease text size"
            >
              A<span className="align-sub text-[9px]">−</span>
            </button>
            <button
              onClick={() => setFontScale("m")}
              className="rounded px-1 hover:bg-white/10"
              aria-label="Default text size"
            >
              A
            </button>
            <button
              onClick={() => setFontScale("l")}
              className="rounded px-1 text-sm hover:bg-white/10"
              aria-label="Increase text size"
            >
              A<span className="align-super text-[9px]">+</span>
            </button>
          </span>

          <span className="h-3.5 w-px bg-white/25" aria-hidden />

          <LanguageToggle variant="bar" />
        </div>
      </div>
    </div>
  );
}

function SearchBar({ id }: { id: string }) {
  const { dict } = useI18n();
  const c = dict.header.categories;
  const categories = [c.all, c.bids, c.tenderDocs, c.complianceReports, c.policyCirculars, c.vendorRegistrations];
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      role="search"
      className="flex w-full items-stretch overflow-hidden rounded-md border border-slate-300 bg-white shadow-soft focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100"
    >
      <div className="relative hidden border-r border-slate-200 sm:block">
        <label htmlFor={`${id}-cat`} className="sr-only">
          {dict.header.categories.all}
        </label>
        <select
          id={`${id}-cat`}
          defaultValue={c.all}
          className="h-full appearance-none bg-slate-50 py-2.5 pl-3 pr-8 text-sm text-ink-soft outline-none"
        >
          {categories.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
      <label htmlFor={id} className="sr-only">
        {dict.header.search}
      </label>
      <input
        id={id}
        type="search"
        placeholder={dict.header.searchPlaceholder}
        className="min-w-0 flex-1 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-1.5 bg-gov-navy px-4 text-sm font-semibold text-white hover:bg-gov-navy-deep"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">{dict.header.search}</span>
      </button>
    </form>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { dict } = useI18n();
  const nav = [
    { label: dict.nav.home, href: "/#home" },
    { label: dict.nav.ongoingBids, href: "/tenders" },
    { label: dict.nav.aiServices, href: "/#capabilities" },
    { label: dict.nav.policies, href: "/#policies" },
    { label: dict.nav.helpdesk, href: "/#helpdesk" },
  ];

  return (
    <header className="relative z-40">
      <div className="h-1.5 w-full bg-gradient-to-r from-gov-saffron via-white to-gov-green" />

      <TopUtilityBar />

      {/* Main header */}
      <div className="border-b border-slate-200 bg-white shadow-soft">
        <div className="section flex flex-col gap-4 py-3.5 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center justify-between gap-3">
            <Logo href="#home" />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-gov-navy lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="lg:flex-1">
            <SearchBar id="site-search" />
          </div>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Link
              href="/register"
              className="btn rounded-md border border-gov-navy/25 bg-white px-4 py-2.5 text-gov-navy hover:bg-canvas"
            >
              {dict.common.signUp}
            </Link>
            <Link
              href="/login"
              className="btn rounded-md bg-gov-orange px-5 py-2.5 text-white hover:bg-gov-orange-dark"
            >
              {dict.common.officerLogin}
            </Link>
          </div>
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="border-b border-slate-200 bg-slate-100" aria-label="Primary">
        <div className="section hidden h-11 items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded px-3 py-1.5 text-sm font-semibold text-gov-navy/85 transition-colors hover:bg-white hover:text-gov-orange"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className={cn("lg:hidden", open ? "block" : "hidden")}>
          <div className="section flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-gov-navy hover:bg-white"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="btn rounded-md border border-gov-navy/25 bg-white text-gov-navy"
              >
                {dict.common.signUp}
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn rounded-md bg-gov-orange text-white"
              >
                {dict.common.officerLogin}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <GigwTicker />
    </header>
  );
}
