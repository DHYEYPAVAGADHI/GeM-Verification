import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { extractDocument } from "@/lib/engine/extract";
import { lookupRegistry, type RegistryRecord } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_BYTES = 12 * 1024 * 1024;

/** Guess a document class from the fields the extractor recovered. */
function detectType(f: {
  gstin?: string;
  pan?: string;
  udyam?: string;
  udin?: string;
  turnoverCr?: number;
  localContentPct?: number;
}): string {
  if (f.udyam) return "Udyam / MSME Certificate";
  if (f.udin || f.turnoverCr !== undefined) return "CA Turnover Statement";
  if (f.gstin) return "GST Registration Certificate";
  if (f.localContentPct !== undefined) return "Local Content Declaration";
  if (f.pan) return "PAN Card";
  return "Unclassified";
}

export type BulkExtractRow = {
  id: string;
  fileName: string;
  sizeKb: number;
  ok: boolean;
  confidence: number;
  pages: number;
  detectedType: string;
  fields: {
    companyName?: string;
    pan?: string;
    gstin?: string;
    udyam?: string;
    cin?: string;
    udin?: string;
    turnoverCr?: number;
  };
  match: null | {
    bidderId: string;
    companyName: string;
    isMsme: boolean;
    udyamNo: string;
    registryTurnoverCr: number;
    directorDin: string;
    directorName: string;
    tampered: boolean;
  };
  eligible: boolean;
  notes: string[];
};

async function processFile(file: File): Promise<BulkExtractRow> {
  const id = nanoid(8);
  const base: BulkExtractRow = {
    id,
    fileName: file.name || "document.pdf",
    sizeKb: Math.round((file.size / 1024) * 10) / 10,
    ok: false,
    confidence: 0,
    pages: 0,
    detectedType: "Unclassified",
    fields: {},
    match: null,
    eligible: false,
    notes: [],
  };

  if (file.size === 0) {
    base.notes.push("Empty file — nothing to read.");
    return base;
  }
  if (file.size > MAX_FILE_BYTES) {
    base.notes.push(`Exceeds ${MAX_FILE_BYTES / (1024 * 1024)} MB limit.`);
    return base;
  }

  let extraction;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    extraction = await extractDocument(bytes);
  } catch (err) {
    base.notes.push(err instanceof Error ? err.message : "Could not read document.");
    return base;
  }

  const f = extraction.fields;
  base.ok = extraction.ok;
  base.confidence = extraction.confidence;
  base.pages = extraction.pages;
  base.detectedType = detectType(f);
  base.fields = {
    companyName: f.legalName,
    pan: f.pan,
    gstin: f.gstin,
    udyam: f.udyam,
    cin: f.cin,
    udin: f.udin,
    turnoverCr: f.turnoverCr,
  };

  if (!extraction.ok) {
    base.notes.push(
      extraction.error === "not a PDF — text extraction skipped"
        ? "Not a readable PDF — upload a text-based PDF scan."
        : "No text layer found — document could not be auto-read.",
    );
    return base;
  }

  if (!f.pan && !f.gstin) {
    base.notes.push("No PAN or GSTIN found — cannot match to a registered entity.");
    return base;
  }

  let rec: RegistryRecord | null = null;
  try {
    rec = await lookupRegistry({ pan: f.pan, gstin: f.gstin });
  } catch {
    base.notes.push("Registry unavailable — identity not verified.");
    return base;
  }

  if (!rec) {
    base.notes.push("Identity not found in the national registry.");
    return base;
  }

  base.match = {
    bidderId: rec.bidderId,
    companyName: rec.companyName,
    isMsme: rec.isMsme,
    udyamNo: rec.udyamNo,
    registryTurnoverCr: rec.turnoverCr,
    directorDin: rec.directorDin,
    directorName: rec.directorName,
    tampered: rec.tampered,
  };
  if (!base.fields.companyName) base.fields.companyName = rec.companyName;

  // A matched entity is eligible for the tender unless the registry flags it.
  base.eligible = true;

  if (rec.tampered) {
    base.eligible = false;
    base.notes.push("Registry tamper flag set — refer to forensic review.");
  }
  if (rec.isMsme && rec.udyamNo && rec.udyamNo !== "NA") {
    base.notes.push("Udyam-verified MSE — EMD exemption applies.");
  }
  // Cross-check the turnover the officer would otherwise read by hand.
  if (f.turnoverCr !== undefined && rec.turnoverCr > 0) {
    const diff = Math.abs(f.turnoverCr - rec.turnoverCr) / rec.turnoverCr;
    if (diff > 0.05) {
      base.eligible = false;
      base.notes.push(
        `Turnover mismatch — document ₹${f.turnoverCr} Cr vs registry ₹${rec.turnoverCr} Cr.`,
      );
    }
  }

  return base;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const files = form.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }
  if (files.length > 100) {
    return NextResponse.json({ error: "Upload at most 100 PDFs at a time." }, { status: 413 });
  }

  const rows = await Promise.all(files.map(processFile));

  const matched = rows.filter((r) => r.match).length;
  const eligible = rows.filter((r) => r.eligible).length;
  const distinctBidders = new Set(rows.filter((r) => r.match).map((r) => r.match!.bidderId)).size;

  return NextResponse.json({
    count: rows.length,
    matched,
    eligible,
    distinctBidders,
    rows,
  });
}
