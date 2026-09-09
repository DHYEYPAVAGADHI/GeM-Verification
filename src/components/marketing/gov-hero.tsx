import Link from "next/link";
import { ArrowRight } from "lucide-react";

function HeroArt() {
  return (
    <svg viewBox="0 0 560 380" className="w-full max-w-[560px]" role="img" aria-label="Automated tender verification with a procurement officer">
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2fc" />
        </linearGradient>
        <marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#7d92c8" />
        </marker>
      </defs>

      {/* flow connectors */}
      <g stroke="#7d92c8" strokeWidth="2.2" fill="none">
        <path d="M96 92 H150" markerEnd="url(#a)" />
        <path d="M300 92 H352" markerEnd="url(#a)" />
        <path d="M225 176 V226 H352" markerEnd="url(#a)" />
        <path d="M96 262 H150 V190" markerEnd="url(#a)" />
      </g>

      {/* AI node */}
      <rect x="34" y="60" width="62" height="64" rx="12" fill="#1b2a5e" />
      <text x="65" y="100" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="700" fontFamily="var(--font-sans)">AI</text>

      {/* document stack + magnifier + emblem + seal */}
      <g>
        <rect x="176" y="30" width="100" height="128" rx="9" fill="url(#paper)" stroke="#c3d0ec" />
        <rect x="164" y="42" width="100" height="128" rx="9" fill="url(#paper)" stroke="#c3d0ec" />
        <rect x="152" y="54" width="100" height="128" rx="9" fill="#ffffff" stroke="#b4c3e6" />
        {/* emblem tick */}
        <circle cx="176" cy="78" r="7" fill="none" stroke="#c9a227" strokeWidth="2" />
        <path d="M172.5 78 l2.5 2.5 l4.5 -5" fill="none" stroke="#c9a227" strokeWidth="1.8" strokeLinecap="round" />
        {[96, 108, 120, 132].map((y) => (
          <rect key={y} x="166" y={y} width={y === 132 ? 42 : 66} height="4.5" rx="2.25" fill="#d9e2f4" />
        ))}
        {/* blue verification seal */}
        <circle cx="228" cy="150" r="10" fill="#dbe6fb" stroke="#3a5bd0" strokeWidth="1.6" />
        <path d="M223.5 150 l3 3 l6 -7" fill="none" stroke="#3a5bd0" strokeWidth="2" strokeLinecap="round" />
        {/* magnifier */}
        <circle cx="212" cy="120" r="20" fill="none" stroke="#e8730c" strokeWidth="4" />
        <line x1="227" y1="135" x2="242" y2="150" stroke="#e8730c" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* databases */}
      <g fill="#1b2a5e">
        <ellipse cx="392" cy="62" rx="30" ry="9" />
        <path d="M362 62 v42 a30 9 0 0 0 60 0 v-42" opacity=".92" />
        <ellipse cx="392" cy="62" rx="30" ry="9" fill="#3a4c8a" />
        <ellipse cx="392" cy="84" rx="30" ry="9" fill="#24356f" />
        <ellipse cx="392" cy="240" rx="30" ry="9" />
        <path d="M362 240 v36 a30 9 0 0 0 60 0 v-36" opacity=".92" />
        <ellipse cx="392" cy="240" rx="30" ry="9" fill="#3a4c8a" />
      </g>

      {/* verified check */}
      <circle cx="392" cy="176" r="23" fill="#2fa84f" />
      <path d="M381 176 l7.5 7.5 l15 -16" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* officer at a laptop */}
      <g transform="translate(392 250)">
        {/* laptop */}
        <path d="M-58 96 h116 l10 22 h-136 z" fill="#c9d3e8" />
        <rect x="-46" y="46" width="92" height="52" rx="4" fill="#1b2a5e" />
        <rect x="-40" y="52" width="80" height="40" rx="2" fill="#eef2fc" />
        {/* body */}
        <path d="M-40 46 c0 -34 80 -34 80 0 z" fill="#1b2a5e" />
        <path d="M-8 12 h16 v18 h-16 z" fill="#e7b48f" />
        {/* head */}
        <circle cx="0" cy="-6" r="17" fill="#e7b48f" />
        <path d="M-17 -8 a17 17 0 0 1 34 0 c0 -20 -34 -20 -34 0z" fill="#2c2c35" />
        <path d="M12 4 c8 4 10 16 8 30 l-8 -2 z" fill="#2c2c35" />
        {/* collar */}
        <path d="M-11 14 l11 10 l11 -10 l4 8 l-15 12 l-15 -12z" fill="#fff" />
      </g>
    </svg>
  );
}

export function GovHero() {
  return (
    <section id="home" className="scroll-mt-0 bg-gov-wash">
      <div className="section grid items-center gap-8 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <div className="animate-fade-up">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gov-navy/15 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gov-navy/70">
            Smart India Hackathon 2026 · Problem Statement 26100
          </p>
          <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-gov-navy sm:text-4xl xl:text-[2.7rem]">
            AI-Powered Integrated Bid Compliance Verification Platform
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Automating tender document scrutiny, detecting forgery, and improving{" "}
            <span className="font-bold text-gov-navy">procurement efficiency for the Government e-Marketplace</span> —
            so officers award the right bidder, faster.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="btn rounded-md bg-gov-orange px-8 py-3.5 text-[15px] font-bold text-white hover:bg-gov-orange-dark"
            >
              Procurement Officer Login <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="btn rounded-md border border-gov-navy/25 bg-white px-6 py-3.5 text-gov-navy hover:bg-white/60"
            >
              New user? Register
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            The AI system is decision support. Final qualification / disqualification rests with the Procurement Officer.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroArt />
        </div>
      </div>

      <div className="border-t border-gov-navy/10 bg-white/50">
        <div className="section grid gap-4 py-5 text-center text-sm sm:grid-cols-3">
          {[
            ["10+", "government registries connected"],
            ["6-stage", "verification pipeline, fully logged"],
            ["Officer-led", "the AI recommends, the officer decides"],
          ].map(([a, b]) => (
            <div key={b}>
              <span className="font-extrabold text-gov-navy">{a}</span>{" "}
              <span className="text-ink-muted">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
