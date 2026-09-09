import Link from "next/link";
import { cn } from "@/lib/utils";

/* State Emblem of India — stylised, single-colour */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10", className)} role="img" aria-label="State Emblem of India">
      <g fill="none" stroke="#1b2a5e" strokeWidth="1.6" strokeLinecap="round">
        {Array.from({ length: 3 }).map((_, i) => {
          const x = 16 + i * 8;
          return <path key={i} d={`M${x} 30 v-16 M${x - 3} 14 h6 M${x - 3} 14 l3 -5 l3 5`} />;
        })}
        <path d="M10 31 h28" strokeWidth="2" />
        <path d="M13 34 h22" />
        <path d="M15 37 c3 4 15 4 18 0" strokeWidth="1.3" />
      </g>
      <circle cx="24" cy="41.5" r="2.4" fill="none" stroke="#1b2a5e" strokeWidth="1.3" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={24 + Math.cos(a) * 1}
            y1={41.5 + Math.sin(a) * 1}
            x2={24 + Math.cos(a) * 3.2}
            y2={41.5 + Math.sin(a) * 3.2}
            stroke="#1b2a5e"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

/* GeM sparkle — six coloured facets radiating from a centre */
export function GemMark({ className }: { className?: string }) {
  const petals = [
    { a: -90, c: "#e23b3b" },
    { a: -30, c: "#f18f1c" },
    { a: 30, c: "#f5c518" },
    { a: 90, c: "#2fa84f" },
    { a: 150, c: "#1f7ac0" },
    { a: 210, c: "#7b3fb5" },
  ];
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} role="img" aria-label="GeM">
      {petals.map((p, i) => (
        <g key={i} transform={`rotate(${p.a} 20 20)`}>
          <path d="M20 20 L23 8 L20 2 L17 8 Z" fill={p.c} />
        </g>
      ))}
      <circle cx="20" cy="20" r="3.4" fill="#fff" />
      <circle cx="20" cy="20" r="2" fill="#1b2a5e" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  onLight = true,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  onLight?: boolean;
  showWordmark?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <Emblem className="h-9 w-9 shrink-0" />
      <span aria-hidden className={cn("h-8 w-px shrink-0", onLight ? "bg-slate-300" : "bg-white/30")} />
      <GemMark className="h-8 w-8 shrink-0" />
      {showWordmark && (
        <span className="leading-none">
          <span className={cn("block text-xl font-extrabold tracking-tight", onLight ? "text-gov-navy" : "text-white")}>
            GeM
          </span>
          <span className={cn("block text-[10px] font-medium tracking-wide", onLight ? "text-ink-muted" : "text-white/70")}>
            Government e-Marketplace
          </span>
        </span>
      )}
    </Link>
  );
}
