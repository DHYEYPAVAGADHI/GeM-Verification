/**
 * Deterministic structured-field extraction from OCR / PDF text.
 * These patterns follow the real formats issued by the respective authorities.
 */

export const RX = {
  pan: /\b([A-Z]{5}[0-9]{4}[A-Z])\b/,
  gstin: /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z])\b/,
  udyam: /\b(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})\b/,
  cin: /\b([UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b/,
  udin: /\bUDIN[:\s-]*([0-9]{2}[A-Z0-9]{16})\b/i,
  din: /\bDIN[:\s-]*([0-9]{8})\b/i,
  dpiit: /\b(DIPP[0-9]{4,6})\b/,
  epfoCode: /\b([A-Z]{2}\/[A-Z]{3}\/[0-9]{7}\/[0-9]{3})\b/,
  date: /\b([0-3]?\d[\/\-.](?:[01]?\d)[\/\-.](?:20\d{2}))\b/g,
  validUntil: /valid\s*(?:until|till|upto|up to)\s*[:\-]?\s*([0-3]?\d[\/\-.][01]?\d[\/\-.]20\d\d)/i,
  amountCr: /(?:₹|rs\.?|inr)?\s*([0-9]{1,4}(?:[.,][0-9]{1,2})?)\s*(?:cr|crore)/i,
  amountLakh: /(?:₹|rs\.?|inr)?\s*([0-9]{1,5}(?:[.,][0-9]{1,2})?)\s*(?:lakh|lac)/i,
  percent: /\b([0-9]{1,3}(?:\.[0-9]+)?)\s*%/,
  qrPayload: /QR-PAYLOAD:\s*(\{.*\})/,
};

export type ExtractedFields = {
  pan?: string;
  gstin?: string;
  udyam?: string;
  cin?: string;
  udin?: string;
  dins?: string[];
  dpiit?: string;
  epfoCode?: string;
  legalName?: string;
  dates?: string[];
  isoValidTill?: string; // ISO yyyy-mm-dd
  turnoverCr?: number;
  localContentPct?: number;
  qrPayload?: Record<string, unknown> | null;
  raw?: string;
};

function num(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export function parseFields(text: string, docType?: string): ExtractedFields {
  const t = text.replace(/ /g, " ");
  const out: ExtractedFields = { raw: text.slice(0, 4000) };

  out.pan = RX.pan.exec(t)?.[1];
  out.gstin = RX.gstin.exec(t)?.[1];
  out.udyam = RX.udyam.exec(t)?.[1];
  out.cin = RX.cin.exec(t)?.[1];
  out.udin = RX.udin.exec(t)?.[1];
  out.dpiit = RX.dpiit.exec(t)?.[1];
  out.epfoCode = RX.epfoCode.exec(t)?.[1];

  const dins = new Set<string>();
  let m: RegExpExecArray | null;
  const dinRx = new RegExp(RX.din.source, "gi");
  while ((m = dinRx.exec(t))) dins.add(m[1]);
  if (dins.size) out.dins = [...dins];

  const dates = new Set<string>();
  const dRx = new RegExp(RX.date.source, "g");
  while ((m = dRx.exec(t))) dates.add(m[1]);
  if (dates.size) out.dates = [...dates];

  const vu = RX.validUntil.exec(t)?.[1];
  if (vu) {
    const [d, mo, y] = vu.split(/[\/\-.]/).map(Number);
    if (d && mo && y) out.isoValidTill = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const cr = num(RX.amountCr.exec(t)?.[1]);
  const lakh = num(RX.amountLakh.exec(t)?.[1]);
  if (cr !== undefined) out.turnoverCr = cr;
  else if (lakh !== undefined) out.turnoverCr = +(lakh / 100).toFixed(3);

  if (docType === "MAKE_IN_INDIA" || docType === "BOM" || /local content/i.test(t)) {
    const p = num(RX.percent.exec(t)?.[1]);
    if (p !== undefined) out.localContentPct = p;
  }

  // "Legal Name / Trade Name : Foo Bar Pvt Ltd"
  const nameLine =
    /(?:legal name|trade name|name of (?:enterprise|firm|company|taxpayer))\s*[:\-]\s*([A-Z][A-Za-z0-9&.,()\- ]{3,80})/i.exec(
      t,
    );
  if (nameLine) out.legalName = nameLine[1].trim().replace(/\s{2,}/g, " ");

  const qr = RX.qrPayload.exec(t)?.[1];
  if (qr) {
    try {
      out.qrPayload = JSON.parse(qr);
    } catch {
      out.qrPayload = null;
    }
  }

  return out;
}

/** GSTIN embeds the PAN at characters 3–12. */
export function gstinEmbedsPan(gstin?: string, pan?: string): boolean | null {
  if (!gstin || !pan) return null;
  return gstin.slice(2, 12) === pan;
}

/** Loose name similarity for cross-document matching (0..1). */
export function nameSimilarity(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const norm = (s: string) =>
    s
      .toUpperCase()
      .replace(/\b(PVT|PRIVATE|LTD|LIMITED|LLP|CO|COMPANY|ENTERPRISES?|INDUSTRIES|AND|&)\b/g, "")
      .replace(/[^A-Z0-9]/g, "");
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const shorter = x.length < y.length ? x : y;
  const longer = x.length < y.length ? y : x;
  let hits = 0;
  for (let i = 0; i < shorter.length; i++) if (longer.includes(shorter[i])) hits++;
  return +(hits / longer.length).toFixed(2);
}
