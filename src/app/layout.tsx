import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { Toaster } from "sonner";
import { GemSahayak } from "@/components/chat/gem-sahayak";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-deva",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GeM Verify — AI-Powered Bid Compliance Verification",
    template: "%s · GeM Verify",
  },
  description:
    "AI-driven platform that automates bidder background verification and statutory compliance checks across government sources for GeM procurement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  return (
    <html
      lang={locale}
      className={`${plexSans.variable} ${plexMono.variable} ${notoDevanagari.variable}`}
    >
      <body>
        {children}
        <GemSahayak />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "12px",
              border: "1px solid #e5e8f0",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
