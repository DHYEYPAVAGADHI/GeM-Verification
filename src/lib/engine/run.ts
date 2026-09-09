import { db } from "@/lib/db";
import { extractDocument } from "./extract";
import { analyseDocument, type ForensicResult } from "./forensics";
import { gateway } from "./gateway";
import { evaluateCriterion, type BidderFacts } from "./rules";
import { computeScore, type ScoredCheck } from "./scoring";
import { appendAudit } from "./audit";
import { gstinEmbedsPan, nameSimilarity, type ExtractedFields } from "./patterns";

function guessDocType(f: ExtractedFields, text: string): string {
  const t = text.toLowerCase();
  if (f.udyam) return "UDYAM_CERT";
  if (f.gstin && /goods and services|certificate of registration/i.test(text)) return "GST_CERT";
  if (f.udin && /turnover|revenue from operations|net worth/i.test(t)) return "TURNOVER_CERT";
  if (/authoris(e|a)tion|hereby authorise|oem/i.test(t)) return "OEM_AUTH";
  if (/provident fund|ecr|electronic challan/i.test(t)) return "EPFO_ECR";
  if (/iso 9001|iso\/iec|quality management system/i.test(t)) return "ISO_CERT";
  if (/work order|completion certificate|purchase order/i.test(t)) return "WORK_ORDER";
  if (/local content|make in india|bill of materials/i.test(t)) return "MAKE_IN_INDIA";
  if (f.pan && /permanent account number|income tax/i.test(t)) return "PAN_CARD";
  return "UNKNOWN";
}

const CRITERION_GATE_TYPES = new Set(["GST_ACTIVE", "NO_DEBARMENT", "OEM_AUTH", "MSME_REGISTERED"]);

function safeEvidence(e: unknown): string | null {
  if (e == null) return null;
  try {
    const s = JSON.stringify(e);
    return s.length > 40_000 ? null : s;
  } catch {
    return null;
  }
}

function critStatusToScored(s: string): ScoredCheck["status"] {
  return s === "pass" ? "verified" : s === "warn" ? "warning" : s === "fail" ? "failed" : s === "exempt" ? "exempt" : "pending";
}

export async function runVerification(bidId: string, actor = "AI Verification Engine") {
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: {
      vendor: true,
      tender: { include: { criteria: { orderBy: { order: "asc" } }, requiredDocs: true } },
      documents: true,
      criterionResponses: true,
    },
  });
  if (!bid) throw new Error("bid not found");

  await appendAudit({
    actor,
    action: "VERIFICATION_STARTED",
    entityType: "Bid",
    entityId: bid.id,
    summary: `Verification run started for ${bid.vendor.orgName} on tender ${bid.tender.refNo}`,
  });

  /* ---------- 1. Per-document extraction + forensics ------------------- */
  const docFields: Record<string, ExtractedFields> = {};
  const forensicResults: ForensicResult[] = [];
  const confidences: number[] = [];

  for (const doc of bid.documents) {
    const bytes = Buffer.from(doc.bytes);
    const extraction = await extractDocument(bytes, doc.declaredType);
    confidences.push(extraction.confidence);
    const forensic = await analyseDocument({
      bytes,
      sha256: doc.sha256,
      fields: extraction.fields,
      bidId: bid.id,
      vendorId: bid.vendorId,
    });
    forensicResults.push(forensic);
    docFields[doc.id] = extraction.fields;

    const detectedType = guessDocType(extraction.fields, extraction.fields.raw ?? "");
    const status =
      forensic.verdict === "suspect"
        ? "DISCREPANCY"
        : !extraction.ok
          ? "FAILED"
          : forensic.verdict === "review"
            ? "DISCREPANCY"
            : "VERIFIED";

    await db.bidDocument.update({
      where: { id: doc.id },
      data: {
        detectedType,
        extractedJson: JSON.stringify({ ...extraction.fields, _meta: { confidence: extraction.confidence, pages: extraction.pages, method: extraction.method } }),
        forensicJson: JSON.stringify(forensic),
        status,
      },
    });

    await appendAudit({
      actor,
      action: "DOCUMENT_ANALYSED",
      entityType: "BidDocument",
      entityId: doc.id,
      summary: `${doc.fileName}: extracted (${extraction.confidence}% conf), integrity ${forensic.integrityScore}/100`,
      payload: { detectedType, integrity: forensic.integrityScore },
    });
  }

  const extractionConfidence = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 40;

  const worstForensic: ForensicResult["verdict"] = forensicResults.some((f) => f.verdict === "suspect")
    ? "suspect"
    : forensicResults.some((f) => f.verdict === "review")
      ? "review"
      : "clean";

  /* ---------- 2. Government source verification ----------------------- */
  const v = bid.vendor;
  const allFields = Object.values(docFields);
  const pick = <K extends keyof ExtractedFields>(k: K) =>
    allFields.map((f) => f[k]).find(Boolean) as ExtractedFields[K] | undefined;

  const [pan, gst, udyam, mca, epfo, dpiit, debar] = await Promise.all([
    gateway.pan(v.pan),
    gateway.gstin(v.gstin),
    gateway.udyam(v.udyamNo),
    gateway.mca(v.cin),
    gateway.epfo(v.epfoCode),
    gateway.dpiit(v.startupDpiit),
    gateway.debarment(v.pan, v.orgName),
  ]);

  for (const src of [pan, gst, udyam, mca, epfo, debar]) {
    await appendAudit({
      actor,
      action: "SOURCE_CHECKED",
      entityType: "Bid",
      entityId: bid.id,
      summary: `${src.source}: ${src.found ? src.status : "no record"} (${src.latencyMs}ms)`,
    });
  }

  /* ---------- 3. Assemble verified bidder facts ---------------------- */
  const turnovers = [v.turnoverY1, v.turnoverY2, v.turnoverY3].filter((x): x is number => x != null);
  const profileAvg = turnovers.length ? +(turnovers.reduce((a, b) => a + b, 0) / turnovers.length).toFixed(2) : undefined;
  const extractedTurnover = pick("turnoverCr");
  const turnoverAudited = allFields.some((f) => !!f.udin);

  // per-document forensic verdict, keyed by doc id (loop order matches bid.documents)
  const verdictByDoc = new Map<string, ForensicResult["verdict"]>();
  bid.documents.forEach((d, i) => verdictByDoc.set(d.id, forensicResults[i]?.verdict ?? "clean"));

  const experienceValues = bid.documents
    .filter((d) => ["WORK_ORDER", "EXPERIENCE"].includes(d.declaredType))
    .flatMap((d) => {
      const f = docFields[d.id];
      return f?.turnoverCr != null ? [f.turnoverCr] : [];
    });

  const isoDoc = bid.documents.find((d) => d.declaredType === "ISO_CERT");
  const oemDoc = bid.documents.find((d) => d.declaredType === "OEM_AUTH");
  const isoFields = isoDoc ? docFields[isoDoc.id] : undefined;

  const facts: BidderFacts = {
    legalName: v.orgName,
    constitution: v.constitution,
    panStatus: pan.found ? pan.status : pan.status,
    gstStatus: gst.found ? gst.status : "NOT_FOUND",
    gstFilingRegular: (gst.data as { filingRegular?: boolean } | null)?.filingRegular ?? false,
    udyamValid: udyam.found && udyam.status === "Valid",
    udyamEnterprise: (udyam.data as { enterprise?: string } | null)?.enterprise,
    mcaStatus: mca.found ? mca.status : undefined,
    epfoStatus: epfo.found ? epfo.status : "NOT_FOUND",
    epfoMemberCount: (epfo.data as { memberCount?: number } | null)?.memberCount,
    declaredEmployees: v.employees ?? undefined,
    dpiitRecognised: dpiit.found,
    debarred: debar.found,
    turnoverCrAvg: profileAvg ?? extractedTurnover,
    turnoverAudited,
    experienceMaxValueCr: experienceValues.length ? Math.max(...experienceValues) : undefined,
    localContentPct: bid.localContentPct ?? pick("localContentPct"),
    oemAuthPresent: !!oemDoc && verdictByDoc.get(oemDoc.id) !== "suspect",
    isoValidTill: isoFields?.isoValidTill ?? null,
  };

  /* ---------- 4. Build checks --------------------------------------- */
  const checks: (ScoredCheck & { detailSource?: string; evidence?: unknown })[] = [];

  checks.push({
    key: "pan",
    label: "PAN Verification",
    source: pan.source,
    weight: 6,
    gate: true,
    status: pan.found && pan.status === "ACTIVE" ? "verified" : "failed",
    detail:
      pan.found && pan.status === "ACTIVE"
        ? `PAN ${v.pan} active on the Income Tax database.`
        : `PAN ${v.pan} could not be verified as active (${pan.status}).`,
    evidence: pan.data,
  });

  checks.push({
    key: "gst",
    label: "GST Verification",
    source: gst.source,
    weight: 12,
    gate: true,
    status: gst.found && gst.status === "Active" ? ((gst.data as { filingRegular?: boolean })?.filingRegular ? "verified" : "warning") : "failed",
    detail:
      gst.found && gst.status === "Active"
        ? `GSTIN active. Last return: ${(gst.data as { lastReturnPeriod?: string })?.lastReturnPeriod ?? "n/a"}.`
        : `GSTIN status "${gst.found ? gst.status : "not found"}".`,
    evidence: gst.data,
  });

  checks.push({
    key: "udyam",
    label: "Udyam (MSME)",
    source: udyam.source,
    weight: 6,
    status: udyam.found ? "verified" : v.udyamNo ? "failed" : "verified",
    detail: udyam.found
      ? `${(udyam.data as { enterprise?: string })?.enterprise ?? "MSME"} enterprise — registration valid.`
      : v.udyamNo
        ? `Udyam number ${v.udyamNo} could not be verified on the portal.`
        : "Not registered as an MSME — no MSME benefits claimed.",
    evidence: udyam.data,
  });

  const isCompany = /\b(private limited|public limited|limited|llp)\b/i.test(v.constitution);
  checks.push({
    key: "mca",
    label: isCompany ? "MCA Registration" : "Firm Registration",
    source: isCompany ? mca.source : "Registrar of Firms",
    weight: 6,
    status: isCompany ? (mca.found && mca.status === "Active" ? "verified" : "failed") : "verified",
    detail: isCompany
      ? mca.found
        ? `Company status "${mca.status}".`
        : "Company / CIN could not be found on MCA21."
      : `${v.constitution} firm — company registration not applicable.`,
    evidence: mca.data,
  });

  checks.push({
    key: "epfo",
    label: "EPFO Compliance",
    source: epfo.source,
    weight: 10,
    status: epfo.found && epfo.status === "Active" ? "verified" : epfo.found ? "failed" : "failed",
    detail: epfo.found
      ? `Establishment status "${epfo.status}". ${(epfo.data as { memberCount?: number })?.memberCount ?? "?"} members, last ECR ${(epfo.data as { lastEcrPeriod?: string })?.lastEcrPeriod ?? "n/a"}.`
      : "No EPFO establishment record found for the declared code.",
    evidence: epfo.data,
  });

  checks.push({
    key: "debarment",
    label: "Debarment / Blacklist",
    source: debar.source,
    weight: 10,
    gate: true,
    status: debar.found ? "failed" : "verified",
    detail: debar.found
      ? `Active debarment found: ${(debar.data as unknown as { hits?: { authority: string; reason: string }[] })?.hits?.map((h) => `${h.authority} — ${h.reason}`).join("; ")}`
      : "No active debarment across CPPP and GeM sanction lists.",
    evidence: debar.data,
  });

  const worstIntegrity = Math.min(100, ...forensicResults.map((f) => f.integrityScore), 100);
  checks.push({
    key: "integrity",
    label: "Document Integrity",
    source: "Metadata & structure analysis",
    weight: 12,
    status: worstForensic === "suspect" ? "failed" : worstForensic === "review" ? "warning" : "verified",
    detail:
      worstForensic === "clean"
        ? "No tampering indicators across the submitted document set."
        : `Lowest document integrity score ${worstIntegrity}/100. ${[
            ...new Set(
              forensicResults
                .flatMap((f) => f.signals.filter((s) => s.severity === "high"))
                .map((s) => s.detail),
            ),
          ]
            .slice(0, 3)
            .join(" ")}`,
    evidence: forensicResults,
  });

  // Cross-field consistency
  const docPan = pick("pan");
  const docGst = pick("gstin");
  const docName = allFields.map((f) => f.legalName).find(Boolean);
  const embeds = gstinEmbedsPan(v.gstin, v.pan);
  const nameSim = nameSimilarity(docName, v.orgName);
  const consistencyIssues: string[] = [];
  if (docPan && docPan !== v.pan) consistencyIssues.push(`PAN on document (${docPan}) differs from profile (${v.pan}).`);
  if (docGst && docGst !== v.gstin) consistencyIssues.push(`GSTIN on document (${docGst}) differs from profile.`);
  if (embeds === false) consistencyIssues.push("Profile GSTIN does not embed the profile PAN.");
  if (nameSim != null && nameSim < 0.6) consistencyIssues.push(`Legal name on documents does not closely match "${v.orgName}".`);
  checks.push({
    key: "consistency",
    label: "Cross-field Consistency",
    source: "Documents vs profile vs portals",
    weight: 8,
    status: consistencyIssues.length ? "warning" : "verified",
    detail: consistencyIssues.length ? consistencyIssues.join(" ") : "Identifiers and legal name are consistent across documents, profile and portal records.",
  });

  /* ---------- 5. Tender eligibility criteria ------------------------ */
  const responsesByCriterion = new Map(bid.criterionResponses.map((r) => [r.criterionId, r]));
  for (const c of bid.tender.criteria) {
    const evalRes = evaluateCriterion(c, facts);
    const gate = c.mandatory && CRITERION_GATE_TYPES.has(c.type);
    checks.push({
      key: `crit_${c.id}`,
      label: c.label,
      source: "Tender eligibility rule",
      weight: c.mandatory ? 10 : 5,
      gate: gate || (c.mandatory && evalRes.status === "fail"),
      status: critStatusToScored(evalRes.status),
      detail: evalRes.detail,
      evidence: { criterionType: c.type, value: evalRes.value },
    });

    const existing = responsesByCriterion.get(c.id);
    const data = {
      evalResult: JSON.stringify(evalRes),
      complied: evalRes.status === "pass" || evalRes.status === "exempt",
    };
    if (existing) await db.bidCriterionResponse.update({ where: { id: existing.id }, data });
    else await db.bidCriterionResponse.create({ data: { bidId: bid.id, criterionId: c.id, ...data } });
  }

  /* ---------- 6. Score + persist run ------------------------------- */
  const outcome = computeScore(checks, { extractionConfidence, forensicVerdict: worstForensic });

  const run = await db.verificationRun.create({
    data: {
      bidId: bid.id,
      score: outcome.score,
      riskLevel: outcome.riskLevel,
      recommendation: outcome.recommendation,
      confidence: outcome.confidence,
      rationale: outcome.rationale,
      pendingJson: JSON.stringify(outcome.pending),
      checks: {
        create: checks.map((c, i) => ({
          key: c.key,
          label: c.label,
          source: c.source,
          status: c.status,
          detail: c.detail,
          contribution: c.weight,
          evidenceJson: safeEvidence(c.evidence),
          order: i,
        })),
      },
    },
  });

  await db.bid.update({
    where: { id: bid.id },
    data: { status: "UNDER_VERIFICATION", localContentPct: facts.localContentPct ?? bid.localContentPct },
  });

  await appendAudit({
    actor,
    action: "VERIFICATION_COMPLETED",
    entityType: "Bid",
    entityId: bid.id,
    summary: `Score ${outcome.score}/100 · ${outcome.riskLevel} risk · ${outcome.recommendation}`,
    payload: { runId: run.id, score: outcome.score },
  });

  return { runId: run.id, ...outcome };
}
