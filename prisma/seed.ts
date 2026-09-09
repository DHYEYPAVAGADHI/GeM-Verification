import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { generateSample, type SampleSpec } from "../src/lib/engine/samples";
import { runVerification } from "../src/lib/engine/run";
import { appendAudit } from "../src/lib/engine/audit";
const PW = "Demo@12345";
const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

const KIND_TO_DOCTYPE: Record<SampleSpec["kind"], string> = {
  GST_CERT: "GST_CERT",
  UDYAM_CERT: "UDYAM_CERT",
  PAN_CARD: "PAN_CARD",
  TURNOVER_CERT: "TURNOVER_CERT",
  OEM_AUTH: "OEM_AUTH",
  WORK_ORDER: "WORK_ORDER",
  ISO_CERT: "ISO_CERT",
  EPFO_ECR: "EPFO_ECR",
  MAKE_IN_INDIA: "MAKE_IN_INDIA",
};

async function wipe() {
  // order matters for FK
  await db.check.deleteMany();
  await db.verificationRun.deleteMany();
  await db.decision.deleteMany();
  await db.clarification.deleteMany();
  await db.declaration.deleteMany();
  await db.bidCriterionResponse.deleteMany();
  await db.bidDocument.deleteMany();
  await db.bid.deleteMany();
  await db.eligibilityCriterion.deleteMany();
  await db.requiredDocument.deleteMany();
  await db.tender.deleteMany();
  await db.profileDocument.deleteMany();
  await db.user.deleteMany();
  await db.vendorProfile.deleteMany();
  await db.govPan.deleteMany();
  await db.govGstin.deleteMany();
  await db.govUdyam.deleteMany();
  await db.govMca.deleteMany();
  await db.govEpfo.deleteMany();
  await db.govDpiit.deleteMany();
  await db.govDebarment.deleteMany();
  await db.auditEntry.deleteMany();
}

type VendorSeed = {
  key: string;
  orgName: string;
  email: string;
  constitution: string;
  pan: string;
  gstin: string;
  cin?: string;
  udyamNo?: string;
  msmeClass?: string;
  startupDpiit?: string;
  epfoCode?: string;
  sector: string;
  state: string;
  employees: number;
  turnovers: [number, number, number];
  registeredAddress: string;
  // gov side
  gov: {
    panStatus?: string;
    gstStatus?: string;
    gstFilingRegular?: boolean;
    gstLastReturn?: string;
    gstRegDate?: string;
    udyamEnterprise?: string;
    udyamStatus?: string;
    mcaStatus?: string;
    mcaDirectors?: { din: string; name: string }[];
    mcaCharges?: number;
    epfoStatus?: string;
    epfoMembers?: number;
    epfoLastEcr?: string;
    dpiitValidTill?: string;
    debarment?: { authority: string; reason: string; from: string; till?: string; byPan?: boolean };
  };
};

const VENDORS: VendorSeed[] = [
  {
    key: "apollo",
    orgName: "Apollo Technologies Pvt Ltd",
    email: "apollo@apollotech.in",
    constitution: "Private Limited",
    pan: "ABCDE1234F",
    gstin: "24ABCDE1234F1Z5",
    cin: "U72200GJ2012PTC071204",
    udyamNo: "UDYAM-GJ-03-0021547",
    msmeClass: "Small",
    epfoCode: "GJ/SRT/0210547/000",
    sector: "IT Hardware & Networking",
    state: "Gujarat",
    employees: 214,
    turnovers: [38.2, 44.1, 63.4],
    registeredAddress: "Plot 14, GIDC Industrial Estate, Sachin, Surat 394230",
    gov: {
      gstFilingRegular: true,
      gstLastReturn: "Jul 2026",
      gstRegDate: "2017-07-01",
      udyamEnterprise: "Small",
      mcaStatus: "Active",
      mcaDirectors: [
        { din: "01122334", name: "R. Shah" },
        { din: "01122335", name: "M. Shah" },
      ],
      epfoMembers: 214,
      epfoLastEcr: "Jul 2026",
    },
  },
  {
    key: "xyz",
    orgName: "XYZ Industries Ltd",
    email: "contact@xyzindustries.in",
    constitution: "Public Limited",
    pan: "FGHIJ5678K",
    gstin: "27FGHIJ5678K2Z6",
    cin: "L31900MH2009PLC198877",
    udyamNo: "UDYAM-MH-18-0044120",
    msmeClass: "Medium",
    epfoCode: "MH/PUN/0044120/000",
    sector: "Electrical Equipment",
    state: "Maharashtra",
    employees: 540,
    turnovers: [96, 110, 161],
    registeredAddress: "Gat 221, Chakan MIDC, Pune 410501",
    gov: {
      gstStatus: "Active",
      gstFilingRegular: false,
      gstLastReturn: "Jun 2026",
      gstRegDate: "2017-07-01",
      udyamEnterprise: "Medium",
      mcaStatus: "Active",
      mcaDirectors: [
        { din: "02233445", name: "P. Kulkarni" },
        { din: "07654321", name: "S. Iyer" },
      ],
      mcaCharges: 4.0,
      epfoMembers: 505,
      epfoLastEcr: "Jun 2026",
    },
  },
  {
    key: "abc",
    orgName: "ABC Systems Pvt Ltd",
    email: "bids@abcsystems.in",
    constitution: "Private Limited",
    pan: "LMNOP2345Q",
    gstin: "29LMNOP2345Q3Z7",
    cin: "U72900KA2021PTC099211",
    udyamNo: "UDYAM-KA-03-0099211",
    msmeClass: "Micro",
    startupDpiit: "DIPP84512",
    epfoCode: "KA/BNG/0099211/000",
    sector: "IT Services",
    state: "Karnataka",
    employees: 41,
    turnovers: [4.1, 5.2, 6.2],
    registeredAddress: "3rd Floor, Tech Park Road, HSR Layout, Bengaluru 560102",
    gov: {
      gstStatus: "Suspended",
      gstFilingRegular: false,
      gstLastReturn: "Feb 2026",
      gstRegDate: "2021-11-03",
      udyamEnterprise: "Micro",
      mcaStatus: "Active",
      // shares DIN 07654321 with XYZ -> cartel signal
      mcaDirectors: [
        { din: "07654321", name: "S. Iyer" },
        { din: "09988776", name: "K. Rao" },
      ],
      epfoStatus: "Inactive",
      epfoMembers: 0,
      epfoLastEcr: "Apr 2026",
      dpiitValidTill: "2028-03-31",
      debarment: {
        authority: "State PWD (Karnataka)",
        reason: "Caution list — group entity ABC Infratech (2024)",
        from: "2024-05-01",
        till: "2027-04-30",
        byPan: false,
      },
    },
  },
  {
    key: "sunrise",
    orgName: "Sunrise Enterprises",
    email: "hello@sunrise.co.in",
    constitution: "Partnership",
    pan: "RSTUV6789W",
    gstin: "08RSTUV6789W4Z8",
    udyamNo: "UDYAM-RJ-17-0031882",
    msmeClass: "Small",
    epfoCode: "RJ/JAI/0031882/000",
    sector: "Office Furniture",
    state: "Rajasthan",
    employees: 96,
    turnovers: [22.4, 26.1, 35.2],
    registeredAddress: "F-88, RIICO Industrial Area, Sitapura, Jaipur 302022",
    gov: {
      gstFilingRegular: true,
      gstLastReturn: "Jul 2026",
      gstRegDate: "2017-07-01",
      udyamEnterprise: "Small",
      epfoMembers: 96,
      epfoLastEcr: "Jul 2026",
    },
  },
  {
    key: "technova",
    orgName: "TechNova Solutions Pvt Ltd",
    email: "info@technova.in",
    constitution: "Private Limited",
    pan: "XZYAB1111C",
    gstin: "07XZYAB1111C5Z9",
    cin: "U72200DL2019PTC344110",
    udyamNo: "UDYAM-DL-06-0034411",
    msmeClass: "Small",
    startupDpiit: "DIPP66190",
    epfoCode: "DL/DEL/0034411/000",
    sector: "IT Software",
    state: "Delhi",
    employees: 88,
    turnovers: [9.1, 12.4, 22.6],
    registeredAddress: "B-4, Okhla Industrial Area Phase I, New Delhi 110020",
    gov: {
      gstFilingRegular: true,
      gstLastReturn: "Jul 2026",
      gstRegDate: "2019-04-15",
      udyamEnterprise: "Small",
      mcaStatus: "Active",
      mcaDirectors: [{ din: "05566778", name: "A. Verma" }],
      epfoStatus: "Active",
      epfoMembers: 61,
      epfoLastEcr: "Jul 2026",
      dpiitValidTill: "2027-11-30",
    },
  },
  {
    key: "meridian",
    orgName: "Meridian Infra Projects Ltd",
    email: "bids@meridianinfra.in",
    constitution: "Public Limited",
    pan: "PQRST8899H",
    gstin: "33PQRST8899H1Z2",
    cin: "L45200TN2004PLC052210",
    epfoCode: "TN/CHN/0052210/000",
    sector: "Civil Infrastructure",
    state: "Tamil Nadu",
    employees: 1280,
    turnovers: [255, 288, 389],
    registeredAddress: "No. 5, Mount Road, Guindy, Chennai 600032",
    gov: {
      gstFilingRegular: true,
      gstLastReturn: "Jul 2026",
      gstRegDate: "2017-07-01",
      mcaStatus: "Active",
      mcaDirectors: [
        { din: "03344556", name: "V. Nair" },
        { din: "03344557", name: "L. Krishnan" },
      ],
      mcaCharges: 120.0,
      epfoMembers: 1240,
      epfoLastEcr: "Jul 2026",
    },
  },
  {
    key: "orbit",
    orgName: "Orbit Defence Systems Pvt Ltd",
    email: "tenders@orbitdefence.in",
    constitution: "Private Limited",
    pan: "CDEFG7788M",
    gstin: "36CDEFG7788M9Z4",
    cin: "U29253TG2011PTC077881",
    udyamNo: "UDYAM-TG-20-0077881",
    msmeClass: "Medium",
    epfoCode: "TG/HYD/0077881/000",
    sector: "Defence Electronics",
    state: "Telangana",
    employees: 610,
    turnovers: [132, 156, 216],
    registeredAddress: "Plot 44, Defence Park, Hyderabad 500032",
    gov: {
      gstFilingRegular: true,
      gstLastReturn: "Jul 2026",
      gstRegDate: "2017-07-01",
      udyamEnterprise: "Medium",
      mcaStatus: "Active",
      mcaDirectors: [{ din: "04455667", name: "T. Reddy" }],
      epfoMembers: 610,
      epfoLastEcr: "Jul 2026",
    },
  },
  {
    key: "greenfield",
    orgName: "Greenfield Traders",
    email: "sales@greenfieldtraders.co.in",
    constitution: "Proprietorship",
    pan: "UVWXY3344L",
    gstin: "19UVWXY3344L2Z1",
    udyamNo: "UDYAM-WB-10-0012044",
    msmeClass: "Micro",
    sector: "General Supplies (Reseller)",
    state: "West Bengal",
    employees: 7,
    turnovers: [1.4, 1.8, 2.1],
    registeredAddress: "22 Canal Street, Kolkata 700048",
    gov: {
      gstStatus: "Active",
      gstFilingRegular: true,
      gstLastReturn: "Jul 2026",
      gstRegDate: "2026-06-01",
      udyamEnterprise: "Micro",
      epfoStatus: "NOT_FOUND",
    },
  },
];

async function seedGov(v: VendorSeed) {
  await db.govPan.create({
    data: { pan: v.pan, name: v.orgName, status: v.gov.panStatus ?? "ACTIVE", itrFiledAY: "AY 2026-27" },
  });
  await db.govGstin.create({
    data: {
      gstin: v.gstin,
      legalName: v.orgName,
      pan: v.pan,
      status: v.gov.gstStatus ?? "Active",
      registrationDate: new Date(v.gov.gstRegDate ?? "2017-07-01"),
      lastReturnPeriod: v.gov.gstLastReturn ?? "Jul 2026",
      filingRegular: v.gov.gstFilingRegular ?? true,
      stateCode: v.gstin.slice(0, 2),
    },
  });
  if (v.udyamNo)
    await db.govUdyam.create({
      data: {
        udyamNo: v.udyamNo,
        name: v.orgName,
        pan: v.pan,
        enterprise: v.gov.udyamEnterprise ?? "Small",
        status: v.gov.udyamStatus ?? "Valid",
      },
    });
  if (v.cin)
    await db.govMca.create({
      data: {
        cin: v.cin,
        name: v.orgName,
        status: v.gov.mcaStatus ?? "Active",
        directors: JSON.stringify(v.gov.mcaDirectors ?? []),
        charges: v.gov.mcaCharges ?? 0,
      },
    });
  if (v.epfoCode && v.gov.epfoStatus !== "NOT_FOUND")
    await db.govEpfo.create({
      data: {
        code: v.epfoCode,
        name: v.orgName,
        status: v.gov.epfoStatus ?? "Active",
        lastEcrPeriod: v.gov.epfoLastEcr ?? "Jul 2026",
        memberCount: v.gov.epfoMembers ?? v.employees,
      },
    });
  if (v.startupDpiit && v.gov.dpiitValidTill)
    await db.govDpiit.create({
      data: { recognitionNo: v.startupDpiit, name: v.orgName, validTill: new Date(v.gov.dpiitValidTill) },
    });
  if (v.gov.debarment)
    await db.govDebarment.create({
      data: {
        entityName: v.gov.debarment.byPan ? v.orgName : v.orgName.split(" ")[0] + " Infratech",
        pan: v.gov.debarment.byPan ? v.pan : null,
        authority: v.gov.debarment.authority,
        reason: v.gov.debarment.reason,
        fromDate: new Date(v.gov.debarment.from),
        tillDate: v.gov.debarment.till ? new Date(v.gov.debarment.till) : null,
      },
    });
}

async function seedVendorProfile(v: VendorSeed) {
  const profile = await db.vendorProfile.create({
    data: {
      orgName: v.orgName,
      constitution: v.constitution,
      incorporationDate: new Date("2015-06-18"),
      cin: v.cin,
      pan: v.pan,
      gstin: v.gstin,
      udyamNo: v.udyamNo,
      msmeClass: v.msmeClass,
      startupDpiit: v.startupDpiit,
      epfoCode: v.epfoCode,
      nsicNo: null,
      registeredAddress: v.registeredAddress,
      worksAddress: v.registeredAddress,
      bankAccount: "50" + v.pan.replace(/\D/g, "") + "01",
      bankIfsc: "SBIN0001234",
      turnoverY1: v.turnovers[0],
      turnoverY2: v.turnovers[1],
      turnoverY3: v.turnovers[2],
      netWorth: +(v.turnovers[2] * 0.4).toFixed(2),
      sector: v.sector,
      state: v.state,
      employees: v.employees,
    },
  });
  await db.user.create({
    data: {
      email: v.email,
      passwordHash: await bcrypt.hash(PW, 10),
      name: v.orgName.split(" ").slice(0, 2).join(" ") + " (Vendor)",
      role: "VENDOR",
      vendorId: profile.id,
    },
  });
  return profile;
}

function specFor(v: VendorSeed, kind: SampleSpec["kind"], tampered = false): SampleSpec {
  return {
    kind,
    orgName: v.orgName,
    pan: v.pan,
    gstin: v.gstin,
    udyam: v.udyamNo,
    cin: v.cin,
    udin:
      kind === "TURNOVER_CERT"
        ? "26" + (v.pan.replace(/[^A-Z0-9]/g, "") + "ABCDEFGH").slice(0, 8) + "JKLMNPQR"
        : undefined,
    address: v.registeredAddress,
    turnovers: v.turnovers,
    workValueCr: v.key === "greenfield" ? 0.9 : v.key === "meridian" ? 62 : v.key === "orbit" ? 40 : 8,
    localContentPct:
      v.key === "sunrise" ? 84 : v.key === "greenfield" ? 12 : v.key === "orbit" ? 78 : v.key === "xyz" ? 51 : 62,
    isoValidTill: v.key === "apollo" ? "21/09/2026" : "15/03/2028",
    epfoCode: v.epfoCode,
    epfoMembers: v.gov.epfoMembers ?? v.employees,
    tampered,
  };
}

async function addProfileDoc(vendorId: string, spec: SampleSpec, expiry?: string) {
  const bytes = await generateSample(spec);
  return db.profileDocument.create({
    data: {
      vendorId,
      docType: KIND_TO_DOCTYPE[spec.kind],
      fileName: `${spec.kind}_${spec.orgName.split(" ")[0]}.pdf`,
      mimeType: "application/pdf",
      size: bytes.length,
      sha256: sha(bytes),
      bytes: Buffer.from(bytes),
      expiryDate: expiry ? new Date(expiry) : null,
      status: "VERIFIED",
    },
  });
}

async function addBidDoc(bidId: string, requiredDocId: string | null, declaredType: string, spec: SampleSpec) {
  const bytes = await generateSample(spec);
  return db.bidDocument.create({
    data: {
      bidId,
      requiredDocId,
      declaredType,
      fileName: `${spec.kind}_${spec.orgName.split(" ")[0]}.pdf`,
      mimeType: "application/pdf",
      size: bytes.length,
      sha256: sha(bytes),
      bytes: Buffer.from(bytes),
      status: "UPLOADED",
    },
  });
}

type CritSeed = { label: string; type: string; config: object; mandatory: boolean };
type TenderSeed = {
  refNo: string;
  title: string;
  buyer: string;
  category: string;
  description: string;
  estValueCr: number;
  emdAmount: number;
  localContentClass: string;
  oemAuthRequired: boolean;
  closeInDays: number;
  status?: "PUBLISHED" | "UNDER_EVALUATION";
  criteria: CritSeed[];
  requiredDocs: { docType: string; label: string; mandatory: boolean }[];
};

const RD = (docType: string, label: string, mandatory = true) => ({ docType, label, mandatory });

const TENDERS: TenderSeed[] = [
  {
    refNo: "GEM/2026/B/4471209",
    title: "Supply & Installation of Campus Networking Equipment",
    buyer: "National Institute of Technology, Surat",
    category: "IT Hardware & Networking",
    description:
      "Design, supply, installation, testing and commissioning of campus-wide networking equipment including core and access switches, wireless access points and a network management system, with three years comprehensive on-site warranty.",
    estValueCr: 12.4,
    emdAmount: 1240000,
    localContentClass: "Class-II",
    oemAuthRequired: true,
    closeInDays: -9,
    status: "UNDER_EVALUATION",
    criteria: [
      { label: "Average annual turnover ≥ ₹25 Cr (last 3 FY)", type: "TURNOVER_MIN", config: { minCr: 25, msmeRelaxable: true }, mandatory: true },
      { label: "One similar work of ≥ ₹6 Cr in the last 5 years", type: "EXPERIENCE_VALUE", config: { minCr: 6, startupRelaxable: true }, mandatory: true },
      { label: "Active GST registration", type: "GST_ACTIVE", config: {}, mandatory: true },
      { label: "EPFO compliance for the declared workforce", type: "PF_COMPLIANCE", config: {}, mandatory: true },
      { label: "Local content meeting Class-II supplier threshold", type: "LOCAL_CONTENT_CLASS", config: { class: "Class-II" }, mandatory: true },
      { label: "Valid OEM authorisation for quoted equipment", type: "OEM_AUTH", config: {}, mandatory: true },
      { label: "Not debarred / blacklisted by any authority", type: "NO_DEBARMENT", config: {}, mandatory: true },
      { label: "Valid ISO 9001 quality certification", type: "ISO_VALID", config: {}, mandatory: false },
    ],
    requiredDocs: [
      RD("GST_CERT", "GST Registration Certificate"),
      RD("PAN_CARD", "PAN"),
      RD("UDYAM_CERT", "Udyam / MSME Certificate", false),
      RD("TURNOVER_CERT", "CA-certified Turnover Statement (with UDIN)"),
      RD("OEM_AUTH", "OEM Authorisation Letter"),
      RD("WORK_ORDER", "Similar Work Order / Completion Certificate"),
      RD("EPFO_ECR", "Latest EPFO ECR"),
      RD("MAKE_IN_INDIA", "Local Content Declaration + BoM"),
      RD("ISO_CERT", "ISO 9001 Certificate", false),
    ],
  },
  {
    refNo: "GEM/2026/S/8890114",
    title: "Turnkey Civil Works — Regional Skill Training Centre",
    buyer: "Ministry of Skill Development & Entrepreneurship",
    category: "Civil Infrastructure",
    description:
      "Turnkey construction of a regional skill training centre including structural, architectural, MEP and external development works, on an EPC basis with a defect liability period of 24 months.",
    estValueCr: 58.0,
    emdAmount: 5800000,
    localContentClass: "Class-II",
    oemAuthRequired: false,
    closeInDays: -3,
    status: "UNDER_EVALUATION",
    criteria: [
      { label: "Average annual turnover ≥ ₹50 Cr (last 3 FY)", type: "TURNOVER_MIN", config: { minCr: 50 }, mandatory: true },
      { label: "One similar work of ≥ ₹20 Cr in the last 7 years", type: "EXPERIENCE_VALUE", config: { minCr: 20 }, mandatory: true },
      { label: "Active GST registration", type: "GST_ACTIVE", config: {}, mandatory: true },
      { label: "EPFO compliance for the declared workforce", type: "PF_COMPLIANCE", config: {}, mandatory: true },
      { label: "Not debarred / blacklisted by any authority", type: "NO_DEBARMENT", config: {}, mandatory: true },
      { label: "Local content meeting Class-II supplier threshold", type: "LOCAL_CONTENT_CLASS", config: { class: "Class-II" }, mandatory: false },
    ],
    requiredDocs: [
      RD("GST_CERT", "GST Registration Certificate"),
      RD("PAN_CARD", "PAN"),
      RD("TURNOVER_CERT", "Audited Turnover Statement (with UDIN)"),
      RD("WORK_ORDER", "Similar Work Completion Certificate"),
      RD("EPFO_ECR", "Latest EPFO ECR"),
      RD("MAKE_IN_INDIA", "Local Content Declaration", false),
    ],
  },
  {
    refNo: "GEM/2026/B/4472880",
    title: "Annual Rate Contract — Laboratory Consumables",
    buyer: "Council of Scientific & Industrial Research",
    category: "Laboratory Supplies",
    description:
      "Annual rate contract for supply of laboratory consumables and glassware to CSIR laboratories, with delivery on call-off basis across multiple locations.",
    estValueCr: 4.2,
    emdAmount: 210000,
    localContentClass: "Class-II",
    oemAuthRequired: false,
    closeInDays: 12,
    status: "PUBLISHED",
    criteria: [
      { label: "Average annual turnover ≥ ₹2 Cr (last 3 FY)", type: "TURNOVER_MIN", config: { minCr: 2, msmeRelaxable: true }, mandatory: true },
      { label: "Active GST registration", type: "GST_ACTIVE", config: {}, mandatory: true },
      { label: "Registered as MSME (Udyam)", type: "MSME_REGISTERED", config: {}, mandatory: true },
      { label: "Not debarred / blacklisted by any authority", type: "NO_DEBARMENT", config: {}, mandatory: true },
      { label: "Local content meeting Class-II supplier threshold", type: "LOCAL_CONTENT_CLASS", config: { class: "Class-II" }, mandatory: false },
    ],
    requiredDocs: [
      RD("GST_CERT", "GST Registration Certificate"),
      RD("PAN_CARD", "PAN"),
      RD("UDYAM_CERT", "Udyam / MSME Certificate"),
      RD("TURNOVER_CERT", "CA-certified Turnover Statement"),
      RD("MAKE_IN_INDIA", "Local Content Declaration", false),
    ],
  },
];

const DECLARATIONS = [
  { key: "integrity", label: "Code of Integrity — no bribery, collusion or misrepresentation" },
  { key: "no_blacklist", label: "The firm is not blacklisted or debarred by any Government authority" },
  { key: "authenticity", label: "All uploaded documents are genuine and unaltered" },
  { key: "terms", label: "Accept the tender's terms, conditions and technical specifications" },
];

async function main() {
  console.log("· wiping");
  await wipe();

  console.log("· officers");
  const officer = await db.user.create({
    data: { email: "officer@gem.gov.in", passwordHash: await bcrypt.hash(PW, 10), name: "Rakesh Menon", role: "OFFICER" },
  });
  await db.user.create({
    data: { email: "admin@gem.gov.in", passwordHash: await bcrypt.hash(PW, 10), name: "System Administrator", role: "ADMIN" },
  });

  console.log("· government records + vendor profiles");
  const profiles: Record<string, string> = {};
  for (const v of VENDORS) {
    await seedGov(v);
    const p = await seedVendorProfile(v);
    profiles[v.key] = p.id;
    // vault documents
    await addProfileDoc(p.id, specFor(v, "GST_CERT"));
    await addProfileDoc(p.id, specFor(v, "PAN_CARD"));
    if (v.udyamNo) await addProfileDoc(p.id, specFor(v, "UDYAM_CERT"));
    await addProfileDoc(p.id, specFor(v, "TURNOVER_CERT"));
    await addProfileDoc(p.id, specFor(v, "EPFO_ECR"));
    if (v.key === "apollo")
      await addProfileDoc(p.id, specFor(v, "ISO_CERT"), "2026-09-21");
  }

  console.log("· tenders");
  const tenderIds: Record<string, string> = {};
  for (const t of TENDERS) {
    const close = new Date();
    close.setDate(close.getDate() + t.closeInDays);
    const tender = await db.tender.create({
      data: {
        refNo: t.refNo,
        title: t.title,
        buyer: t.buyer,
        category: t.category,
        description: t.description,
        estValueCr: t.estValueCr,
        emdAmount: t.emdAmount,
        localContentClass: t.localContentClass,
        oemAuthRequired: t.oemAuthRequired,
        closeDate: close,
        status: t.status ?? "PUBLISHED",
        createdById: officer.id,
        criteria: { create: t.criteria.map((c, i) => ({ label: c.label, type: c.type, config: JSON.stringify(c.config), mandatory: c.mandatory, order: i })) },
        requiredDocs: { create: t.requiredDocs.map((d, i) => ({ docType: d.docType, label: d.label, mandatory: d.mandatory, order: i })) },
      },
      include: { requiredDocs: true },
    });
    tenderIds[t.refNo] = tender.id;
    await appendAudit({
      actor: officer.name,
      action: "TENDER_PUBLISHED",
      entityType: "Tender",
      entityId: tender.id,
      summary: `Tender ${tender.refNo} published with ${t.criteria.length} eligibility criteria`,
    });
  }

  // Which vendors bid on which tender, and their doc set / tamper flags
  const BIDS: {
    tender: string;
    vendor: string;
    docs: { kind: SampleSpec["kind"]; tampered?: boolean }[];
    localContentPct: number;
    financialTotalCr: number;
  }[] = [
    {
      tender: "GEM/2026/B/4471209",
      vendor: "apollo",
      localContentPct: 62,
      financialTotalCr: 11.9,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "UDYAM_CERT" }, { kind: "TURNOVER_CERT" },
        { kind: "OEM_AUTH" }, { kind: "WORK_ORDER" }, { kind: "EPFO_ECR" }, { kind: "MAKE_IN_INDIA" }, { kind: "ISO_CERT" },
      ],
    },
    {
      tender: "GEM/2026/B/4471209",
      vendor: "xyz",
      localContentPct: 51,
      financialTotalCr: 11.2,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "UDYAM_CERT" }, { kind: "TURNOVER_CERT" },
        { kind: "OEM_AUTH" }, { kind: "WORK_ORDER" }, { kind: "EPFO_ECR" }, { kind: "MAKE_IN_INDIA" },
      ],
    },
    {
      tender: "GEM/2026/B/4471209",
      vendor: "abc",
      localContentPct: 38,
      financialTotalCr: 9.7,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "UDYAM_CERT" },
        { kind: "TURNOVER_CERT", tampered: true },
        { kind: "OEM_AUTH" }, { kind: "WORK_ORDER" }, { kind: "MAKE_IN_INDIA" },
      ],
    },
    {
      tender: "GEM/2026/B/4471209",
      vendor: "sunrise",
      localContentPct: 84,
      financialTotalCr: 12.1,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "UDYAM_CERT" }, { kind: "TURNOVER_CERT" },
        { kind: "OEM_AUTH" }, { kind: "WORK_ORDER" }, { kind: "EPFO_ECR" }, { kind: "MAKE_IN_INDIA" },
      ],
    },
    {
      tender: "GEM/2026/B/4471209",
      vendor: "technova",
      localContentPct: 55,
      financialTotalCr: 10.4,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "UDYAM_CERT" }, { kind: "TURNOVER_CERT" },
        { kind: "OEM_AUTH" }, { kind: "WORK_ORDER" }, { kind: "EPFO_ECR" }, { kind: "MAKE_IN_INDIA" },
      ],
    },
    {
      tender: "GEM/2026/S/8890114",
      vendor: "meridian",
      localContentPct: 71,
      financialTotalCr: 55.4,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "TURNOVER_CERT" },
        { kind: "WORK_ORDER" }, { kind: "EPFO_ECR" }, { kind: "MAKE_IN_INDIA" },
      ],
    },
    {
      tender: "GEM/2026/S/8890114",
      vendor: "orbit",
      localContentPct: 78,
      financialTotalCr: 57.0,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" }, { kind: "TURNOVER_CERT" },
        { kind: "WORK_ORDER" }, { kind: "EPFO_ECR" }, { kind: "MAKE_IN_INDIA" },
      ],
    },
    {
      tender: "GEM/2026/S/8890114",
      vendor: "greenfield",
      localContentPct: 12,
      financialTotalCr: 48.0,
      docs: [
        { kind: "GST_CERT" }, { kind: "PAN_CARD" },
        { kind: "TURNOVER_CERT", tampered: true }, { kind: "MAKE_IN_INDIA" },
      ],
    },
  ];

  console.log("· bids + verification runs");
  for (const b of BIDS) {
    const v = VENDORS.find((x) => x.key === b.vendor)!;
    const tenderId = tenderIds[b.tender];
    const tender = await db.tender.findUniqueOrThrow({ where: { id: tenderId }, include: { requiredDocs: true } });
    const bid = await db.bid.create({
      data: {
        tenderId,
        vendorId: profiles[b.vendor],
        status: "SUBMITTED",
        wizardStep: 7,
        localContentPct: b.localContentPct,
        financialTotalCr: b.financialTotalCr,
        emdMode: v.msmeClass ? "EXEMPT_MSME" : "PAID",
        makeModel: "As per technical schedule",
        methodology: "Phased delivery with site readiness sign-off before each milestone.",
        bidHash: sha(Buffer.from(`${b.tender}:${b.vendor}:${Date.now()}`)),
        submittedAt: new Date(Date.now() - Math.random() * 6 * 864e5),
      },
    });

    for (const d of b.docs) {
      const rd = tender.requiredDocs.find((r) => r.docType === d.kind) ?? null;
      await addBidDoc(bid.id, rd?.id ?? null, d.kind, specFor(v, d.kind, d.tampered));
    }
    for (const decl of DECLARATIONS) {
      await db.declaration.create({ data: { bidId: bid.id, key: decl.key, label: decl.label, ip: "10.0.0.1" } });
    }
    await appendAudit({
      actor: v.orgName,
      action: "BID_SUBMITTED",
      entityType: "Bid",
      entityId: bid.id,
      summary: `${v.orgName} submitted a bid for ${tender.refNo} with ${b.docs.length} documents`,
    });

    const result = await runVerification(bid.id);
    console.log(`   ${v.orgName.padEnd(34)} → ${String(result.score).padStart(3)}/100  ${result.recommendation}`);
  }

  // A clarification thread on XYZ, a recorded decision on Sunrise + ABC
  console.log("· officer actions");
  const xyzBid = await db.bid.findFirstOrThrow({ where: { vendor: { orgName: { startsWith: "XYZ" } } } });
  await db.clarification.create({
    data: {
      bidId: xyzBid.id,
      officerId: officer.id,
      message:
        "The bill of materials supporting the 51% local-content declaration is not CA-attested. Please upload a CA-attested BoM and an explanation for the delayed GST return filing for Jun 2026.",
      requestedDocType: "MAKE_IN_INDIA",
      status: "OPEN",
    },
  });
  await db.bid.update({ where: { id: xyzBid.id }, data: { status: "CLARIFICATION_REQUESTED" } });
  await appendAudit({
    actor: officer.name,
    action: "CLARIFICATION_REQUESTED",
    entityType: "Bid",
    entityId: xyzBid.id,
    summary: "Officer requested a CA-attested bill of materials and filing explanation",
  });

  const sunriseBid = await db.bid.findFirstOrThrow({ where: { vendor: { orgName: { startsWith: "Sunrise" } } } });
  await db.decision.create({
    data: { bidId: sunriseBid.id, officerId: officer.id, verdict: "QUALIFIED", reason: "All statutory and tender-specific criteria met; Class-I local supplier. No discrepancies." },
  });
  await db.bid.update({ where: { id: sunriseBid.id }, data: { status: "QUALIFIED" } });
  await appendAudit({ actor: officer.name, action: "DECISION_RECORDED", entityType: "Bid", entityId: sunriseBid.id, summary: "Officer recorded: QUALIFIED" });

  const abcBid = await db.bid.findFirstOrThrow({ where: { vendor: { orgName: { startsWith: "ABC" } } } });
  await db.decision.create({
    data: {
      bidId: abcBid.id,
      officerId: officer.id,
      verdict: "DISQUALIFIED",
      reason:
        "GST registration suspended (mandatory), EPFO non-compliant, CA turnover certificate shows tampering with an unverifiable UDIN, and a director is shared with a competing bidder on this tender.",
    },
  });
  await db.bid.update({ where: { id: abcBid.id }, data: { status: "DISQUALIFIED" } });
  await appendAudit({ actor: officer.name, action: "DECISION_RECORDED", entityType: "Bid", entityId: abcBid.id, summary: "Officer recorded: DISQUALIFIED" });

  console.log("\n✔ seed complete");
  console.log("  Officer : officer@gem.gov.in / Demo@12345");
  console.log("  Vendor  : apollo@apollotech.in / Demo@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
