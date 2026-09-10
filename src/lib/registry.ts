/**
 * Server-side index over the national bidder registry CSV
 * (`backend/app/data/gem_bidders_registry_1000.csv`) — the same file the
 * FastAPI self-registration endpoint appends to, so freshly registered
 * vendors match here too.
 *
 * Used by the Bulk AI Audit route to decide, for each uploaded PDF, whether the
 * extracted PAN / GSTIN belongs to a registered entity eligible for a tender.
 */
import "server-only";

import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

export type RegistryRecord = {
  bidderId: string;
  companyName: string;
  pan: string;
  gstin: string;
  isMsme: boolean;
  udyamNo: string;
  turnoverCr: number;
  caUdin: string;
  miiPct: number;
  directorName: string;
  directorDin: string;
  tampered: boolean;
};

type Index = {
  byPan: Map<string, RegistryRecord>;
  byGstin: Map<string, RegistryRecord>;
  count: number;
};

const CSV_PATH =
  process.env.REGISTRY_CSV_PATH ??
  path.join(process.cwd(), "backend", "app", "data", "gem_bidders_registry_1000.csv");

/** Split one CSV line, honouring double-quoted fields that contain commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

let cache: { mtime: number; index: Index } | null = null;

async function loadIndex(): Promise<Index> {
  const raw = await readFile(CSV_PATH, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);

  const ci = {
    bidderId: col("bidder_id"),
    companyName: col("company_name"),
    pan: col("pan_number"),
    gstin: col("gstin"),
    isMsme: col("is_msme"),
    udyamNo: col("udyam_reg_no"),
    turnoverCr: col("fy_turnover_cr"),
    caUdin: col("ca_udin"),
    miiPct: col("mii_percentage"),
    directorName: col("director_name"),
    directorDin: col("director_din"),
    tampered: col("tampered_flag"),
  };

  const byPan = new Map<string, RegistryRecord>();
  const byGstin = new Map<string, RegistryRecord>();

  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    if (f.length < header.length) continue;
    const rec: RegistryRecord = {
      bidderId: f[ci.bidderId]?.trim() ?? "",
      companyName: f[ci.companyName]?.trim() ?? "",
      pan: (f[ci.pan] ?? "").trim().toUpperCase(),
      gstin: (f[ci.gstin] ?? "").trim().toUpperCase(),
      isMsme: (f[ci.isMsme] ?? "").trim().toLowerCase() === "true",
      udyamNo: f[ci.udyamNo]?.trim() ?? "NA",
      turnoverCr: Number(f[ci.turnoverCr]) || 0,
      caUdin: f[ci.caUdin]?.trim() ?? "",
      miiPct: Number(f[ci.miiPct]) || 0,
      directorName: f[ci.directorName]?.trim() ?? "",
      directorDin: f[ci.directorDin]?.trim() ?? "",
      tampered: (f[ci.tampered] ?? "").trim().toLowerCase() === "true",
    };
    if (rec.pan) byPan.set(rec.pan, rec);
    if (rec.gstin) byGstin.set(rec.gstin, rec);
  }

  return { byPan, byGstin, count: lines.length - 1 };
}

async function getIndex(): Promise<Index> {
  try {
    const { mtimeMs } = await import("node:fs/promises").then((m) => m.stat(CSV_PATH));
    if (cache && cache.mtime === mtimeMs) return cache.index;
    const index = await loadIndex();
    cache = { mtime: mtimeMs, index };
    return index;
  } catch {
    // Registry file unavailable — return an empty index so extraction still runs.
    return { byPan: new Map(), byGstin: new Map(), count: 0 };
  }
}

export async function lookupRegistry(opts: {
  pan?: string;
  gstin?: string;
}): Promise<RegistryRecord | null> {
  const index = await getIndex();
  const gstin = opts.gstin?.trim().toUpperCase();
  const pan = opts.pan?.trim().toUpperCase();
  if (gstin && index.byGstin.has(gstin)) return index.byGstin.get(gstin)!;
  if (pan && index.byPan.has(pan)) return index.byPan.get(pan)!;
  return null;
}

export async function registrySize(): Promise<number> {
  return (await getIndex()).count;
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export type NewRegistryRow = {
  companyName: string;
  loginEmail: string;
  aadhaarMasked: string;
  pan: string;
  gstin: string;
  cin: string;
  isMsme: boolean;
  udyamNo: string;
  turnoverCr: number;
  caUdin: string;
  miiPct: number;
  directorName: string;
  directorDin: string;
  registeredAddress: string;
};

/**
 * Append one freshly registered entity to the national bidder registry CSV,
 * minting the next BID_xxxx id. The file is the same one the FastAPI sandbox
 * appends to and that the AI audit / eligibility checks read from, so a new
 * vendor is immediately matchable everywhere.
 */
export async function appendRegistryRecord(row: NewRegistryRow): Promise<{ bidderId: string }> {
  const index = await getIndex();
  const bidderId = `BID_${1000 + index.count}`;
  const existing = await readFile(CSV_PATH, "utf-8").catch(() => "");
  const eol = existing.includes("\r\n") ? "\r\n" : "\n";
  const prefix = existing.length > 0 && !existing.endsWith("\n") ? eol : "";
  const line =
    prefix +
    [
      bidderId,
      row.companyName,
      row.loginEmail,
      row.aadhaarMasked || "NA",
      row.pan.toUpperCase(),
      row.gstin.toUpperCase(),
      row.cin || "NA",
      row.isMsme ? "True" : "False",
      row.udyamNo || "NA",
      row.turnoverCr.toFixed(2),
      row.caUdin || "NA",
      Math.round(row.miiPct),
      row.directorName || "NA",
      row.directorDin || "NA",
      row.registeredAddress || "NA",
      "False", // tampered_flag — a self-registered entity is not pre-flagged
    ]
      .map(csvCell)
      .join(",") + eol;

  await appendFile(CSV_PATH, line, "utf-8");
  cache = null; // force re-index on next lookup
  return { bidderId };
}
