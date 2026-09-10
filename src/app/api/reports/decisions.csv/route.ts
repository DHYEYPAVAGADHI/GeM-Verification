import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDateTime } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "VENDOR") return new Response("Unauthorised", { status: 401 });

  const decisions = await db.decision.findMany({
    orderBy: { decidedAt: "desc" },
    include: {
      bid: { include: { vendor: { select: { orgName: true, pan: true, gstin: true } }, tender: { select: { refNo: true, title: true } } } },
    },
  });

  const body = toCsv(
    ["Decided at", "Tender ref", "Tender", "Bidder", "PAN", "GSTIN", "Verdict", "Reason"],
    decisions.map((d) => [
      formatDateTime(d.decidedAt),
      d.bid.tender.refNo,
      d.bid.tender.title,
      d.bid.vendor.orgName,
      d.bid.vendor.pan,
      d.bid.vendor.gstin,
      d.verdict,
      d.reason,
    ]),
  );
  return csvResponse(`gem-verify-decision-register-${new Date().toISOString().slice(0, 10)}.csv`, body);
}
