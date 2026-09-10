import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { verifyAuditChain } from "@/lib/engine/audit";
import { formatDateTime } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "VENDOR") return new Response("Unauthorised", { status: 401 });

  const [entries, chain] = await Promise.all([
    db.auditEntry.findMany({ orderBy: { seq: "asc" } }),
    verifyAuditChain(),
  ]);

  const body = toCsv(
    ["Seq", "Timestamp", "Actor", "Action", "Entity type", "Entity id", "Summary", "Hash", "Prev hash", "Chain"],
    entries.map((e) => [
      e.seq,
      formatDateTime(e.ts),
      e.actor,
      e.action,
      e.entityType,
      e.entityId,
      e.summary,
      e.hash,
      e.prevHash,
      chain.intact ? "intact" : chain.brokenAtSeq != null && e.seq >= chain.brokenAtSeq ? "BROKEN" : "intact",
    ]),
  );
  return csvResponse(`gem-verify-audit-log-${new Date().toISOString().slice(0, 10)}.csv`, body);
}
