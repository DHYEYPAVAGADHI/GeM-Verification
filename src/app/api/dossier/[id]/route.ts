import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { getBid } from "@/lib/queries";
import { verifyAuditChain } from "@/lib/engine/audit";
import { formatDateTime } from "@/lib/utils";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === "VENDOR") return new Response("Unauthorised", { status: 401 });

  const bid = await getBid(params.id);
  if (!bid) return new Response("Not found", { status: 404 });
  const chain = await verifyAuditChain();
  const run = bid.run;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;
  const line = (t: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
    if (y < 60) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(t, { x: 48, y, size: opts.size ?? 10, font: opts.bold ? bold : font, color: rgb(0.1, 0.12, 0.18), maxWidth: 500, lineHeight: 13 });
    y -= opts.gap ?? (opts.size && opts.size > 12 ? 22 : 15);
  };

  line("GeM Verify — Bidder Compliance Dossier", { size: 16, bold: true, gap: 26 });
  line(`Bidder: ${bid.vendor.orgName}`, { bold: true });
  line(`PAN ${bid.vendor.pan}   GSTIN ${bid.vendor.gstin}`);
  line(`Tender: ${bid.tender.refNo} — ${bid.tender.title}`);
  line(`Buyer: ${bid.tender.buyer}`);
  line(`Generated: ${formatDateTime(new Date())} by ${session.user.name}`, { gap: 22 });

  if (run) {
    line(`Compliance score: ${run.score}/100   Risk: ${run.riskLevel}   Recommendation: ${run.recommendation}`, { bold: true });
    line(`AI confidence: ${run.confidence}%`, { gap: 18 });
    line("Rationale:", { bold: true });
    line(run.rationale, { gap: 20 });

    line("Verification checks", { size: 12, bold: true, gap: 18 });
    for (const c of run.checks) {
      line(`[${c.status.toUpperCase()}] ${c.label} — ${c.source}`);
      line(`    ${c.detail}`, { gap: 14 });
    }
  }

  if (bid.decision) {
    y -= 8;
    line("Officer decision", { size: 12, bold: true, gap: 18 });
    line(`${bid.decision.verdict} — ${formatDateTime(bid.decision.decidedAt)}`, { bold: true });
    line(bid.decision.reason, { gap: 20 });
  }

  line("Audit chain", { size: 12, bold: true, gap: 18 });
  line(`Status: ${chain.intact ? "INTACT" : "BROKEN at #" + chain.brokenAtSeq}`);
  line(`Head hash: ${chain.head}`);

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossier-${bid.vendor.orgName.replace(/\W+/g, "-")}.pdf"`,
    },
  });
}
