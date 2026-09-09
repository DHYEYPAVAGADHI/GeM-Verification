export type ScoredCheck = {
  key: string;
  label: string;
  source: string;
  status: "verified" | "warning" | "failed" | "pending" | "exempt";
  detail: string;
  weight: number;
  gate?: boolean;
};

const STATUS_VALUE: Record<ScoredCheck["status"], number | null> = {
  verified: 1,
  exempt: 1,
  warning: 0.5,
  pending: 0.4,
  failed: 0,
};

export type ScoreOutcome = {
  score: number;
  riskLevel: "low" | "review" | "high";
  recommendation: "Recommended" | "Review Required" | "Not Recommended";
  confidence: number;
  rationale: string;
  pending: string[];
  contributions: { key: string; label: string; delta: number }[];
};

export function computeScore(
  checks: ScoredCheck[],
  opts: { extractionConfidence: number; forensicVerdict: "clean" | "review" | "suspect" },
): ScoreOutcome {
  let weightSum = 0;
  let earned = 0;
  const contributions: ScoreOutcome["contributions"] = [];

  for (const c of checks) {
    const v = STATUS_VALUE[c.status];
    if (v === null || v === undefined) continue;
    weightSum += c.weight;
    earned += c.weight * v;
    const lost = c.weight * (1 - v);
    if (lost > 0.01) contributions.push({ key: c.key, label: c.label, delta: -Math.round(lost) });
  }

  let score = weightSum ? Math.round((earned / weightSum) * 100) : 0;

  const gateFailures = checks.filter((c) => c.gate && c.status === "failed");
  const anyFailure = checks.some((c) => c.status === "failed");
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const forensicSuspect = opts.forensicVerdict === "suspect";

  if (gateFailures.length || forensicSuspect) score = Math.min(score, 34);
  else if (anyFailure) score = Math.min(score, 62);
  else if (warningCount >= 3) score = Math.min(score, 74);

  const exemptCount = checks.filter((c) => c.status === "exempt").length;
  let recommendation: ScoreOutcome["recommendation"];
  if (gateFailures.length || forensicSuspect) recommendation = "Not Recommended";
  else if (score >= 80 && !anyFailure && warningCount <= 1 && exemptCount <= 1) recommendation = "Recommended";
  else recommendation = "Review Required";

  // risk level tracks the recommendation so every badge in the UI is consistent
  const riskLevel: ScoreOutcome["riskLevel"] =
    recommendation === "Recommended" ? "low" : recommendation === "Review Required" ? "review" : "high";

  // Confidence: extraction quality, minus penalty when the call is close to a band edge.
  let confidence = Math.round(40 + opts.extractionConfidence * 0.5);
  const edge = Math.min(Math.abs(score - 50), Math.abs(score - 80));
  if (edge < 6) confidence -= 10;
  if (gateFailures.length || opts.forensicVerdict === "suspect") confidence += 12;
  confidence = Math.max(35, Math.min(97, confidence));

  contributions.sort((a, b) => a.delta - b.delta);

  const pending = checks
    .filter((c) => c.status === "failed" || c.status === "warning")
    .map((c) => c.detail);

  const rationale = buildRationale({
    recommendation,
    score,
    gateFailures,
    contributions,
    forensicSuspect,
    exemptions: checks.filter((c) => c.status === "exempt"),
  });

  return { score, riskLevel, recommendation, confidence, rationale, pending, contributions };
}

function buildRationale(a: {
  recommendation: string;
  score: number;
  gateFailures: ScoredCheck[];
  contributions: { label: string; delta: number }[];
  forensicSuspect: boolean;
  exemptions: ScoredCheck[];
}): string {
  const parts: string[] = [];

  if (a.gateFailures.length) {
    parts.push(
      `Mandatory condition${a.gateFailures.length > 1 ? "s" : ""} not met: ${a.gateFailures
        .map((g) => g.label.toLowerCase())
        .join(", ")}.`,
    );
  }
  if (a.forensicSuspect) {
    parts.push("Document integrity analysis flags one or more submitted files as likely altered.");
  }

  const top = a.contributions.slice(0, 3).filter((c) => c.delta <= -2);
  if (top.length) {
    parts.push(
      `Points deducted mainly for: ${top.map((c) => `${c.label.toLowerCase()} (${c.delta})`).join(", ")}.`,
    );
  }

  if (a.exemptions.length) {
    parts.push(
      `MSME / DPIIT-Startup relaxations were applied to ${a.exemptions
        .map((e) => e.label.toLowerCase())
        .join(" and ")}.`,
    );
  }

  if (a.recommendation === "Recommended") {
    parts.push("All statutory registrations are independently verified and the bid meets the tender's eligibility criteria.");
  } else if (a.recommendation === "Review Required") {
    parts.push("Eligibility is broadly met; the flagged items should be put to the bidder for clarification before qualification.");
  } else {
    parts.push("On the current record the bid does not meet the tender's mandatory requirements.");
  }

  parts.push("This assessment is advisory. The qualification decision is recorded by the Procurement Officer.");
  return parts.join(" ");
}
