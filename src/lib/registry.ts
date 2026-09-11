/**
 * National bidder registry — DB-backed (Prisma `RegistryEntry`), seeded from
 * the same 1,000-row dataset the Python backend uses, plus every entity that
 * self-registers through /register.
 *
 * Used by the Bulk AI Audit route to decide, for each uploaded PDF, whether
 * the extracted PAN / GSTIN belongs to a registered entity eligible for a
 * tender, and by vendor registration to mint a bidder id.
 */
import "server-only";

import { db } from "@/lib/db";

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

function toRecord(row: {
  bidderId: string;
  companyName: string;
  pan: string;
  gstin: string;
  isMsme: boolean;
  udyamNo: string | null;
  turnoverCr: number;
  caUdin: string | null;
  miiPct: number;
  directorName: string | null;
  directorDin: string | null;
  tampered: boolean;
}): RegistryRecord {
  return {
    bidderId: row.bidderId,
    companyName: row.companyName,
    pan: row.pan,
    gstin: row.gstin,
    isMsme: row.isMsme,
    udyamNo: row.udyamNo ?? "NA",
    turnoverCr: row.turnoverCr,
    caUdin: row.caUdin ?? "",
    miiPct: row.miiPct,
    directorName: row.directorName ?? "",
    directorDin: row.directorDin ?? "",
    tampered: row.tampered,
  };
}

export async function lookupRegistry(opts: {
  pan?: string;
  gstin?: string;
}): Promise<RegistryRecord | null> {
  const gstin = opts.gstin?.trim().toUpperCase();
  const pan = opts.pan?.trim().toUpperCase();
  if (!gstin && !pan) return null;

  const row = await db.registryEntry.findFirst({
    where: {
      OR: [gstin ? { gstin } : undefined, pan ? { pan } : undefined].filter(
        (c): c is { gstin: string } | { pan: string } => !!c,
      ),
    },
  });
  return row ? toRecord(row) : null;
}

export async function registrySize(): Promise<number> {
  return db.registryEntry.count();
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
 * Register one freshly onboarded entity, minting the next BID_xxxx id, so a
 * new vendor is immediately matchable by the AI audit / eligibility checks.
 */
export async function appendRegistryRecord(row: NewRegistryRow): Promise<{ bidderId: string }> {
  const count = await db.registryEntry.count();
  const bidderId = `BID_${1000 + count}`;

  await db.registryEntry.create({
    data: {
      bidderId,
      companyName: row.companyName,
      loginEmail: row.loginEmail || null,
      aadhaarMasked: row.aadhaarMasked || null,
      pan: row.pan.toUpperCase(),
      gstin: row.gstin.toUpperCase(),
      cin: row.cin || null,
      isMsme: row.isMsme,
      udyamNo: row.isMsme ? row.udyamNo || null : null,
      turnoverCr: row.turnoverCr,
      caUdin: row.caUdin || null,
      miiPct: Math.round(row.miiPct),
      directorName: row.directorName || null,
      directorDin: row.directorDin || null,
      registeredAddress: row.registeredAddress || null,
      tampered: false,
    },
  });
  return { bidderId };
}
