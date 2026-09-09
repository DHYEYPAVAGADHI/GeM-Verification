/**
 * Deterministic evaluation of a tender's eligibility criteria against the
 * verified facts assembled for a bidder. Also applies the MSME / DPIIT-Startup
 * statutory relaxations where the tender permits them.
 */

export type BidderFacts = {
  legalName: string;
  constitution: string;
  panStatus: string; // "ACTIVE" | "INACTIVE" | "NOT_FOUND" | "NOT_PROVIDED"
  gstStatus: string; // "Active" | "Suspended" | "Cancelled" | ...
  gstFilingRegular: boolean;
  udyamValid: boolean;
  udyamEnterprise?: string;
  mcaStatus?: string;
  epfoStatus: string;
  epfoMemberCount?: number;
  declaredEmployees?: number;
  dpiitRecognised: boolean;
  debarred: boolean;
  turnoverCrAvg?: number;
  turnoverAudited: boolean;
  experienceMaxValueCr?: number;
  localContentPct?: number;
  oemAuthPresent: boolean;
  isoValidTill?: string | null;
};

export type CriterionEval = {
  status: "pass" | "warn" | "fail" | "na" | "exempt";
  detail: string;
  value?: string;
};

type Criterion = { id: string; label: string; type: string; config: string; mandatory: boolean };

export function evaluateCriterion(c: Criterion, f: BidderFacts): CriterionEval {
  let cfg: Record<string, unknown> = {};
  try {
    cfg = JSON.parse(c.config || "{}");
  } catch {
    /* ignore */
  }
  const msmeOrStartup = f.udyamValid || f.dpiitRecognised;

  switch (c.type) {
    case "GST_ACTIVE": {
      if (f.gstStatus === "Active")
        return {
          status: f.gstFilingRegular ? "pass" : "warn",
          detail: f.gstFilingRegular
            ? "GST registration active; returns filed regularly."
            : "GST registration active, but a pattern of delayed return filing was found.",
          value: f.gstStatus,
        };
      return { status: "fail", detail: `GST registration status is "${f.gstStatus}". An active registration is mandatory.`, value: f.gstStatus };
    }

    case "MSME_REGISTERED":
      return f.udyamValid
        ? { status: "pass", detail: `Udyam registration valid (${f.udyamEnterprise ?? "MSME"}).` }
        : { status: "fail", detail: "Valid Udyam / MSME registration not found." };

    case "PF_COMPLIANCE": {
      if (f.epfoStatus !== "Active")
        return { status: "fail", detail: `EPFO establishment status is "${f.epfoStatus}".` };
      if (
        f.epfoMemberCount != null &&
        f.declaredEmployees != null &&
        f.epfoMemberCount < f.declaredEmployees * 0.8
      )
        return {
          status: "warn",
          detail: `EPFO members (${f.epfoMemberCount}) are materially below declared employees (${f.declaredEmployees}).`,
        };
      return { status: "pass", detail: "EPFO contributions current for the declared workforce." };
    }

    case "NO_DEBARMENT":
      return f.debarred
        ? { status: "fail", detail: "An active debarment / blacklisting record was found." }
        : { status: "pass", detail: "No active debarment across the searched registries." };

    case "TURNOVER_MIN": {
      const min = Number(cfg.minCr ?? 0);
      const v = f.turnoverCrAvg;
      if (v == null) return { status: "fail", detail: "No turnover evidence could be verified." };
      if (v >= min)
        return {
          status: f.turnoverAudited ? "pass" : "warn",
          detail: `3-year average turnover ₹${v} Cr ${f.turnoverAudited ? "meets" : "meets"} the ₹${min} Cr requirement${f.turnoverAudited ? "." : " but the certificate could not be authenticated (UDIN)."}`,
          value: `₹${v} Cr`,
        };
      if (msmeOrStartup && cfg.msmeRelaxable)
        return {
          status: "exempt",
          detail: `Turnover ₹${v} Cr is below ₹${min} Cr, but MSME / Startup status invokes the turnover relaxation permitted by this tender.`,
          value: `₹${v} Cr`,
        };
      return { status: "fail", detail: `3-year average turnover ₹${v} Cr is below the ₹${min} Cr requirement.`, value: `₹${v} Cr` };
    }

    case "EXPERIENCE_VALUE": {
      const min = Number(cfg.minCr ?? 0);
      const v = f.experienceMaxValueCr;
      if (v != null && v >= min)
        return { status: "pass", detail: `Highest similar work ₹${v} Cr meets the ₹${min} Cr experience threshold.`, value: `₹${v} Cr` };
      if (msmeOrStartup && cfg.startupRelaxable)
        return {
          status: "exempt",
          detail: `Experience evidence is below ₹${min} Cr, but DPIIT Startup / MSME status invokes the prior-experience relaxation per GoI procurement policy.`,
        };
      return { status: "fail", detail: `No similar work of ₹${min} Cr or above could be verified.` };
    }

    case "LOCAL_CONTENT_CLASS": {
      const want = String(cfg.class ?? "Class-II");
      const pct = f.localContentPct;
      if (pct == null)
        return { status: "warn", detail: "Local content declared but the supporting bill of materials was not verified." };
      const floor = want === "Class-I" ? 50 : 20;
      const supplierClass = pct >= 50 ? "Class-I" : pct >= 20 ? "Class-II" : "Non-local";
      if (pct < floor)
        return { status: "fail", detail: `Local content ${pct}% is below the ${want} threshold of ${floor}%.`, value: `${pct}%` };
      const borderline = pct < floor + 5;
      return {
        status: borderline ? "warn" : "pass",
        detail: borderline
          ? `Local content ${pct}% clears ${want} (${floor}%) only marginally — the bill of materials must be CA-attested.`
          : `Local content ${pct}% qualifies as a ${supplierClass} local supplier.`,
        value: `${pct}%`,
      };
    }

    case "OEM_AUTH":
      return f.oemAuthPresent
        ? { status: "pass", detail: "OEM authorisation letter provided for the quoted items." }
        : { status: "fail", detail: "Required OEM authorisation letter is missing or could not be validated." };

    case "ISO_VALID": {
      if (!f.isoValidTill)
        return { status: c.mandatory ? "fail" : "na", detail: "ISO 9001 certificate not provided." };
      const days = (new Date(f.isoValidTill).getTime() - Date.now()) / 86_400_000;
      if (days < 0) return { status: "fail", detail: "ISO certificate has expired." };
      if (days < 30) return { status: "warn", detail: `ISO certificate expires in ${Math.round(days)} days.` };
      return { status: "pass", detail: "ISO certificate valid through the tender period." };
    }

    default:
      return { status: "na", detail: "Criterion type not recognised by the engine." };
  }
}
