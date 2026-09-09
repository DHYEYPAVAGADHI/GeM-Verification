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
