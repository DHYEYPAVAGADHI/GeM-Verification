/**
 * Benchmark case set for the Bulk AI Audit console.
 *
 * These five records are the real BID_1000–BID_1004 rows from
 * `gem_bidders_registry_1000.csv`, enriched with what each AI engine returns:
 *
 *   BID_1000  clean baseline                       → Recommended
 *   BID_1001  tampered turnover certificate (ELA)  → Not Recommended
 *   BID_1002  shares DIN 07654321 with BID_1003    → Cartel ring
 *   BID_1003  shares DIN 07654321 with BID_1002    → Cartel ring
 *   BID_1004  Udyam-verified MSE                   → EMD waived
 */

import { ENGINE_URL } from "@/lib/public-tenders";

export type RiskLevel = "low" | "review" | "high";

export type AuditCase = {
  bidderId: string;
  companyName: string;
  pan: string;
  gstin: string;
  cin: string;
  isMsme: boolean;
  udyamNo: string | null;
  /** Turnover declared in the bid / national registry, ₹ Cr. */
  declaredTurnoverCr: number;
  /** What Claude Vision actually read off the uploaded certificate, ₹ Cr. */
  extractedTurnoverCr: number;
  /** What ELA says the figure was before it was edited (tampered docs only). */
  originalTurnoverCr: number | null;
  caUdin: string;
  miiPct: number;
  directorName: string;
  directorDin: string;
  tampered: boolean;
  /** Mean ELA residual — higher means more re-compression difference. */
  elaResidual: number;
  extractionConfidence: number;
  score: number;
  risk: RiskLevel;
  routing: string;
  emdWaived: boolean;
  flags: string[];
  /** Other bidder IDs sharing this director. */
  cartelWith: string[];
};

export const BENCHMARK_CASES: AuditCase[] = [
  {
    bidderId: "BID_1000",
    companyName: "Apex Tech Solutions Pvt Ltd",
    pan: "OSTCY7400J",
    gstin: "09OSTCY7400J6ZO",
    cin: "L48662KA2006ZYU950352",
    isMsme: false,
    udyamNo: "UDYAM-DL-48-7507343",
    declaredTurnoverCr: 15.2,
    extractedTurnoverCr: 15.2,
    originalTurnoverCr: null,
    caUdin: "24541576MXGKYM5021",
    miiPct: 72,
    directorName: "Vyanjana Venkataraman",
    directorDin: "07816442",
    tampered: false,
    elaResidual: 0.31,
    extractionConfidence: 96,
    score: 88,
    risk: "low",
    routing: "MII Class-I (≥ 50% local)",
    emdWaived: false,
    flags: ["GSTIN active", "PAN verified", "No debarment"],
    cartelWith: [],
  },
  {
    bidderId: "BID_1001",
    companyName: "Zenith Infra Corp",
    pan: "ARPCO8931W",
    gstin: "29ARPCO8931W4ZX",
    cin: "U47446DL2021HLV479291",
    isMsme: false,
    udyamNo: "UDYAM-MH-47-9693181",
    declaredTurnoverCr: 10.5,
    extractedTurnoverCr: 10.5,
    originalTurnoverCr: 1.5,
    caUdin: "24904586FDBOGT3065",
    miiPct: 42,
    directorName: "Chandresh Chaudhuri",
    directorDin: "98695415",
    tampered: true,
    elaResidual: 27.4,
    extractionConfidence: 91,
    score: 31,
    risk: "high",
    routing: "Non-local (< 50% MII)",
    emdWaived: false,
    flags: [
      "Turnover certificate shows tamper indicators",
      "Local content below Class-II threshold",
      "UDIN not traceable on ICAI portal",
    ],
    cartelWith: [],
  },
  {
    bidderId: "BID_1002",
    companyName: "Nexus Digital Systems Pvt Ltd",
    pan: "VQYCA0464D",
    gstin: "09VQYCA0464D8Z9",
    cin: "U95815GJ2014IPR031905",
    isMsme: false,
    udyamNo: "UDYAM-KA-84-7178157",
    declaredTurnoverCr: 131.63,
    extractedTurnoverCr: 131.63,
    originalTurnoverCr: null,
    caUdin: "24918344CHIGMU4434",
    miiPct: 29,
    directorName: "Suresh Kumar",
    directorDin: "07654321",
    tampered: false,
    elaResidual: 0.42,
    extractionConfidence: 94,
    score: 42,
    risk: "high",
    routing: "MII Class-II",
    emdWaived: false,
    flags: [
      "Shares Director DIN 07654321 with BID_1003",
      "Competing bidder on the same tender",
    ],
    cartelWith: ["BID_1003"],
  },
  {
    bidderId: "BID_1003",
    companyName: "Synergy Smart Technologies LLP",
    pan: "YJECR6726I",
    gstin: "09YJECR6726I5ZM",
    cin: "L55617DL2008ERT716528",
    isMsme: false,
    udyamNo: "UDYAM-KA-23-2048740",
    declaredTurnoverCr: 28.63,
    extractedTurnoverCr: 28.63,
    originalTurnoverCr: null,
    caUdin: "24016593UPRPYI2498",
    miiPct: 71.5,
    directorName: "Suresh Kumar",
    directorDin: "07654321",
    tampered: false,
    elaResidual: 0.38,
    extractionConfidence: 95,
    score: 45,
    risk: "high",
    routing: "MII Class-II",
    emdWaived: false,
    flags: [
      "Shares Director DIN 07654321 with BID_1002",
      "Registered address within 2 km of BID_1002",
    ],
    cartelWith: ["BID_1002"],
  },
  {
    bidderId: "BID_1004",
    companyName: "Pratham Innovations LLP",
    pan: "HKPCA5357D",
    gstin: "27HKPCA5357D8ZA",
    cin: "L61136UP2004APJ324215",
    isMsme: true,
    udyamNo: "UDYAM-GJ-01-0098765",
    declaredTurnoverCr: 1.8,
    extractedTurnoverCr: 1.8,
    originalTurnoverCr: null,
    caUdin: "24696321AHMGIY5856",
    miiPct: 85,
    directorName: "Wahab Jain",
    directorDin: "95267360",
    tampered: false,
    elaResidual: 0.27,
    extractionConfidence: 97,
    score: 79,
    risk: "low",
    routing: "MII Class-I · MSE Order 2012",
    emdWaived: true,
    flags: [
      "Udyam registration verified — Micro enterprise",
      "EMD exempt under Public Procurement (MSE) Order 2012",
      "Prior-turnover criterion relaxed",
    ],
    cartelWith: [],
  },
];

export const RISK_META: Record<RiskLevel, { label: string; tone: string; dot: string }> = {
  low: { label: "Recommended", tone: "bg-risk-low-bg text-risk-low", dot: "bg-risk-low" },
  review: { label: "Review Required", tone: "bg-risk-review-bg text-risk-review", dot: "bg-risk-review" },
  high: { label: "High Risk", tone: "bg-risk-high-bg text-risk-high", dot: "bg-risk-high" },
};

/* ------------------------------ cartel engine ---------------------------- */

export type CartelRing = {
  director_din: string;
  director_name: string;
  company_names: string[];
  connected_bids: string[];
  ring_size: number;
};

/** Seeded fallback so the demo never depends on the FastAPI engine being up. */
export const SEEDED_RING: CartelRing = {
  director_din: "07654321",
  director_name: "Suresh Kumar",
  company_names: ["Nexus Digital Systems Pvt Ltd", "Synergy Smart Technologies LLP"],
  connected_bids: ["BID_1002", "BID_1003"],
  ring_size: 2,
};

/**
 * Pulls the live NetworkX ring for a DIN from `GET /v1/ai/cartel/check`.
 * Returns `{ ring, live }` — `live:false` means we fell back to the seed.
 */
export async function fetchCartelRing(
  din: string,
): Promise<{ ring: CartelRing; live: boolean }> {
  try {
    const res = await fetch(`${ENGINE_URL}/v1/ai/cartel/check`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { rings?: CartelRing[] };
    const hit = json.rings?.find((r) => r.director_din === din);
    if (hit) return { ring: hit, live: true };
  } catch {
    /* engine offline — fall through to the seed */
  }
  return { ring: SEEDED_RING, live: false };
}
