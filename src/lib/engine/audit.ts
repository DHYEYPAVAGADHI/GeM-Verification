import { createHash } from "crypto";
import { db } from "@/lib/db";

const GENESIS = "0".repeat(64);

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Append one entry to the tamper-evident audit log.
 * Each entry hashes (previous hash + its own payload), forming a chain:
 * altering any past entry breaks every hash after it.
 */
export async function appendAudit(entry: {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  payload?: unknown;
}) {
  const last = await db.auditEntry.findFirst({ orderBy: { seq: "desc" } });
  const prevHash = last?.hash ?? GENESIS;
  const payloadHash = sha256(JSON.stringify(entry.payload ?? {}));
  const ts = new Date();
  const hash = sha256(
    prevHash + payloadHash + entry.action + entry.entityType + entry.entityId + ts.toISOString(),
  );

  return db.auditEntry.create({
    data: {
      ts,
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summary: entry.summary,
      payloadHash,
      prevHash,
      hash,
    },
  });
}

export async function verifyAuditChain(): Promise<{ intact: boolean; brokenAtSeq?: number; head: string }> {
  const entries = await db.auditEntry.findMany({ orderBy: { seq: "asc" } });
  let prev = GENESIS;
  for (const e of entries) {
    const expected = sha256(
      prev + e.payloadHash + e.action + e.entityType + e.entityId + e.ts.toISOString(),
    );
    if (e.prevHash !== prev || e.hash !== expected) {
      return { intact: false, brokenAtSeq: e.seq, head: entries.at(-1)?.hash ?? GENESIS };
    }
    prev = e.hash;
  }
  return { intact: true, head: prev };
}
