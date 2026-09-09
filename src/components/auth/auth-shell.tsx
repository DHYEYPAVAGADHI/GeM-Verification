import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gov-navy p-12 text-white lg:flex">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-gov-saffron via-white to-gov-green" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
        <Logo href="/" onLight={false} />
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight">
            AI-Powered Integrated Bid Compliance Verification Platform
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Officers configure tenders, verify statutory documents and record decisions. Vendors
            register, prepare and submit bids. Every action is logged to a tamper-evident trail.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-white/70">
          <ShieldCheck className="h-4 w-4" /> SIH 2026 prototype · Problem Statement 26100
        </p>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-gov-saffron via-white to-gov-green lg:hidden" />
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo href="/" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
