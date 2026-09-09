import { PDFDocument } from "pdf-lib";
import { db } from "@/lib/db";
import type { ExtractedFields } from "./patterns";

export type ForensicResult = {
  integrityScore: number; // 0..100, higher = cleaner
  verdict: "clean" | "review" | "suspect";
  metadata: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  signals: { key: string; severity: "info" | "warn" | "high"; detail: string }[];
  incrementalSaves: number;
  qr: { present: boolean; matchesOcr: boolean | null; detail: string };
  duplicate: { isDuplicate: boolean; detail: string };
};

const EDITOR_FINGERPRINTS =
  /photoshop|gimp|pixelmator|canva|inkscape|illustrator|paint\.net|snapseed|picsart/i;

function countEOF(bytes: Uint8Array): number {
  // "%%EOF" = 25 25 45 4F 46
  const needle = [0x25, 0x25, 0x45, 0x4f, 0x46];
  let count = 0;
  for (let i = 0; i <= bytes.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++)
      if (bytes[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    if (ok) count++;
  }
  return count;
}

export async function analyseDocument(opts: {
  bytes: Uint8Array | Buffer;
  sha256: string;
  fields: ExtractedFields;
  bidId: string;
  vendorId: string;
}): Promise<ForensicResult> {
  const u8 = opts.bytes instanceof Uint8Array ? opts.bytes : new Uint8Array(opts.bytes);
  const signals: ForensicResult["signals"] = [];

  let meta: ForensicResult["metadata"] = {};
  try {
    const doc = await PDFDocument.load(u8, { updateMetadata: false });
    meta = {
      title: doc.getTitle() || undefined,
      author: doc.getAuthor() || undefined,
      creator: doc.getCreator() || undefined,
      producer: doc.getProducer() || undefined,
      creationDate: doc.getCreationDate()?.toISOString(),
      modificationDate: doc.getModificationDate()?.toISOString(),
    };
  } catch {
    signals.push({ key: "parse", severity: "warn", detail: "PDF structure could not be fully parsed." });
  }

  let score = 100;

  const fp = `${meta.creator ?? ""} ${meta.producer ?? ""}`;
  if (EDITOR_FINGERPRINTS.test(fp)) {
    score -= 35;
    const which = EDITOR_FINGERPRINTS.exec(meta.producer ?? "")?.[0] ?? EDITOR_FINGERPRINTS.exec(fp)?.[0] ?? "an image editor";
    signals.push({
      key: "editor",
      severity: "high",
      detail: `Document was produced with ${meta.producer ?? which} — a statutory certificate should not be authored in an image editor.`,
    });
  }

  if (meta.creationDate && meta.modificationDate) {
    const delta = new Date(meta.modificationDate).getTime() - new Date(meta.creationDate).getTime();
    const days = delta / 86_400_000;
    if (days > 1) {
      score -= Math.min(20, Math.round(days));
      signals.push({
        key: "date-delta",
        severity: days > 30 ? "high" : "warn",
        detail: `Modified ${Math.round(days)} day(s) after creation — the file was edited after it was first produced.`,
      });
    }
  }

  const incrementalSaves = Math.max(0, countEOF(u8) - 1);
  if (incrementalSaves >= 1) {
    score -= 12 * incrementalSaves;
    signals.push({
      key: "incremental",
      severity: incrementalSaves >= 2 ? "high" : "warn",
      detail: `${incrementalSaves} incremental save(s) detected — content was appended or altered after the original save.`,
    });
  }

  // QR payload vs OCR fields
  let qr: ForensicResult["qr"] = { present: false, matchesOcr: null, detail: "No embedded QR payload found." };
  const p = opts.fields.qrPayload as Record<string, string> | undefined | null;
  if (p) {
    const mismatches: string[] = [];
    if (p.gstin && opts.fields.gstin && p.gstin !== opts.fields.gstin) mismatches.push("GSTIN");
    if (p.pan && opts.fields.pan && p.pan !== opts.fields.pan) mismatches.push("PAN");
    if (p.udyam && opts.fields.udyam && p.udyam !== opts.fields.udyam) mismatches.push("Udyam number");
    const matches = mismatches.length === 0;
    if (!matches) {
      score -= 30;
      signals.push({
        key: "qr",
        severity: "high",
        detail: `QR code payload disagrees with the printed text on: ${mismatches.join(", ")}.`,
      });
    }
    qr = {
      present: true,
      matchesOcr: matches,
      detail: matches
        ? "QR payload matches the extracted text."
        : `QR payload mismatch on ${mismatches.join(", ")}.`,
    };
  }

  // Duplicate / reuse across bidders
  let duplicate: ForensicResult["duplicate"] = { isDuplicate: false, detail: "File hash is unique across submissions." };
  const sameHash = await db.bidDocument.findFirst({
    where: { sha256: opts.sha256, bid: { vendorId: { not: opts.vendorId } } },
    include: { bid: { include: { vendor: true } } },
  });
  if (sameHash) {
    score -= 30;
    duplicate = {
      isDuplicate: true,
      detail: `Byte-identical to a document submitted by ${sameHash.bid.vendor.orgName} — the same file was reused across two bidders.`,
    };
    signals.push({ key: "duplicate", severity: "high", detail: duplicate.detail });
  } else {
    // metadata author overlap — only meaningful for a personal / non-institutional author
    const author = meta.author?.trim();
    const institutional = /nic|egov|government|gem|document service|renderer|department/i.test(author ?? "");
    if (author && !institutional) {
      const sameAuthor = await db.bidDocument.findFirst({
        where: {
          forensicJson: { contains: `"author":"${author}"` },
          bid: { vendorId: { not: opts.vendorId } },
        },
        include: { bid: { include: { vendor: true } } },
      });
      if (sameAuthor) {
        score -= 15;
        signals.push({
          key: "author-overlap",
          severity: "high",
          detail: `Metadata author "${author}" also authored a document submitted by ${sameAuthor.bid.vendor.orgName}.`,
        });
      }
    }
  }

  score = Math.max(0, Math.min(100, score));
  const verdict: ForensicResult["verdict"] = score >= 80 ? "clean" : score >= 55 ? "review" : "suspect";

  if (signals.length === 0)
    signals.push({ key: "ok", severity: "info", detail: "No tampering indicators found in metadata or structure." });

  return { integrityScore: score, verdict, metadata: meta, signals, incrementalSaves, qr, duplicate };
}
