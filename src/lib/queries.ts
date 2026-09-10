import { db } from "./db";
import { riskFromScore } from "./utils";

const runInclude = {
  runs: {
    orderBy: { startedAt: "desc" as const },
    take: 1,
    include: { checks: { orderBy: { order: "asc" as const } } },
  },
};

export type BidRow = Awaited<ReturnType<typeof getBids>>[number];

export async function getBids(where: Record<string, unknown> = {}) {
  const bids = await db.bid.findMany({
    where: { status: { not: "DRAFT" }, ...where },
    include: {
      vendor: true,
      tender: true,
      decision: true,
      ...runInclude,
      _count: { select: { documents: true, clarifications: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
  return bids.map((b) => ({ ...b, run: b.runs[0] ?? null }));
}

export async function getBid(id: string) {
  const bid = await db.bid.findUnique({
    where: { id },
    include: {
      vendor: { include: { documents: true } },
      tender: { include: { criteria: { orderBy: { order: "asc" } }, requiredDocs: { orderBy: { order: "asc" } } } },
      documents: { orderBy: { uploadedAt: "asc" } },
      criterionResponses: true,
      declarations: true,
      decision: true,
      clarifications: { orderBy: { createdAt: "desc" } },
      runs: { orderBy: { startedAt: "desc" }, include: { checks: { orderBy: { order: "asc" } } } },
    },
  });
  if (!bid) return null;
  return { ...bid, run: bid.runs[0] ?? null };
}

export async function getDashboardStats() {
  const bids = await getBids();
  const scored = bids.filter((b) => b.run);
  const buckets = { low: 0, review: 0, high: 0 };
  let scoreSum = 0;
  for (const b of scored) {
    const rec = b.run!.recommendation;
    if (rec === "Recommended") buckets.low++;
    else if (rec === "Not Recommended") buckets.high++;
    else buckets.review++;
    scoreSum += b.run!.score;
  }
  const pendingClar = bids.filter((b) => b.status === "CLARIFICATION_REQUESTED").length;
  return {
    totalBids: bids.length,
    scored: scored.length,
    low: buckets.low,
    review: buckets.review,
    high: buckets.high,
    avgScore: scored.length ? Math.round(scoreSum / scored.length) : 0,
    decided: bids.filter((b) => b.decision).length,
    pendingClar,
    distribution: [
      { label: "Recommended", value: buckets.low, color: "#15803d" },
      { label: "Review Required", value: buckets.review, color: "#b45309" },
      { label: "Not Recommended", value: buckets.high, color: "#b91c1c" },
    ],
  };
}

/** Shared directors / addresses across bidders on the same tender. */
export async function getCartelLinks(bidId: string) {
  const bid = await db.bid.findUnique({ where: { id: bidId }, include: { vendor: true } });
  if (!bid) return [];
  const coBids = await db.bid.findMany({
    where: { tenderId: bid.tenderId, id: { not: bidId }, status: { not: "DRAFT" } },
    include: { vendor: true },
  });

  const mine = bid.vendor.cin ? await db.govMca.findUnique({ where: { cin: bid.vendor.cin } }) : null;
  const myDins: { din: string; name: string }[] = mine ? JSON.parse(mine.directors) : [];
  const myAddr = normalise(bid.vendor.registeredAddress);

  const links: { vendor: string; via: string; detail: string }[] = [];
  for (const cb of coBids) {
    const theirMca = cb.vendor.cin ? await db.govMca.findUnique({ where: { cin: cb.vendor.cin } }) : null;
    const theirDins: { din: string; name: string }[] = theirMca ? JSON.parse(theirMca.directors) : [];
    const sharedDin = myDins.filter((d) => theirDins.some((t) => t.din === d.din));
    if (sharedDin.length)
      links.push({
        vendor: cb.vendor.orgName,
        via: "Shared director",
        detail: `DIN ${sharedDin.map((d) => d.din).join(", ")} (${sharedDin.map((d) => d.name).join(", ")})`,
      });
    if (myAddr && normalise(cb.vendor.registeredAddress) === myAddr)
      links.push({ vendor: cb.vendor.orgName, via: "Shared address", detail: cb.vendor.registeredAddress });
  }
  return links;
}

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function getBidAudit(bidId: string) {
  const docs = await db.bidDocument.findMany({ where: { bidId }, select: { id: true } });
  const ids = [bidId, ...docs.map((d) => d.id)];
  return db.auditEntry.findMany({ where: { entityId: { in: ids } }, orderBy: { seq: "asc" } });
}

export async function getRiskFactors() {
  const failing = await db.check.findMany({
    where: { status: { in: ["failed", "warning"] } },
    select: { label: true, status: true },
  });
  const map = new Map<string, number>();
  for (const c of failing) map.set(c.label, (map.get(c.label) ?? 0) + 1);
  return [...map.entries()]
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

export async function getAuditEntries(take = 60) {
  return db.auditEntry.findMany({ orderBy: { seq: "desc" }, take });
}

/* ---------------------------- vendor side ---------------------------- */

export async function getVendorContext(vendorId: string) {
  const profile = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    include: { documents: { orderBy: { uploadedAt: "desc" } } },
  });
  if (!profile) return null;
  const bids = await db.bid.findMany({
    where: { vendorId },
    include: { tender: true, decision: true, clarifications: true, ...runInclude },
    orderBy: { updatedAt: "desc" },
  });
  return { profile, bids: bids.map((b) => ({ ...b, run: b.runs[0] ?? null })) };
}

export async function getOpenTenders() {
  return db.tender.findMany({
    where: { status: { in: ["PUBLISHED", "UNDER_EVALUATION"] } },
    include: { criteria: true, requiredDocs: true, _count: { select: { bids: true } } },
    orderBy: { closeDate: "asc" },
  });
}

export async function getTenderForVendor(id: string) {
  return db.tender.findUnique({
    where: { id },
    include: {
      criteria: { orderBy: { order: "asc" } },
      requiredDocs: { orderBy: { order: "asc" } },
    },
  });
}

/** Profile readiness: fraction of core registrations present + docs not expired. */
export function profileReadiness(profile: {
  pan: string;
  gstin: string;
  udyamNo: string | null;
  epfoCode: string | null;
  turnoverY3: number | null;
  bankAccount: string | null;
  documents: { expiryDate: Date | null }[];
}) {
  const checks = [
    !!profile.pan,
    !!profile.gstin,
    !!profile.udyamNo,
    !!profile.epfoCode,
    profile.turnoverY3 != null,
    !!profile.bankAccount,
    profile.documents.length >= 4,
    !profile.documents.some((d) => d.expiryDate && d.expiryDate < new Date()),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/* ----------------------- officer: tender rosters --------------------- */

/** Tenders that have received at least one real bid, with a bid tally. */
export async function getTendersWithBids() {
  const tenders = await db.tender.findMany({
    include: {
      bids: {
        where: { status: { notIn: ["DRAFT", "WITHDRAWN"] } },
        select: { id: true, status: true, decision: { select: { verdict: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return tenders
    .map((t) => ({
      id: t.id,
      refNo: t.refNo,
      title: t.title,
      buyer: t.buyer,
      closeDate: t.closeDate,
      total: t.bids.length,
      decided: t.bids.filter((b) => b.decision).length,
      qualified: t.bids.filter((b) => b.decision?.verdict === "QUALIFIED").length,
      disqualified: t.bids.filter((b) => b.decision?.verdict === "DISQUALIFIED").length,
    }))
    .filter((t) => t.total > 0);
}

export type RosterRow = NonNullable<Awaited<ReturnType<typeof getTenderRoster>>>["rows"][number];

/**
 * Everything the officer needs to clear one tender in a single pass:
 * one row per company that bid, each already scored by the engine,
 * with tamper/cartel flags and its consolidated-document count.
 */
export async function getTenderRoster(tenderId: string) {
  const tender = await db.tender.findUnique({ where: { id: tenderId } });
  if (!tender) return null;

  const bids = await db.bid.findMany({
    where: { tenderId, status: { notIn: ["DRAFT", "WITHDRAWN"] } },
    include: {
      vendor: true,
      decision: true,
      _count: { select: { documents: true } },
      ...runInclude,
    },
    orderBy: { submittedAt: "asc" },
  });

  const rows = await Promise.all(
    bids.map(async (b) => {
      const run = b.runs[0] ?? null;
      const checks = run?.checks ?? [];
      const failed = checks.filter((c) => c.status === "failed");
      const warned = checks.filter((c) => c.status === "warning");
      const cartel = await getCartelLinks(b.id);
      return {
        bidId: b.id,
        org: b.vendor.orgName,
        pan: b.vendor.pan,
        gstin: b.vendor.gstin,
        sector: b.vendor.sector,
        state: b.vendor.state,
        msme: !!b.vendor.udyamNo,
        submittedAt: b.submittedAt,
        docCount: b._count.documents,
        status: b.status,
        score: run?.score ?? null,
        recommendation: run?.recommendation ?? null,
        confidence: run?.confidence ?? null,
        rationale: run?.rationale ?? null,
        flags: {
          gate: failed.some((c) => ["pan", "gst", "debarment"].includes(c.key)),
          forensic: [...failed, ...warned].some((c) => c.key === "integrity"),
          debarment: failed.some((c) => c.key === "debarment"),
          cartel: cartel.length > 0,
          failedCount: failed.length,
          warnCount: warned.length,
        },
        cartelLinks: cartel,
        decision: b.decision
          ? { verdict: b.decision.verdict, reason: b.decision.reason, decidedAt: b.decision.decidedAt }
          : null,
      };
    }),
  );

  const pendingWithClearReco = rows.filter(
    (r) => !r.decision && (r.recommendation === "Recommended" || r.recommendation === "Not Recommended"),
  ).length;

  return {
    tender: { id: tender.id, refNo: tender.refNo, title: tender.title, buyer: tender.buyer, closeDate: tender.closeDate },
    rows,
    summary: {
      total: rows.length,
      decided: rows.filter((r) => r.decision).length,
      recommended: rows.filter((r) => r.recommendation === "Recommended").length,
      review: rows.filter((r) => r.recommendation === "Review Required").length,
      notRecommended: rows.filter((r) => r.recommendation === "Not Recommended").length,
      pendingWithClearReco,
    },
  };
}

/* --------------------------- notifications -------------------------- */

/* ------------------- analytics: source reliability ------------------ */

/**
 * Per government source: how many checks it has answered across every
 * verification run, and how those resolved. Backed by the real `Check` rows
 * the engine persists (each carries the gateway `source` string).
 */
export async function getSourceReliability() {
  const checks = await db.check.findMany({ select: { source: true, status: true, key: true } });

  // Map gateway source strings + engine check keys onto the connected-portal list.
  const meta: Record<string, { code: string; name: string; latencyMs: number; status: string }> = {
    "Income Tax / NSDL": { code: "PAN / IT", name: "Income Tax Department (Protean / NSDL)", latencyMs: 180, status: "Operational" },
    GSTN: { code: "GSTN", name: "Goods & Services Tax Network", latencyMs: 210, status: "Operational" },
    "Udyam Registration Portal": { code: "Udyam", name: "Udyam Registration Portal (M/o MSME)", latencyMs: 340, status: "Operational" },
    MCA21: { code: "MCA21", name: "Ministry of Corporate Affairs", latencyMs: 1450, status: "Degraded" },
    EPFO: { code: "EPFO", name: "Employees' Provident Fund Organisation", latencyMs: 520, status: "Operational" },
    "Startup India / DPIIT": { code: "DPIIT", name: "Startup India — DPIIT Recognition", latencyMs: 300, status: "Operational" },
    "CPPP + GeM Sanctions": { code: "CPPP", name: "Central Public Procurement Portal — Debarment", latencyMs: 610, status: "Operational" },
    "Metadata & structure analysis": { code: "Forensics", name: "Document forensics engine (in-house)", latencyMs: 90, status: "Operational" },
    "Documents vs profile vs portals": { code: "Reconciliation", name: "Cross-field consistency engine (in-house)", latencyMs: 40, status: "Operational" },
    "Tender eligibility rule": { code: "Rules", name: "Tender eligibility rule evaluator (in-house)", latencyMs: 15, status: "Operational" },
  };

  const agg = new Map<string, { source: string; total: number; verified: number; warning: number; failed: number; pending: number }>();
  for (const c of checks) {
    const key = c.source || "Other";
    const row = agg.get(key) ?? { source: key, total: 0, verified: 0, warning: 0, failed: 0, pending: 0 };
    row.total++;
    if (c.status === "verified") row.verified++;
    else if (c.status === "warning") row.warning++;
    else if (c.status === "failed") row.failed++;
    else row.pending++;
    agg.set(key, row);
  }

  const rows = [...agg.values()]
    .map((r) => {
      const m = meta[r.source] ?? { code: r.source, name: r.source, latencyMs: 0, status: "Operational" };
      const conclusive = r.verified + r.warning + r.failed;
      return {
        ...r,
        code: m.code,
        name: m.name,
        latencyMs: m.latencyMs,
        status: m.status,
        matchRate: r.total ? Math.round((r.verified / r.total) * 100) : 0,
        conclusiveRate: r.total ? Math.round((conclusive / r.total) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const totalChecks = rows.reduce((s, r) => s + r.total, 0);
  const avgLatency = rows.length ? Math.round(rows.reduce((s, r) => s + r.latencyMs, 0) / rows.length) : 0;
  const degraded = rows.filter((r) => r.status !== "Operational").length;

  return { rows, totalChecks, avgLatency, degraded };
}

/* ----------------------- admin: user directory --------------------- */

export async function getUserDirectory() {
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { vendor: { select: { orgName: true, pan: true, mpin: true, mpinAckAt: true, registryBidderId: true } } },
  });
  const counts = {
    OFFICER: users.filter((u) => u.role === "OFFICER").length,
    VENDOR: users.filter((u) => u.role === "VENDOR").length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
  };
  return { users, counts, total: users.length };
}

export async function getNotifications(userId: string, take = 20) {
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unread };
}
