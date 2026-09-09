import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generates certificate PDFs with a real text layer so the extraction
 * pipeline has genuine content to work with. Used by the seed and offered
 * as downloadable "sample documents" for live demos.
 */

export type SampleSpec = {
  kind:
    | "GST_CERT"
    | "UDYAM_CERT"
    | "PAN_CARD"
    | "TURNOVER_CERT"
    | "OEM_AUTH"
    | "WORK_ORDER"
    | "ISO_CERT"
    | "EPFO_ECR"
    | "MAKE_IN_INDIA";
  orgName: string;
  pan: string;
  gstin: string;
  udyam?: string;
  cin?: string;
  udin?: string;
  address?: string;
  turnovers?: [number, number, number]; // in ₹ Cr
  workValueCr?: number;
  localContentPct?: number;
  isoValidTill?: string;
  epfoCode?: string;
  epfoMembers?: number;
  /** produce a subtly tampered document (editor fingerprint + date skew + QR/text mismatch) */
  tampered?: boolean;
};

const HEAD = "GOVERNMENT OF INDIA";

function body(spec: SampleSpec): { title: string; lines: string[]; qr: Record<string, string> } {
  const addr = spec.address ?? "Plot 14, Industrial Estate, Phase II";
  switch (spec.kind) {
    case "GST_CERT":
      return {
        title: "Form GST REG-06 — Certificate of Registration",
        lines: [
          HEAD,
          "GOODS AND SERVICES TAX IDENTIFICATION NUMBER (GSTIN)",
          spec.gstin,
          "",
          `Legal Name : ${spec.orgName}`,
          `Trade Name : ${spec.orgName}`,
          `Permanent Account Number : ${spec.pan}`,
          `Constitution of Business : Private Limited Company`,
          `Address of Principal Place of Business : ${addr}`,
          `Date of Liability : 01/07/2017`,
          `Period of Validity : From 01/07/2017 to NA`,
          `Type of Registration : Regular`,
          "",
          "This is a system generated certificate.",
        ],
        qr: { gstin: spec.gstin, pan: spec.pan, legalName: spec.orgName },
      };
    case "UDYAM_CERT":
      return {
        title: "Udyam Registration Certificate",
        lines: [
          HEAD,
          "MINISTRY OF MICRO, SMALL AND MEDIUM ENTERPRISES",
          `Udyam Registration Number : ${spec.udyam ?? "UDYAM-XX-00-0000000"}`,
          `Name of Enterprise : ${spec.orgName}`,
          `Permanent Account Number : ${spec.pan}`,
          `Type of Enterprise : Small`,
          `Major Activity : Manufacturing`,
          `Date of Udyam Registration : 12/08/2021`,
          `Date of Incorporation / Registration of Enterprise : 18/06/2012`,
          "",
          "Validity : Registration is permanent, subject to annual update of ITR/GST data.",
        ],
        qr: { udyam: spec.udyam ?? "", pan: spec.pan, legalName: spec.orgName },
      };
    case "PAN_CARD":
      return {
        title: "Income Tax Department — PAN Allotment Letter",
        lines: [
          HEAD,
          "INCOME TAX DEPARTMENT",
          `Permanent Account Number (PAN) : ${spec.pan}`,
          `Name : ${spec.orgName}`,
          `Status : Company`,
          `Latest Assessment Year with return filed : AY 2026-27`,
          "",
          "PAN is active. This document is computer generated.",
        ],
        qr: { pan: spec.pan, legalName: spec.orgName },
      };
    case "TURNOVER_CERT": {
      const t = spec.turnovers ?? [10, 12, 14];
      const shown = spec.tampered ? [t[0] * 3.4, t[1] * 3.1, t[2] * 3.2] : t;
      const avg = (shown.reduce((a, b) => a + b, 0) / 3).toFixed(2);
      return {
        title: "Chartered Accountant's Certificate of Annual Turnover",
        lines: [
          "TO WHOMSOEVER IT MAY CONCERN",
          `We have verified the books of account of ${spec.orgName} (PAN ${spec.pan}).`,
          `Based on the audited financial statements, the annual turnover (revenue from operations) is certified as under:`,
          `FY 2022-23 : Rs. ${shown[0].toFixed(2)} Cr`,
          `FY 2023-24 : Rs. ${shown[1].toFixed(2)} Cr`,
          `FY 2024-25 : Rs. ${shown[2].toFixed(2)} Cr`,
          `Three-year average turnover : Rs. ${avg} Cr`,
          `Net Worth as at 31/03/2025 : Positive`,
          "",
          `UDIN : ${spec.udin ?? "26123456ABCDEFGHIJ"}`,
          "For XYZ & Associates, Chartered Accountants",
          "Membership No. 099999",
        ],
        // QR keeps the *true* figures — a tampered doc will disagree with its own QR
        qr: {
          pan: spec.pan,
          legalName: spec.orgName,
          turnoverAvgCr: ((t[0] + t[1] + t[2]) / 3).toFixed(2),
        },
      };
    }
    case "OEM_AUTH":
      return {
        title: "Original Equipment Manufacturer — Authorisation Letter",
        lines: [
          `Date : 05/08/2026`,
          `To, The Tender Inviting Authority`,
          "",
          `We, NetGear Systems India Pvt Ltd (CIN U31900KA2003PTC030111), the Original Equipment`,
          `Manufacturer of networking equipment, hereby authorise ${spec.orgName} (PAN ${spec.pan})`,
          `to quote, sell and provide after-sales support for our products against the referenced tender.`,
          `This authorisation is valid for the tender validity period.`,
          "",
          `Authorised Signatory, DIN 07654321`,
          `For NetGear Systems India Pvt Ltd`,
        ],
        qr: { pan: spec.pan, legalName: spec.orgName, oem: "NetGear Systems India Pvt Ltd" },
      };
    case "WORK_ORDER":
      return {
        title: "Completion Certificate / Work Order",
        lines: [
          HEAD,
          `Issued by : Bharat Sanchar Nigam Limited (Buyer)`,
          `Contractor : ${spec.orgName} (PAN ${spec.pan})`,
          `Scope : Supply, installation and commissioning of campus networking equipment`,
          `Order Value : Rs. ${(spec.workValueCr ?? 8).toFixed(2)} Cr`,
          `Order Date : 11/02/2024   Completion Date : 30/12/2024`,
          `Performance : Satisfactory. Work completed within schedule.`,
          "",
          "This certificate is issued for the purpose of tender participation.",
        ],
        qr: { pan: spec.pan, legalName: spec.orgName, workValueCr: String(spec.workValueCr ?? 8) },
      };
    case "ISO_CERT":
      return {
        title: "Certificate of Registration — ISO 9001:2015",
        lines: [
          `This is to certify that the Quality Management System of`,
          `${spec.orgName}`,
          `has been assessed and found to conform to the requirements of ISO 9001:2015.`,
          `Scope : Design, manufacture and supply of networking and IT equipment.`,
          `Certificate No. : IN-QMS-${spec.pan.slice(0, 5)}`,
          `Original Approval : 20/09/2020`,
          `Valid Until : ${spec.isoValidTill ?? "21/09/2026"}`,
          "",
          "Issued by TQ Certification Services (accredited body).",
        ],
        qr: { pan: spec.pan, legalName: spec.orgName },
      };
    case "EPFO_ECR":
      return {
        title: "EPFO — Electronic Challan cum Return (ECR) Summary",
        lines: [
          HEAD,
          "EMPLOYEES' PROVIDENT FUND ORGANISATION",
          `Establishment Name : ${spec.orgName}`,
          `Establishment Code : ${spec.epfoCode ?? "KN/BNG/0000000/000"}`,
          `Wage Month : July 2026`,
          `Total Members (contributing) : ${spec.epfoMembers ?? 120}`,
          `Total Amount Remitted : Paid`,
          `Date of Credit : 12/08/2026`,
          "",
          "Electronic Challan cum Return filed successfully.",
        ],
        qr: { pan: spec.pan, legalName: spec.orgName, epfoCode: spec.epfoCode ?? "" },
      };
    case "MAKE_IN_INDIA":
      return {
        title: "Declaration of Local Content (Public Procurement — Make in India Order)",
        lines: [
          `We, ${spec.orgName} (PAN ${spec.pan}), declare that the goods offered against this tender`,
          `have local content of ${spec.localContentPct ?? 55}%.`,
          `Category : ${((spec.localContentPct ?? 55) >= 50 ? "Class-I Local Supplier" : "Class-II Local Supplier")}`,
          `Location of value addition : ${spec.address ?? "Phase II Industrial Estate"}`,
          `A bill of materials supporting the above is enclosed.`,
          "",
          `Authorised Signatory, for ${spec.orgName}`,
        ],
        qr: { pan: spec.pan, legalName: spec.orgName, localContentPct: String(spec.localContentPct ?? 55) },
      };
  }
}

export async function generateSample(spec: SampleSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { title, lines, qr } = body(spec);

  const created = new Date("2026-08-10T09:30:00Z");
  doc.setTitle(title);
  doc.setSubject(`${spec.kind} for ${spec.orgName}`);
  doc.setCreationDate(created);
  if (spec.tampered) {
    doc.setAuthor("NIC eGov Document Service");
    doc.setProducer("Adobe Photoshop 25.0 (Macintosh)");
    doc.setCreator("Adobe Photoshop 25.0 (Macintosh)");
    doc.setModificationDate(new Date("2026-08-27T22:14:00Z"));
  } else {
    doc.setAuthor("NIC eGov Document Service");
    doc.setProducer("NIC PDF Renderer 2.4");
    doc.setCreator("GeM Document Service");
    doc.setModificationDate(created);
  }

  const page = doc.addPage([595, 842]);
  let y = 800;
  page.drawText(title, { x: 48, y, size: 13, font: bold, color: rgb(0.1, 0.13, 0.28) });
  y -= 28;
  for (const ln of lines) {
    page.drawText(ln || " ", { x: 48, y, size: 10, font, color: rgb(0.15, 0.17, 0.2), maxWidth: 500, lineHeight: 13 });
    y -= ln.length > 90 ? 26 : 15;
  }
  y -= 10;
  page.drawText(`QR-PAYLOAD: ${JSON.stringify(qr)}`, {
    x: 48,
    y: Math.max(40, y),
    size: 7,
    font,
    color: rgb(0.55, 0.55, 0.6),
    maxWidth: 500,
    lineHeight: 9,
  });

  const bytes = await doc.save();
  if (spec.tampered) {
    // add a trailing incremental-update marker so structure analysis flags it
    const extra = new TextEncoder().encode("\n% incremental update 1\n%%EOF\n");
    const merged = new Uint8Array(bytes.length + extra.length);
    merged.set(bytes, 0);
    merged.set(extra, bytes.length);
    return merged;
  }
  return bytes;
}
