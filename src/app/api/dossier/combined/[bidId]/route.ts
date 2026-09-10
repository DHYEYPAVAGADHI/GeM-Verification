import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DOC_TYPE_LABEL } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

/**
 * Consolidates every document a bidder submitted for one bid into a single
 * PDF — a cover sheet with the AI verdict, then each source document (PDFs
 * spliced in page-for-page, images rendered full-page), each preceded by a
 * labelled divider. Built on demand so it always reflects the latest upload.
 */
export async function GET(_req: Request, { params }: { params: { bidId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === "VENDOR") {
    return new Response("Unauthorised", { status: 401 });
  }

  const bid = await db.bid.findUnique({
    where: { id: params.bidId },
    include: {
      vendor: true,
      tender: true,
      documents: { orderBy: { uploadedAt: "asc" } },
      decision: true,
      runs: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
  if (!bid) return new Response("Not found", { status: 404 });
  const run = bid.runs[0];

  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const NAVY = rgb(0.106, 0.165, 0.369);
  const INK = rgb(0.1, 0.12, 0.18);

  // Helvetica (WinAnsi) can't encode ₹, ≥, en/em dashes, curly quotes — fold them.
  const wa = (s: string) =>
    (s ?? "")
      .replace(/₹/g, "Rs ")
      .replace(/[≥]/g, ">=")
      .replace(/[≤]/g, "<=")
      .replace(/[–—]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[•·]/g, "-")
      .replace(/…/g, "...")
      .replace(/[^\x00-\xFF]/g, "");

  const textPage = (lines: { t: string; size?: number; bold?: boolean; gap?: number; color?: ReturnType<typeof rgb> }[]) => {
    const page = out.addPage([595, 842]);
    let y = 792;
    for (const l of lines) {
      if (y < 60) break;
      page.drawText(wa(l.t), {
        x: 54,
        y,
        size: l.size ?? 10,
        font: l.bold ? bold : font,
        color: l.color ?? INK,
        maxWidth: 487,
        lineHeight: 14,
      });
      y -= l.gap ?? (l.size && l.size > 12 ? 24 : 15);
    }
    return page;
  };

  // ---- cover sheet ----
  textPage([
    { t: "GeM Verify", size: 11, bold: true, color: NAVY, gap: 6 },
    { t: "Consolidated Bidder Document Set", size: 18, bold: true, gap: 28 },
    { t: bid.vendor.orgName, size: 14, bold: true, gap: 18 },
    { t: `PAN ${bid.vendor.pan}     GSTIN ${bid.vendor.gstin}`, gap: 13 },
    { t: `${bid.vendor.sector} · ${bid.vendor.state}${bid.vendor.udyamNo ? " · MSME (Udyam " + bid.vendor.udyamNo + ")" : ""}`, gap: 22 },
    { t: `Tender ${bid.tender.refNo}`, bold: true, gap: 13 },
    { t: bid.tender.title, gap: 13 },
    { t: `Buyer: ${bid.tender.buyer}`, gap: 13 },
    { t: `Bid submitted: ${bid.submittedAt ? formatDateTime(bid.submittedAt) : "—"}`, gap: 22 },
    ...(run
      ? [
          { t: "AI compliance assessment", size: 12, bold: true, gap: 18 },
          { t: `Score ${run.score}/100     Recommendation: ${run.recommendation}     Confidence ${run.confidence}%`, bold: true, gap: 16 },
          { t: run.rationale, gap: 22 },
        ]
      : [{ t: "AI compliance assessment: not yet run.", gap: 22 }]),
    ...(bid.decision
      ? [
          { t: "Officer decision", size: 12, bold: true, gap: 18 },
          { t: `${bid.decision.verdict} — ${formatDateTime(bid.decision.decidedAt)}`, bold: true, gap: 14 },
          { t: bid.decision.reason, gap: 22 },
        ]
      : []),
    { t: "Contents", size: 12, bold: true, gap: 16 },
    ...bid.documents.map((d, i) => ({
      t: `${i + 1}.  ${DOC_TYPE_LABEL[d.declaredType] ?? d.declaredType}  —  ${d.fileName}`,
      gap: 13,
    })),
    { t: `Generated ${formatDateTime(new Date())} by ${session.user.name}`, size: 8, color: rgb(0.45, 0.48, 0.55), gap: 12 },
  ]);

  // ---- each source document ----
  for (let i = 0; i < bid.documents.length; i++) {
    const d = bid.documents[i];
    const label = DOC_TYPE_LABEL[d.declaredType] ?? d.declaredType;
    textPage([
      { t: `Document ${i + 1} of ${bid.documents.length}`, size: 10, bold: true, color: NAVY, gap: 10 },
      { t: label, size: 16, bold: true, gap: 18 },
      { t: `File: ${d.fileName}`, gap: 13 },
      { t: `Type: ${d.mimeType}   ·   ${(d.size / 1024).toFixed(0)} KB`, gap: 13 },
      { t: d.detectedType ? `Detected as: ${DOC_TYPE_LABEL[d.detectedType] ?? d.detectedType}` : "", gap: 13 },
      { t: `SHA-256: ${d.sha256}`, size: 8, color: rgb(0.45, 0.48, 0.55), gap: 12 },
    ]);

    const buf = Buffer.from(d.bytes);
    try {
      const isPng = d.mimeType.includes("png");
      const isJpg = d.mimeType.includes("jpg") || d.mimeType.includes("jpeg");
      if (isPng || isJpg) {
        const img = isPng ? await out.embedPng(buf) : await out.embedJpg(buf);
        const scale = Math.min(495 / img.width, 740 / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const page = out.addPage([595, 842]);
        page.drawImage(img, { x: (595 - w) / 2, y: (842 - h) / 2, width: w, height: h });
      } else if (d.mimeType === "application/pdf" || d.fileName.toLowerCase().endsWith(".pdf")) {
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      } else {
        textPage([{ t: `(Preview not available for ${d.mimeType} — download the original from the dossier.)`, gap: 14 }]);
      }
    } catch {
      textPage([
        { t: `(This file could not be embedded — it may be corrupt or password-protected.)`, color: rgb(0.7, 0.1, 0.1), gap: 14 },
      ]);
    }
  }

  const bytes = await out.save();
  const safe = bid.vendor.orgName.replace(/\W+/g, "-");
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safe}-${bid.tender.refNo.replace(/\W+/g, "-")}-consolidated.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
