# GeM Verify

AI-powered integrated **bid compliance verification platform** for the Government
e-Marketplace (GeM). Smart India Hackathon prototype — an end-to-end system where
vendors prepare and submit bids, a verification engine cross-checks every
document and registration against government sources, and procurement officers
review the scored result and record the decision.

## Three surfaces

| Surface | Path | Who |
| --- | --- | --- |
| Public website | `/` | Anyone — explains the platform |
| Bidder portal | `/vendor` | Vendors — company profile, tender discovery, bid-submission wizard, bid tracker |
| Verification console | `/dashboard` | Procurement officers — tenders, bids, per-bid verification, clarifications, decisions, audit trail |

> The AI is decision support. Qualification / disqualification is always recorded
> by the Procurement Officer.

## Run it

```bash
npm install
npm run db:push     # create the SQLite database
npm run db:seed     # seed government records, vendors, tenders, bids (runs the engine)
npm run dev
```

Open http://localhost:3000.

**Demo accounts** (password `Demo@12345` for all):

| Role | Email |
| --- | --- |
| Procurement Officer | `officer@gem.gov.in` |
| Vendor — Apollo Technologies | `apollo@apollotech.in` |
| Vendor — ABC Systems (fails checks) | `bids@abcsystems.in` |
| Vendor — Greenfield Traders (fails checks) | `sales@greenfieldtraders.co.in` |

```bash
npm run build && npm start   # production build
npm run db:studio            # inspect the database
```

## Stack

- **Next.js 14** App Router · **React 18** · Server Actions
- **Auth.js v5** — Credentials + optional Google OAuth, role-gated middleware (`OFFICER` / `VENDOR` / `ADMIN`)
- **Prisma + SQLite** — swap `provider` + `DATABASE_URL` for Postgres in production
- **Tailwind CSS** — IBM Plex Sans / Mono, single deliberate light theme
- **framer-motion** — page transitions, scroll reveals, count-ups, animated gauges & progress
- **sonner** — toasts · **Recharts** · **lucide-react**
- **pdf-lib** (sample + dossier generation) · **pdf-parse** (real PDF text extraction)

### Google sign-in

The login page shows **Continue with Google** when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
are set (see `.env.example`). First Google login creates a vendor account with a
starter company profile. Without the env vars the button is simply hidden and
the demo runs on the seeded email accounts.

## The verification engine (`src/lib/engine/`)

Runs on every bid submission and every clarification response:

| Module | What it does |
| --- | --- |
| `extract.ts` + `patterns.ts` | Real PDF text extraction, then deterministic parsing of PAN, GSTIN, Udyam no., CIN, UDIN, DIN, turnover, local-content %, embedded QR payload — with a confidence score |
| `gateway.ts` | **Government Source Gateway** — one adapter per portal (GSTN, PAN/IT, Udyam, MCA21, EPFO, DPIIT, CPPP debarment). Mock adapter resolves against seeded `Gov*` tables; production swaps in a live adapter, calling code unchanged |
| `forensics.ts` | Document integrity — PDF metadata, image-editor fingerprints, incremental-save detection, QR-vs-OCR mismatch, byte-identical file reuse across bidders |
| `rules.ts` | Evaluates each tender's eligibility criteria against verified facts; applies MSME / DPIIT-Startup statutory relaxations |
| `scoring.ts` | Weighted 0–100 compliance score with gate overrides, risk level, and an explainable recommendation (Recommended / Review Required / Not Recommended) |
| `audit.ts` | Hash-chained, tamper-evident audit log — each entry hashes the previous, `verifyAuditChain()` detects any alteration |
| `run.ts` | Orchestrates the above and persists a `VerificationRun` with per-check evidence |
| `preview.ts` | Pre-bid "check my eligibility" — rules against profile + live gov data, before documents |

## What the demo shows

- Vendor logs in, sees bid readiness, checks eligibility against a tender, fills
  the 7-step submission wizard (mapping vault documents), signs and submits
- The engine runs instantly: extraction → gateway checks → forensics → rules →
  score. A tampered certificate (Photoshop metadata + QR mismatch) and a
  suspended GST registration produce a *Not Recommended* with a written basis
- The officer sees the scored bid, an eligibility matrix, per-document integrity
  reports, a **collusion graph** (shared directors across bidders on one tender),
  requests a clarification, and records a decision → generates a PDF dossier
- Every step is on the hash-chained audit trail

## Not in this prototype

Live government API integrations (documented adapter path via APISetu / GSTN /
MCA21), OCR for scanned images (text-layer extraction only), Postgres + object
storage, DSC signing, React-Flow cartel visualisation.
