import { PDFParse } from "pdf-parse";
import { parseFields, type ExtractedFields } from "./patterns";

export type ExtractionResult = {
  ok: boolean;
  method: "pdf-text-layer" | "none";
  pages: number;
  charCount: number;
  confidence: number; // 0..100
  fields: ExtractedFields;
  error?: string;
};

/**
 * Extract text from a PDF buffer and parse structured fields.
 * Real, deterministic extraction — no external service.
 * Production would add an OCR fallback (Tesseract / Textract) for scanned images.
 */
export async function extractDocument(
  bytes: Uint8Array | Buffer,
  declaredType?: string,
): Promise<ExtractionResult> {
  const u8 = new Uint8Array(bytes.byteLength);
  u8.set(bytes as Uint8Array);

  // A non-PDF (e.g. a JPG/PNG scan) or a corrupt file must not throw — callers
  // treat a failed extraction as "uploaded, not yet read", never as an error.
  const isPdf = u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46; // %PDF
  if (!isPdf) {
    return {
      ok: false,
      method: "none",
      pages: 0,
      charCount: 0,
      confidence: 0,
      fields: {},
      error: "not a PDF — text extraction skipped",
    };
  }

  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: u8 });
    const res = await parser.getText();
    const text = res.text ?? "";
    const charCount = text.trim().length;
    const fields = parseFields(text, declaredType);

    const anchors = [fields.pan, fields.gstin, fields.udyam, fields.cin, fields.udin].filter(Boolean).length;
    let confidence = 0;
    if (charCount > 40) confidence = 55;
    if (charCount > 300) confidence = 78;
    if (charCount > 900) confidence = 90;
    confidence = Math.min(99, confidence + anchors * 3);

    return {
      ok: charCount > 0,
      method: charCount > 0 ? "pdf-text-layer" : "none",
      pages: res.total ?? res.pages?.length ?? 1,
      charCount,
      confidence: charCount > 0 ? confidence : 0,
      fields,
    };
  } catch (e) {
    return {
      ok: false,
      method: "none",
      pages: 0,
      charCount: 0,
      confidence: 0,
      fields: {},
      error: e instanceof Error ? e.message : "extraction failed",
    };
  } finally {
    await parser?.destroy().catch(() => {});
  }
}
