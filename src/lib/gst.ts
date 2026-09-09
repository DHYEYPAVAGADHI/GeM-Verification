/**
 * Structural validation for Indian statutory identifiers — mirrors
 * `backend/app/services/validators.py` so the two stacks agree.
 */

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
const CP = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const STATE_CODES = new Set(
  ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","26","27","28","29","30","31","32","33","34","35","36","37","38"],
);

export function is_valid_pan(pan?: string | null): boolean {
  return PAN_RE.test((pan ?? "").trim().toUpperCase());
}

export function gstinCheckDigit(first14: string): string {
  let factor = 2;
  let total = 0;
  const n = CP.length;
  for (let i = first14.length - 1; i >= 0; i--) {
    const cp = CP.indexOf(first14[i]);
    let addend = factor * cp;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / n) + (addend % n);
    total += addend;
  }
  return CP[(n - (total % n)) % n];
}

export function is_valid_gstin(gstin?: string | null): boolean {
  const g = (gstin ?? "").trim().toUpperCase();
  if (!GSTIN_RE.test(g)) return false;
  if (!STATE_CODES.has(g.slice(0, 2))) return false;
  return gstinCheckDigit(g.slice(0, 14)) === g[14];
}
