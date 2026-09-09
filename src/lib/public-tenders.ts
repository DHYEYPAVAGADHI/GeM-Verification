/**
 * Public "Ongoing Bids" feed for the browse-before-login flow (`/tenders`).
 *
 * Source of truth is the FastAPI sandbox — `GET /v1/public/tenders`, no JWT.
 * If it is unreachable (Next-only dev), we fall back to the bundled sample so
 * the page always renders. Point NEXT_PUBLIC_ENGINE_URL at the API in prod.
 */

export type PublicTender = {
  id: string;
  bid_no: string;
  title: string;
  ministry: string;
  department: string;
  category: string;
  quantity: number;
  est_value_cr: number;
  emd_amount: number;
  mse_exemption: boolean;
  start_date: string;
  end_date: string;
  days_left: number;
};

export type PublicTenderList = {
  count: number;
  ministries: string[];
  results: PublicTender[];
};

export const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8000";

/** The private screen a bidder lands on to actually participate. */
export const applyPath = (tenderId: string) => `/vendor/tenders/${tenderId}`;

const daysLeft = (end: string) =>
  Math.round((new Date(end).getTime() - Date.now()) / 86_400_000);

const SAMPLE: Omit<PublicTender, "days_left">[] = [
  { id: "GEM_2026_B_5544021", bid_no: "GEM/2026/B/5544021", title: "Supply of Laptops (i7, 16GB) for field offices", ministry: "Ministry of Electronics and Information Technology", department: "National Informatics Centre", category: "Computers & Laptops", quantity: 1200, est_value_cr: 18.4, emd_amount: 1_840_000, mse_exemption: true, start_date: "2026-08-20", end_date: "2026-09-18" },
  { id: "GEM_2026_B_5544198", bid_no: "GEM/2026/B/5544198", title: "Annual Rate Contract — Surgical Gloves (Nitrile, Sterile)", ministry: "Ministry of Health and Family Welfare", department: "Central Medical Services Society", category: "Medical Consumables", quantity: 2_500_000, est_value_cr: 6.7, emd_amount: 670_000, mse_exemption: true, start_date: "2026-08-28", end_date: "2026-09-10" },
  { id: "GEM_2026_B_5545677", bid_no: "GEM/2026/B/5545677", title: "Track Maintenance Machinery — spare parts & consumables", ministry: "Ministry of Railways", department: "Northern Railway", category: "Industrial Spares", quantity: 340, est_value_cr: 42.1, emd_amount: 4_200_000, mse_exemption: false, start_date: "2026-08-15", end_date: "2026-09-25" },
  { id: "GEM_2026_B_5546012", bid_no: "GEM/2026/B/5546012", title: "Solar Rooftop Plants (100 kWp) — turnkey installation", ministry: "Ministry of New and Renewable Energy", department: "Solar Energy Corporation of India", category: "Renewable Energy Works", quantity: 22, est_value_cr: 29.8, emd_amount: 2_980_000, mse_exemption: false, start_date: "2026-09-01", end_date: "2026-10-05" },
  { id: "GEM_2026_B_5546541", bid_no: "GEM/2026/B/5546541", title: "Office Furniture — modular workstations and chairs", ministry: "Ministry of Finance", department: "Central Board of Direct Taxes", category: "Furniture & Fixtures", quantity: 850, est_value_cr: 3.2, emd_amount: 320_000, mse_exemption: true, start_date: "2026-08-30", end_date: "2026-09-14" },
  { id: "GEM_2026_B_5547203", bid_no: "GEM/2026/B/5547203", title: "Housekeeping & Sanitation Services — 3 campuses (2 years)", ministry: "Ministry of Education", department: "University Grants Commission", category: "Manpower Services", quantity: 1, est_value_cr: 11.5, emd_amount: 1_150_000, mse_exemption: true, start_date: "2026-08-22", end_date: "2026-09-12" },
  { id: "GEM_2026_B_5547889", bid_no: "GEM/2026/B/5547889", title: "Bulletproof Jackets (Level IV) — BIS certified", ministry: "Ministry of Home Affairs", department: "Central Reserve Police Force", category: "Defence & Security Equipment", quantity: 15_000, est_value_cr: 96.0, emd_amount: 9_600_000, mse_exemption: false, start_date: "2026-08-10", end_date: "2026-09-30" },
  { id: "GEM_2026_B_5548334", bid_no: "GEM/2026/B/5548334", title: "Mail Delivery Vehicles — electric two-wheelers", ministry: "Ministry of Communications", department: "Department of Posts", category: "Vehicles", quantity: 4_000, est_value_cr: 52.0, emd_amount: 5_200_000, mse_exemption: false, start_date: "2026-09-02", end_date: "2026-09-22" },
  { id: "GEM_2026_B_5549001", bid_no: "GEM/2026/B/5549001", title: "Highway CCTV & ANPR camera systems — supply and commissioning", ministry: "Ministry of Road Transport and Highways", department: "National Highways Authority of India", category: "Surveillance Systems", quantity: 620, est_value_cr: 24.3, emd_amount: 2_430_000, mse_exemption: true, start_date: "2026-08-25", end_date: "2026-09-16" },
  { id: "GEM_2026_B_5549770", bid_no: "GEM/2026/B/5549770", title: "Drone-based crop survey services — 4 states", ministry: "Ministry of Agriculture and Farmers Welfare", department: "Department of Agriculture & Cooperation", category: "Geospatial Services", quantity: 1, est_value_cr: 8.9, emd_amount: 890_000, mse_exemption: true, start_date: "2026-09-03", end_date: "2026-10-01" },
];

function fallback(): PublicTenderList {
  const results = SAMPLE.map((t) => ({ ...t, days_left: daysLeft(t.end_date) }));
  return {
    count: results.length,
    ministries: [...new Set(SAMPLE.map((t) => t.ministry))].sort(),
    results,
  };
}

export async function getPublicTenders(): Promise<PublicTenderList> {
  try {
    const res = await fetch(`${ENGINE_URL}/v1/public/tenders?sort=end_date_asc`, {
      // ongoing bids change slowly — cache for a minute
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`engine ${res.status}`);
    return (await res.json()) as PublicTenderList;
  } catch {
    return fallback();
  }
}
