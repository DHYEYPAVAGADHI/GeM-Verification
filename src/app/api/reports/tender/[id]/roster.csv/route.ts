import { auth } from "@/auth";
import { getTenderRoster } from "@/lib/queries";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === "VENDOR") return new Response("Unauthorised", { status: 401 });

  const roster = await getTenderRoster(params.id);
  if (!roster) return new Response("Tender not found", { status: 404 });

  const body = toCsv(
    ["Company", "PAN", "GSTIN", "Sector", "State", "MSME", "Documents", "AI score", "Recommendation", "Confidence", "Flags", "Decision", "Decision reason"],
    roster.rows.map((r) => [
      r.org,
      r.pan,
      r.gstin,
      r.sector ?? "",
      r.state ?? "",
      r.msme ? "Yes" : "No",
      r.docCount,
      r.score ?? "",
      r.recommendation ?? "Pending",
      r.confidence != null ? `${r.confidence}%` : "",
      [
        r.flags.gate && "gate-fail",
        r.flags.debarment && "debarred",
        r.flags.forensic && "tamper",
        r.flags.cartel && "cartel-link",
      ]
        .filter(Boolean)
        .join(" | "),
      r.decision?.verdict ?? "",
      r.decision?.reason ?? "",
    ]),
  );
  const ref = roster.tender.refNo.replace(/\W+/g, "-");
  return csvResponse(`gem-verify-roster-${ref}.csv`, body);
}
