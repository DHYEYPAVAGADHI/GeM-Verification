import { db } from "@/lib/db";
import { gateway } from "./gateway";
import { evaluateCriterion, type BidderFacts, type CriterionEval } from "./rules";

/**
 * Pre-bid eligibility check — runs the tender's rules against the vendor's
 * profile + live government data, before any documents are uploaded.
 */
export async function previewEligibility(vendorId: string, tenderId: string) {
  const [profile, tender] = await Promise.all([
    db.vendorProfile.findUnique({ where: { id: vendorId } }),
    db.tender.findUnique({ where: { id: tenderId }, include: { criteria: { orderBy: { order: "asc" } } } }),
  ]);
  if (!profile || !tender) return null;

  const [pan, gst, udyam, epfo, dpiit, debar] = await Promise.all([
    gateway.pan(profile.pan),
    gateway.gstin(profile.gstin),
    gateway.udyam(profile.udyamNo),
    gateway.epfo(profile.epfoCode),
    gateway.dpiit(profile.startupDpiit),
    gateway.debarment(profile.pan, profile.orgName),
  ]);

  const avg =
    [profile.turnoverY1, profile.turnoverY2, profile.turnoverY3].filter((x): x is number => x != null).reduce((a, b) => a + b, 0) /
    3;

  const facts: BidderFacts = {
    legalName: profile.orgName,
    constitution: profile.constitution,
    panStatus: pan.status,
    gstStatus: gst.found ? gst.status : "NOT_FOUND",
    gstFilingRegular: (gst.data as { filingRegular?: boolean } | null)?.filingRegular ?? false,
    udyamValid: udyam.found && udyam.status === "Valid",
    udyamEnterprise: (udyam.data as { enterprise?: string } | null)?.enterprise,
    epfoStatus: epfo.found ? epfo.status : "NOT_FOUND",
    epfoMemberCount: (epfo.data as { memberCount?: number } | null)?.memberCount,
    declaredEmployees: profile.employees ?? undefined,
    dpiitRecognised: dpiit.found,
    debarred: debar.found,
    turnoverCrAvg: Number.isFinite(avg) ? +avg.toFixed(2) : undefined,
    turnoverAudited: true,
    experienceMaxValueCr: undefined, // proven with documents at bid time
    localContentPct: undefined,
    oemAuthPresent: false,
    isoValidTill: null,
  };

  const results: { label: string; type: string; mandatory: boolean; eval: CriterionEval }[] = tender.criteria.map((c) => ({
    label: c.label,
    type: c.type,
    mandatory: c.mandatory,
    eval: evaluateCriterion(c, facts),
  }));

  const met = results.filter((r) => r.eval.status === "pass" || r.eval.status === "exempt").length;
  const blockers = results.filter((r) => r.mandatory && r.eval.status === "fail").length;

  return { results, met, total: results.length, blockers };
}
