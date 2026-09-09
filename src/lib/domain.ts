/** Human-facing labels and tones for enum-ish domain values. */

export const bidStatusMeta: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "bg-slate-100 text-ink-soft" },
  SUBMITTED: { label: "Submitted", tone: "bg-brand-50 text-brand-700" },
  UNDER_VERIFICATION: { label: "Under Verification", tone: "bg-brand-50 text-brand-700" },
  CLARIFICATION_REQUESTED: { label: "Clarification Requested", tone: "bg-risk-review-bg text-risk-review" },
  TECHNICAL_EVALUATION: { label: "Technical Evaluation", tone: "bg-brand-50 text-brand-700" },
  QUALIFIED: { label: "Qualified", tone: "bg-risk-low-bg text-risk-low" },
  DISQUALIFIED: { label: "Disqualified", tone: "bg-risk-high-bg text-risk-high" },
  WITHDRAWN: { label: "Withdrawn", tone: "bg-slate-100 text-ink-muted" },
};

export const docStatusMeta: Record<string, { label: string; tone: string }> = {
  UPLOADED: { label: "Uploaded", tone: "bg-slate-100 text-ink-soft" },
  EXTRACTED: { label: "Extracted", tone: "bg-brand-50 text-brand-700" },
  VERIFIED: { label: "Verified", tone: "bg-risk-low-bg text-risk-low" },
  DISCREPANCY: { label: "Discrepancy", tone: "bg-risk-high-bg text-risk-high" },
  FAILED: { label: "Failed", tone: "bg-risk-high-bg text-risk-high" },
};

export const checkStatusMeta: Record<
  string,
  { label: string; text: string; bg: string }
> = {
  verified: { label: "Verified", text: "text-risk-low", bg: "bg-risk-low-bg" },
  warning: { label: "Needs Review", text: "text-risk-review", bg: "bg-risk-review-bg" },
  failed: { label: "Failed", text: "text-risk-high", bg: "bg-risk-high-bg" },
  pending: { label: "Pending", text: "text-ink-muted", bg: "bg-slate-100" },
  exempt: { label: "Exempt (relaxation)", text: "text-brand-700", bg: "bg-brand-50" },
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  GST_CERT: "GST Registration Certificate",
  UDYAM_CERT: "Udyam / MSME Certificate",
  PAN_CARD: "PAN",
  TURNOVER_CERT: "CA-certified Turnover Statement",
  OEM_AUTH: "OEM Authorisation Letter",
  WORK_ORDER: "Work Order / Completion Certificate",
  ISO_CERT: "ISO 9001 Certificate",
  EPFO_ECR: "EPFO ECR",
  MAKE_IN_INDIA: "Local Content Declaration",
  EXPERIENCE: "Prior Experience",
  UNKNOWN: "Unclassified document",
};

export const tenderStatusMeta: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "bg-slate-100 text-ink-soft" },
  PUBLISHED: { label: "Open for bids", tone: "bg-risk-low-bg text-risk-low" },
  CLOSED: { label: "Closed", tone: "bg-slate-100 text-ink-muted" },
  UNDER_EVALUATION: { label: "Under evaluation", tone: "bg-brand-50 text-brand-700" },
  AWARDED: { label: "Awarded", tone: "bg-risk-low-bg text-risk-low" },
};

export const CRITERION_TYPE_LABEL: Record<string, string> = {
  TURNOVER_MIN: "Financial capacity",
  EXPERIENCE_VALUE: "Prior experience",
  LOCAL_CONTENT_CLASS: "Make in India / local content",
  GST_ACTIVE: "GST registration",
  PF_COMPLIANCE: "EPFO / labour compliance",
  NO_DEBARMENT: "Debarment screening",
  OEM_AUTH: "OEM authorisation",
  MSME_REGISTERED: "MSME registration",
  ISO_VALID: "Quality certification",
};

export const WIZARD_STEPS = [
  { n: 1, key: "eligibility", label: "Eligibility & compliance" },
  { n: 2, key: "technical", label: "Technical bid" },
  { n: 3, key: "financial", label: "Financial bid" },
  { n: 4, key: "emd", label: "EMD" },
  { n: 5, key: "documents", label: "Documents" },
  { n: 6, key: "declarations", label: "Declarations" },
  { n: 7, key: "submit", label: "Review & submit" },
] as const;
