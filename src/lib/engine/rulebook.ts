/**
 * A plain-language mirror of the verification engine's rules, weights and
 * thresholds — the single source for the read-only "Rules Engine" console.
 *
 * Keep in sync with:
 *   - run.ts        (per-check weights, gate flags)
 *   - rules.ts      (criterion evaluation + relaxations)
 *   - scoring.ts    (score caps, recommendation bands, confidence)
 *   - forensics.ts  (integrity deductions, verdict bands)
 */

export const engineChecks = [
  { key: "pan", label: "PAN Verification", source: "Income Tax / NSDL", weight: 6, gate: true, note: "PAN must be present and ACTIVE." },
  { key: "gst", label: "GST Verification", source: "GSTN", weight: 12, gate: true, note: "GSTIN must be active; irregular filing → warning." },
  { key: "udyam", label: "Udyam (MSME)", source: "Udyam Registration Portal", weight: 6, gate: false, note: "If an Udyam number is claimed it must verify." },
  { key: "mca", label: "MCA / Firm Registration", source: "MCA21", weight: 6, gate: false, note: "Companies must be ACTIVE on MCA21; firms exempt." },
  { key: "epfo", label: "EPFO Compliance", source: "EPFO", weight: 10, gate: false, note: "Establishment must be active for the declared code." },
  { key: "debarment", label: "Debarment / Blacklist", source: "CPPP + GeM Sanctions", weight: 10, gate: true, note: "Any active debarment is disqualifying." },
  { key: "integrity", label: "Document Integrity", source: "Forensics engine", weight: 12, gate: false, note: "Forensic verdict of the submitted documents." },
  { key: "consistency", label: "Cross-field Consistency", source: "Reconciliation engine", weight: 8, gate: false, note: "Document values vs profile vs government portals." },
  { key: "criterion*", label: "Per tender-eligibility rule", source: "Rule evaluator", weight: 10, gate: false, note: "Mandatory rule = weight 10, non-mandatory = weight 5." },
] as const;

export const criterionTypes = [
  { type: "GST_ACTIVE", label: "GST registration", checks: "GSTIN active and filing regular", relaxation: "—" },
  { type: "MSME_REGISTERED", label: "MSME registration", checks: "Valid Udyam registration", relaxation: "—" },
  { type: "PF_COMPLIANCE", label: "EPFO / labour compliance", checks: "Active EPFO establishment", relaxation: "MSME / Startup" },
  { type: "NO_DEBARMENT", label: "Debarment screening", checks: "No active debarment on CPPP / GeM", relaxation: "—" },
  { type: "TURNOVER_MIN", label: "Financial capacity", checks: "3-yr avg turnover ≥ threshold", relaxation: "MSME / Startup" },
  { type: "EXPERIENCE_VALUE", label: "Prior experience", checks: "Single work order ≥ threshold value", relaxation: "Startup" },
  { type: "LOCAL_CONTENT_CLASS", label: "Make in India / local content", checks: "Declared local content meets the tender's class", relaxation: "—" },
  { type: "OEM_AUTH", label: "OEM authorisation", checks: "Valid, untampered OEM authorisation letter", relaxation: "—" },
  { type: "ISO_VALID", label: "Quality certification", checks: "ISO certificate valid on the bid date", relaxation: "—" },
] as const;

export const forensicSignals = [
  { signal: "Editor fingerprint in producer metadata", deduction: "−35", catches: "Photoshop / GIMP / Illustrator touched the file" },
  { signal: "Creation → modification date delta", deduction: "−1 / day (max −20)", catches: "Certificate edited after issue" },
  { signal: "Incremental-save markers", deduction: "−12 / save", catches: "Edits layered into the PDF after issue" },
  { signal: "QR payload vs printed field mismatch", deduction: "−30", catches: "Visible numbers changed, QR code left intact" },
  { signal: "Byte-identical file across bidders", deduction: "−30", catches: "Same document submitted by competing firms" },
  { signal: "Shared non-institutional metadata author", deduction: "−15", catches: "Documents all prepared by one hand" },
] as const;

export const forensicBands = [
  { verdict: "clean", range: "≥ 80", effect: "No score impact." },
  { verdict: "review", range: "55 – 79", effect: "Feeds the Document Integrity check as a warning." },
  { verdict: "suspect", range: "< 55", effect: "Caps the compliance score at 34 → Not Recommended." },
] as const;

export const scoreCaps = [
  { when: "A mandatory (gate) check fails — PAN, GST or debarment", cap: "34", result: "Not Recommended" },
  { when: "Document forensics returns a “suspect” verdict", cap: "34", result: "Not Recommended" },
  { when: "Any non-gate check fails", cap: "62", result: "Review Required" },
  { when: "Three or more checks raise a warning", cap: "74", result: "Review Required" },
] as const;

export const recommendationBands = [
  { band: "Recommended", rule: "Score ≥ 80, no failed checks, ≤ 1 warning, ≤ 1 exemption, no gate failure" },
  { band: "Review Required", rule: "Eligibility broadly met but flagged items remain — put to the bidder for clarification" },
  { band: "Not Recommended", rule: "A gate check failed or forensics flagged tampering" },
] as const;

export const statusValues = [
  { status: "verified / exempt", value: "100% of weight", note: "Exempt = a relaxation was correctly applied" },
  { status: "warning", value: "50% of weight", note: "Met with a caveat that needs officer attention" },
  { status: "pending", value: "40% of weight", note: "Could not be conclusively resolved" },
  { status: "failed", value: "0% of weight", note: "Requirement not met" },
] as const;

export const confidenceModel = {
  base: "40 + (document extraction confidence × 0.5)",
  adjustments: [
    "−10 when the score sits within 6 points of a band edge (50 or 80)",
    "+12 when a gate fails or forensics is suspect (a confident negative)",
    "clamped to the 35 – 97 range",
  ],
};
