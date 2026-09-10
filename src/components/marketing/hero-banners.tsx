/* Original, on-theme hero banners in the GeM visual language (tricolour ribbon,
   navy base). Center-composed so they survive edge-cropping on any viewport.
   Text is passed in per slide so the carousel can render it in either language. */

import type { ComponentType } from "react";

const VB = "0 0 1600 520";

export type HeroSlideText = {
  eyebrow: string;
  headline: string[];
  sub: string;
};

function Frame({
  children,
  from = "#16244f",
  to = "#1f2f63",
}: {
  children: React.ReactNode;
  from?: string;
  to?: string;
}) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img">
      <defs>
        <linearGradient id={`bg-${from}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="1600" height="520" fill={`url(#bg-${from})`} />
      {/* faint grid */}
      <g stroke="#ffffff" strokeOpacity="0.04">
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={i} x1={i * 100} y1="0" x2={i * 100} y2="520" />
        ))}
      </g>
      {children}
      {/* tricolour ribbon sweeping across */}
      <g opacity="0.9">
        <path d="M-40 470 C 380 400 620 540 1060 452 C 1320 400 1500 458 1640 430 L 1640 520 L -40 520 Z" fill="#ff9933" opacity="0.28" />
        <path d="M-40 486 C 360 430 640 552 1080 470 C 1330 424 1520 476 1640 452 L 1640 520 L -40 520 Z" fill="#ffffff" opacity="0.18" />
        <path d="M-40 502 C 380 456 620 560 1060 492 C 1330 452 1520 500 1640 480 L 1640 520 L -40 520 Z" fill="#138808" opacity="0.3" />
      </g>
      <rect x="0" y="514" width="1600" height="6" fill="#ff9933" />
      <rect x="0" y="514" width="1066" height="6" fill="#ffffff" />
      <rect x="0" y="514" width="533" height="6" fill="#ff9933" />
    </svg>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <text x="800" y="150" textAnchor="middle" fill="#ffb066" fontSize="26" fontWeight="700" letterSpacing="4" fontFamily="var(--font-sans)">
      {children.toUpperCase()}
    </text>
  );
}

function Headline({ lines }: { lines: string[] }) {
  const size = lines.some((l) => l.length > 26) ? 52 : 62;
  const start = 250 - (lines.length - 1) * 34;
  return (
    <text textAnchor="middle" fill="#ffffff" fontSize={size} fontWeight="800" fontFamily="var(--font-sans)" letterSpacing="-1">
      {lines.map((l, i) => (
        <tspan key={i} x="800" y={start + i * (size + 12)}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function Sub({ children }: { children: string }) {
  return (
    <text x="800" y="392" textAnchor="middle" fill="#c9d4f0" fontSize="25" fontFamily="var(--font-sans)">
      {children}
    </text>
  );
}

function Slide({ text, children, from, to }: { text: HeroSlideText; children?: React.ReactNode; from?: string; to?: string }) {
  return (
    <Frame from={from} to={to}>
      {children}
      <Eyebrow>{text.eyebrow}</Eyebrow>
      <Headline lines={text.headline} />
      <Sub>{text.sub}</Sub>
    </Frame>
  );
}

type ArtProps = { text: HeroSlideText };

function BannerFlagship({ text }: ArtProps) {
  return (
    <Slide text={text} from="#132152" to="#22346c">
      <g transform="translate(800 92)" opacity="0.16">
        <circle r="150" fill="none" stroke="#ffffff" strokeWidth="2" />
        <circle r="110" fill="none" stroke="#ffffff" strokeWidth="2" />
      </g>
    </Slide>
  );
}

function BannerSpeed({ text }: ArtProps) {
  return (
    <Slide text={text} from="#0f2a4a" to="#1c4b7a">
      <g transform="translate(1230 120)" opacity="0.9">
        <path d="M0 150 A150 150 0 1 1 260 60" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="26" strokeLinecap="round" />
        <path d="M0 150 A150 150 0 0 1 150 0" fill="none" stroke="#ff9933" strokeWidth="26" strokeLinecap="round" />
        <text x="150" y="168" textAnchor="middle" fill="#ffffff" fontSize="64" fontWeight="800" fontFamily="var(--font-sans)">80%</text>
      </g>
    </Slide>
  );
}

function BannerForensics({ text }: ArtProps) {
  return (
    <Slide text={text} from="#241436" to="#3a1f57">
      <g transform="translate(800 74)" opacity="0.2">
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 10 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={-250 + c * 52} y={r * 16} width="44" height="10" rx="2" fill={(r + c) % 4 === 0 ? "#ff9933" : "#ffffff"} />
          )),
        )}
      </g>
    </Slide>
  );
}

function BannerCartel({ text }: ArtProps) {
  const nodes = [
    [1180, 120],
    [1320, 190],
    [1230, 280],
    [1380, 300],
    [1110, 240],
  ] as const;
  return (
    <Slide text={text} from="#10233f" to="#1b3a63">
      <g opacity="0.85">
        {nodes.map(([x, y], i) =>
          nodes.slice(i + 1).map(([x2, y2], j) => (
            <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#7d92c8" strokeWidth="2" />
          )),
        )}
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 2 ? 20 : 13} fill={i === 2 ? "#ff9933" : "#dbe6fb"} />
        ))}
      </g>
    </Slide>
  );
}

function BannerExemptions({ text }: ArtProps) {
  return (
    <Slide text={text} from="#5a3410" to="#8a4f14">
      <g transform="translate(1240 150)" opacity="0.9" fill="none" stroke="#ffe0b8" strokeWidth="10">
        <circle cx="120" cy="120" r="70" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={120 + Math.cos(a) * 70} y1={120 + Math.sin(a) * 70} x2={120 + Math.cos(a) * 96} y2={120 + Math.sin(a) * 96} strokeLinecap="round" />;
        })}
        <path d="M92 122 l20 20 l38 -44" strokeWidth="12" strokeLinecap="round" />
      </g>
    </Slide>
  );
}

function BannerIntegration({ text }: ArtProps) {
  return (
    <Slide text={text} from="#0f2547" to="#1d3f74">
      <g transform="translate(1150 120)" fill="#dbe6fb" opacity="0.9">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 96} ${i % 2 ? 40 : 0})`}>
            <ellipse cx="60" cy="30" rx="42" ry="13" />
            <path d="M18 30 v120 a42 13 0 0 0 84 0 v-120" opacity="0.55" />
            <ellipse cx="60" cy="30" rx="42" ry="13" fill="#8fb0e6" />
          </g>
        ))}
      </g>
    </Slide>
  );
}

export type HeroBanner = {
  key: "flagship" | "speed" | "forensics" | "cartel" | "exemptions" | "integration";
  art: ComponentType<ArtProps>;
  /** where the CTAs on this slide point */
  primary: string;
  secondary: string;
};

export const heroBanners: HeroBanner[] = [
  { key: "flagship", art: BannerFlagship, primary: "/login", secondary: "#policies" },
  { key: "speed", art: BannerSpeed, primary: "#capabilities", secondary: "#portals" },
  { key: "forensics", art: BannerForensics, primary: "/login", secondary: "#capabilities" },
  { key: "cartel", art: BannerCartel, primary: "/login", secondary: "#capabilities" },
  { key: "exemptions", art: BannerExemptions, primary: "/register", secondary: "#policies" },
  { key: "integration", art: BannerIntegration, primary: "/login", secondary: "#capabilities" },
];
