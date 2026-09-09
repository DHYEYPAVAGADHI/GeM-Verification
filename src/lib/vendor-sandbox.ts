/**
 * Vendor verification & self-registration — talks to the FastAPI sandbox
 * ( backend/app/routers/vendor_sandbox.py ), no JWT.
 *
 *   verifyVendor(identifier)  → POST /v1/sandbox/vendor/verify
 *   registerVendor(FormData)  → POST /v1/sandbox/vendor/register  (multipart)
 */
import { ENGINE_URL } from "@/lib/public-tenders";

export type VendorRecord = {
  exists: true;
  bidder_id: string;
  company_name: string;
  pan_number: string;
  gstin: string;
  cin_number: string;
  is_msme: boolean;
  udyam_reg_no: string;
  fy_turnover_cr: number;
  ca_udin: string;
  mii_percentage: number;
  director_name: string;
  director_din: string;
  registered_address: string;
  tampered_flag: boolean;
  aadhaar_number: string;
};

export type VendorNotFound = { exists: false; message: string };

export type RegisterSuccess = {
  status: "success";
  bidder_id: string;
  company_name: string;
  message: string;
};

/** Standard 10-char PAN — 5 letters, 4 digits, 1 letter. */
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** The PAN a GSTIN embeds (characters 3–12). */
export const panFromGstin = (gstin: string) => gstin.trim().toUpperCase().slice(2, 12);

export function classifyIdentifier(raw: string): "pan" | "gstin" | "invalid" {
  const v = raw.trim().toUpperCase();
  if (v.length === 10 && PAN_RE.test(v)) return "pan";
  if (v.length === 15 && GSTIN_RE.test(v)) return "gstin";
  return "invalid";
}

export async function verifyVendor(
  identifier: string,
): Promise<{ ok: true; record: VendorRecord } | { ok: false; data: VendorNotFound }> {
  const res = await fetch(`${ENGINE_URL}/v1/sandbox/vendor/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: identifier.trim().toUpperCase() }),
  });

  if (res.ok) return { ok: true, record: (await res.json()) as VendorRecord };

  if (res.status === 404) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail ?? body;
    return {
      ok: false,
      data: {
        exists: false,
        message:
          detail?.message ??
          "No entity found with this PAN/GSTIN in the national mock registry.",
      },
    };
  }

  const err = await res.json().catch(() => null);
  throw new Error(err?.detail ?? `Verification failed (${res.status}).`);
}

export async function registerVendor(form: FormData): Promise<RegisterSuccess> {
  const res = await fetch(`${ENGINE_URL}/v1/sandbox/vendor/register`, {
    method: "POST",
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : null;
    throw new Error(detail ?? `Registration failed (${res.status}).`);
  }
  return body as RegisterSuccess;
}

/** Stash the verified identity so the tender application screen can pre-fill. */
export function rememberVerifiedBidder(bidderId: string, tenderId: string) {
  try {
    sessionStorage.setItem(
      "gem:verified-bidder",
      JSON.stringify({ bidderId, tenderId, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}
