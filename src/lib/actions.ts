"use server";

import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/engine/audit";
import { gateway } from "@/lib/engine/gateway";
import { is_valid_pan, is_valid_gstin } from "@/lib/gst";

// Loaded lazily — the PDF engine (pdf-parse / pdf-lib) must stay out of the
// server-actions module graph or Next fails to build the action bundle.
async function runVerification(bidId: string, actor?: string) {
  const mod = await import("@/lib/engine/run");
  return mod.runVerification(bidId, actor);
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

async function requireVendor() {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR" || !session.user.vendorId) {
    throw new Error("Not authorised");
  }
  return session.user;
}

async function requireOfficer() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "OFFICER" && session.user.role !== "ADMIN")) {
    throw new Error("Not authorised");
  }
  return session.user;
}

/* ------------------------------- auth -------------------------------- */

export async function loginAction(_prev: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: String(formData.get("redirectTo") || "/"),
    });
  } catch (err) {
    if (err instanceof AuthError) return "Invalid email or password.";
    throw err;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/vendor" });
}

/** Generate a 6-digit MPIN not already issued to another vendor. */
async function mintUniqueMpin(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const mpin = String(Math.floor(100000 + Math.random() * 900000));
    const clash = await db.vendorProfile.findUnique({ where: { mpin }, select: { id: true } });
    if (!clash) return mpin;
  }
  throw new Error("Could not allocate an MPIN — please try again.");
}

export async function registerAction(_prev: string | undefined, formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  const role = g("role") === "OFFICER" ? "OFFICER" : "VENDOR";
  const name = g("name");
  const email = g("email").toLowerCase();
  const password = g("password");
  const confirm = g("confirm");

  if (!name || name.length < 2) return "Enter your name / organisation.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirm) return "Passwords do not match.";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return "An account with this email already exists. Please sign in.";

  const passwordHash = await bcrypt.hash(password, 10);

  if (role === "OFFICER") {
    const user = await db.user.create({ data: { email, name, passwordHash, role: "OFFICER" } });
    await appendAudit({
      actor: name,
      action: "ACCOUNT_CREATED",
      entityType: "User",
      entityId: user.id,
      summary: `New procurement-officer account registered: ${email}`,
    });
    try {
      await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    } catch (err) {
      if (err instanceof AuthError) return "Account created — please sign in.";
      throw err;
    }
    return undefined;
  }

  // ---- vendor: full statutory registration ----
  const pan = g("pan").toUpperCase();
  const gstin = g("gstin").toUpperCase();
  const cin = g("cin").toUpperCase();
  const constitution = g("constitution") || "Private Limited Company";
  const registeredAddress = g("registeredAddress");
  const state = g("state");
  const sector = g("sector");
  const aadhaar = g("aadhaar").replace(/\s+/g, "");
  const isMsme = g("isMsme") === "yes";
  const udyamNo = g("udyamNo").toUpperCase();
  const msmeClass = g("msmeClass");
  const turnoverCr = Number(g("turnoverCr"));
  const caUdin = g("caUdin").toUpperCase();
  const miiPct = Number(g("miiPct"));
  const directorName = g("directorName");
  const directorDin = g("directorDin");

  if (!is_valid_pan(pan)) return "PAN format is invalid (AAAAA0000A).";
  if (!is_valid_gstin(gstin)) return "GSTIN is invalid — the checksum digit does not verify.";
  if (gstin.slice(2, 12) !== pan) return "GSTIN does not embed the PAN you entered (characters 3–12 must equal the PAN).";
  if (cin && !/^[LUu]\d{5}[A-Za-z]{2}\d{4}[A-Za-z]{3}\d{6}$/.test(cin)) return "CIN format is invalid (21 characters, e.g. U72900KA2015PTC000001).";
  if (!registeredAddress || registeredAddress.length < 10) return "Enter the full registered address.";
  if (!state) return "Select your state / UT.";
  if (aadhaar && !/^\d{12}$/.test(aadhaar)) return "Aadhaar of the authorised signatory must be 12 digits.";
  if (isMsme && !/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(udyamNo)) return "Enter a valid Udyam number (UDYAM-XX-00-0000000) or set MSME to No.";
  if (isMsme && !msmeClass) return "Select your MSME class (Micro / Small / Medium).";
  if (!Number.isFinite(turnoverCr) || turnoverCr < 0) return "Enter last financial year turnover in ₹ crore.";
  if (!Number.isFinite(miiPct) || miiPct < 0 || miiPct > 100) return "Make-in-India local content must be between 0 and 100.";
  if (!directorName) return "Enter the name of an authorised director / signatory.";
  if (!/^\d{8}$/.test(directorDin)) return "Director DIN must be 8 digits.";

  const dupPan = await db.vendorProfile.findFirst({ where: { pan }, select: { id: true } });
  if (dupPan) return "A vendor with this PAN is already registered.";

  const aadhaarMasked = aadhaar ? `XXXX XXXX ${aadhaar.slice(-4)}` : "";
  const mpin = await mintUniqueMpin();

  const { appendRegistryRecord } = await import("@/lib/registry");
  let registryBidderId: string | null = null;
  try {
    const r = await appendRegistryRecord({
      companyName: name,
      loginEmail: email,
      aadhaarMasked,
      pan,
      gstin,
      cin,
      isMsme,
      udyamNo: isMsme ? udyamNo : "",
      turnoverCr,
      caUdin,
      miiPct,
      directorName,
      directorDin,
      registeredAddress,
    });
    registryBidderId = r.bidderId;
  } catch {
    // Registry file not writable in this environment — continue; the account is still created.
    registryBidderId = null;
  }

  const profile = await db.vendorProfile.create({
    data: {
      orgName: name,
      constitution,
      cin: cin || null,
      pan,
      gstin,
      udyamNo: isMsme ? udyamNo : null,
      msmeClass: isMsme ? msmeClass : null,
      registeredAddress,
      state,
      sector: sector || null,
      turnoverY3: turnoverCr,
      aadhaarMasked: aadhaarMasked || null,
      directorName,
      directorDin,
      caUdin: caUdin || null,
      miiPct: Math.round(miiPct),
      registryBidderId,
      mpin,
      mpinIssuedAt: new Date(),
    },
  });
  await db.user.create({ data: { email, name, passwordHash, role: "VENDOR", vendorId: profile.id } });
  await appendAudit({
    actor: name,
    action: "ACCOUNT_CREATED",
    entityType: "VendorProfile",
    entityId: profile.id,
    summary: `New vendor registered: ${email}${registryBidderId ? ` (registry ${registryBidderId})` : ""}`,
    payload: { pan, gstin, isMsme, registryBidderId },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding/mpin" });
  } catch (err) {
    if (err instanceof AuthError) return "Account created — please sign in.";
    throw err;
  }
  return undefined;
}

/* ------------------------------- MPIN -------------------------------- */

/** One-time confirmation after registration that the vendor saved their MPIN. */
export async function acknowledgeMpin() {
  const user = await requireVendor();
  await db.vendorProfile.update({ where: { id: user.vendorId! }, data: { mpinAckAt: new Date() } });
  revalidatePath("/vendor");
  redirect("/vendor");
}

/** Reveal the MPIN on the profile page — only after the account password re-verifies. */
export async function revealMpin(password: string): Promise<{ ok: true; mpin: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.vendorId) return { ok: false, error: "Not authorised" };
  const account = await db.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!account) return { ok: false, error: "Account not found" };
  const good = await bcrypt.compare(password, account.passwordHash);
  if (!good) return { ok: false, error: "Password is incorrect." };
  const profile = await db.vendorProfile.findUnique({
    where: { id: session.user.vendorId },
    select: { mpin: true },
  });
  if (!profile?.mpin) return { ok: false, error: "No MPIN on file — contact support." };
  await appendAudit({
    actor: session.user.name ?? "Vendor",
    action: "MPIN_VIEWED",
    entityType: "VendorProfile",
    entityId: session.user.vendorId,
    summary: "Vendor revealed their MPIN after password re-verification",
  });
  return { ok: true, mpin: profile.mpin };
}

/* ------------------------------ vendor ------------------------------- */

export async function startBid(tenderId: string, formData?: FormData) {
  const user = await requireVendor();
  const existing = await db.bid.findUnique({
    where: { tenderId_vendorId: { tenderId, vendorId: user.vendorId! } },
  });
  if (existing) redirect(`/vendor/bids/${existing.id}`);

  const profile = await db.vendorProfile.findUniqueOrThrow({
    where: { id: user.vendorId! },
    select: { mpin: true },
  });
  const entered = String(formData?.get("mpin") ?? "").trim();
  if (!profile.mpin) {
    return "Your account has no MPIN yet — complete registration first.";
  }
  if (entered !== profile.mpin) {
    await appendAudit({
      actor: user.name ?? "Vendor",
      action: "MPIN_REJECTED",
      entityType: "Tender",
      entityId: tenderId,
      summary: "Incorrect MPIN entered when starting a bid",
    });
    return "Incorrect MPIN. Enter the 6-digit MPIN issued at registration.";
  }

  const bid = await db.bid.create({ data: { tenderId, vendorId: user.vendorId!, status: "DRAFT" } });
  await appendAudit({
    actor: user.name ?? "Vendor",
    action: "BID_STARTED",
    entityType: "Bid",
    entityId: bid.id,
    summary: `Draft bid created — MPIN verified`,
  });
  redirect(`/vendor/bids/${bid.id}`);
}

export async function saveBidStep(bidId: string, data: {
  step?: number;
  localContentPct?: number;
  financialTotalCr?: number;
  emdMode?: string;
  makeModel?: string;
  methodology?: string;
  criterionResponses?: { criterionId: string; complied: boolean; mappedDocId?: string }[];
  declarations?: { key: string; label: string }[];
}) {
  const user = await requireVendor();
  const bid = await db.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.vendorId !== user.vendorId) throw new Error("Not found");
  if (bid.status !== "DRAFT") throw new Error("Bid already submitted");

  await db.bid.update({
    where: { id: bidId },
    data: {
      wizardStep: data.step ?? bid.wizardStep,
      localContentPct: data.localContentPct ?? bid.localContentPct,
      financialTotalCr: data.financialTotalCr ?? bid.financialTotalCr,
      emdMode: data.emdMode ?? bid.emdMode,
      makeModel: data.makeModel ?? bid.makeModel,
      methodology: data.methodology ?? bid.methodology,
    },
  });

  if (data.criterionResponses) {
    for (const r of data.criterionResponses) {
      await db.bidCriterionResponse.upsert({
        where: { bidId_criterionId: { bidId, criterionId: r.criterionId } },
        create: { bidId, criterionId: r.criterionId, complied: r.complied, mappedDocId: r.mappedDocId },
        update: { complied: r.complied, mappedDocId: r.mappedDocId },
      });
    }
  }
  if (data.declarations) {
    await db.declaration.deleteMany({ where: { bidId } });
    await db.declaration.createMany({
      data: data.declarations.map((d) => ({ bidId, key: d.key, label: d.label, ip: "127.0.0.1" })),
    });
  }
  revalidatePath(`/vendor/bids/${bidId}`);
}

export async function uploadBidDocument(bidId: string, formData: FormData) {
  const user = await requireVendor();
  const bid = await db.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.vendorId !== user.vendorId) throw new Error("Not found");

  const file = formData.get("file") as File | null;
  const declaredType = String(formData.get("declaredType") || "UNKNOWN");
  const requiredDocId = (formData.get("requiredDocId") as string) || null;
  const profileDocId = (formData.get("profileDocId") as string) || null;

  let bytes: Buffer;
  let fileName: string;
  let mimeType = "application/pdf";

  if (profileDocId) {
    const pd = await db.profileDocument.findUnique({ where: { id: profileDocId } });
    if (!pd || pd.vendorId !== user.vendorId) throw new Error("Vault document not found");
    bytes = Buffer.from(pd.bytes);
    fileName = pd.fileName;
    mimeType = pd.mimeType;
  } else if (file && file.size > 0) {
    bytes = Buffer.from(await file.arrayBuffer());
    fileName = file.name;
    mimeType = file.type || "application/pdf";
  } else {
    throw new Error("No file provided");
  }
  if (bytes.length > 8_000_000) throw new Error("File exceeds 8 MB");

  await db.bidDocument.deleteMany({
    where: { bidId, requiredDocId: requiredDocId ?? undefined, declaredType: requiredDocId ? undefined : declaredType },
  });

  // Best-effort read + live source check. A flaky OCR / gateway call must NEVER
  // lose the uploaded file — we persist the document no matter what, and attach
  // whatever we could extract as metadata.
  let extractedFields: Record<string, unknown> = {};
  let confidence = 0;
  let pages = 0;
  let extractionOk = false;
  let sourceCheck: { label: string; ok: boolean; detail: string } | null = null;
  let readError: string | undefined;

  try {
    const { extractDocument } = await import("@/lib/engine/extract");
    const extraction = await extractDocument(bytes, declaredType);
    extractedFields = extraction.fields;
    confidence = extraction.confidence;
    pages = extraction.pages;
    extractionOk = extraction.ok;
    readError = extraction.error;

    const f = extraction.fields;
    try {
      if (f.gstin) {
        const g = await gateway.gstin(f.gstin);
        sourceCheck = { label: "GSTN", ok: g.found && g.status === "Active", detail: g.found ? `GSTIN ${f.gstin} — ${g.status}` : "GSTIN not found" };
      } else if (f.pan) {
        const p = await gateway.pan(f.pan);
        sourceCheck = { label: "Income Tax", ok: p.found && p.status === "ACTIVE", detail: p.found ? `PAN ${f.pan} — ${p.status}` : "PAN not found" };
      } else if (f.udyam) {
        const u = await gateway.udyam(f.udyam);
        sourceCheck = { label: "Udyam", ok: u.found, detail: u.found ? `${f.udyam} — valid` : "Udyam number not found" };
      }
    } catch (err) {
      sourceCheck = null;
      readError = readError ?? (err instanceof Error ? err.message : "source check unavailable");
    }
  } catch (err) {
    readError = err instanceof Error ? err.message : "document could not be read";
  }

  const doc = await db.bidDocument.create({
    data: {
      bidId,
      requiredDocId,
      profileDocId,
      declaredType,
      fileName,
      mimeType,
      size: bytes.length,
      sha256: sha(bytes),
      bytes: new Uint8Array(bytes),
      extractedJson: JSON.stringify({
        ...extractedFields,
        _meta: { confidence, pages, sourceCheck, readError },
      }),
      status: extractionOk ? "EXTRACTED" : "UPLOADED",
    },
  });
  revalidatePath(`/vendor/bids/${bidId}`);
  return { id: doc.id, fileName, status: doc.status, read: extractionOk };
}

export async function removeBidDocument(docId: string) {
  const user = await requireVendor();
  const doc = await db.bidDocument.findUnique({ where: { id: docId }, include: { bid: true } });
  if (!doc || doc.bid.vendorId !== user.vendorId) throw new Error("Not found");
  if (doc.bid.status !== "DRAFT") throw new Error("Bid already submitted");
  await db.bidDocument.delete({ where: { id: docId } });
  revalidatePath(`/vendor/bids/${doc.bidId}`);
}

export async function submitBid(bidId: string) {
  const user = await requireVendor();
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: { tender: { include: { requiredDocs: true } }, documents: true, declarations: true },
  });
  if (!bid || bid.vendorId !== user.vendorId) throw new Error("Not found");
  if (bid.status !== "DRAFT") throw new Error("Already submitted");

  const missing = bid.tender.requiredDocs
    .filter((rd) => rd.mandatory && !bid.documents.some((d) => d.requiredDocId === rd.id || d.declaredType === rd.docType))
    .map((rd) => rd.label);
  if (missing.length) throw new Error(`Missing mandatory documents: ${missing.join(", ")}`);
  if (bid.declarations.length < 4) throw new Error("All declarations must be accepted");

  const hash = sha(Buffer.from(`${bid.id}:${Date.now()}:${bid.documents.map((d) => d.sha256).join(",")}`));
  await db.bid.update({
    where: { id: bidId },
    data: { status: "SUBMITTED", submittedAt: new Date(), bidHash: hash, wizardStep: 7 },
  });
  await appendAudit({
    actor: user.name ?? "Vendor",
    action: "BID_SUBMITTED",
    entityType: "Bid",
    entityId: bid.id,
    summary: `Bid submitted for ${bid.tender.refNo} with ${bid.documents.length} documents`,
    payload: { hash },
  });

  await runVerification(bid.id);
  revalidatePath(`/vendor/bids/${bidId}`);
  revalidatePath("/dashboard");
  redirect(`/vendor/bids/${bidId}`);
}

export async function respondToClarification(clarId: string, message: string, formData?: FormData) {
  const user = await requireVendor();
  const clar = await db.clarification.findUnique({ where: { id: clarId }, include: { bid: true } });
  if (!clar || clar.bid.vendorId !== user.vendorId) throw new Error("Not found");

  let responseDocId: string | undefined;
  const file = formData?.get("file") as File | null;
  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const doc = await db.bidDocument.create({
      data: {
        bidId: clar.bidId,
        declaredType: clar.requestedDocType ?? "UNKNOWN",
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        size: bytes.length,
        sha256: sha(bytes),
        bytes,
        status: "UPLOADED",
      },
    });
    responseDocId = doc.id;
  }

  await db.clarification.update({
    where: { id: clarId },
    data: { response: message, responseDocId, status: "RESPONDED", respondedAt: new Date() },
  });
  await db.bid.update({ where: { id: clar.bidId }, data: { status: "UNDER_VERIFICATION" } });
  await appendAudit({
    actor: user.name ?? "Vendor",
    action: "CLARIFICATION_RESPONDED",
    entityType: "Bid",
    entityId: clar.bidId,
    summary: `Vendor responded to clarification${responseDocId ? " with a new document" : ""}`,
  });
  await runVerification(clar.bidId);
  revalidatePath(`/vendor/bids/${clar.bidId}`);
  revalidatePath(`/dashboard/bids/${clar.bidId}`);
}

export async function withdrawBid(bidId: string) {
  const user = await requireVendor();
  const bid = await db.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.vendorId !== user.vendorId) throw new Error("Not found");
  await db.bid.update({ where: { id: bidId }, data: { status: "WITHDRAWN" } });
  await appendAudit({ actor: user.name ?? "Vendor", action: "BID_WITHDRAWN", entityType: "Bid", entityId: bidId, summary: "Bid withdrawn by vendor" });
  revalidatePath(`/vendor/bids/${bidId}`);
}

/* ------------------- vendor: profile edits & document vault ----------- */
/* Both require Officer/Admin approval before the change takes effect —   */
/* see reviewProfileChangeRequest / reviewVaultDocument below.            */

const PROFILE_EDITABLE_FIELDS = [
  "orgName",
  "constitution",
  "cin",
  "registeredAddress",
  "worksAddress",
  "pan",
  "gstin",
  "udyamNo",
  "startupDpiit",
  "epfoCode",
  "turnoverY1",
  "turnoverY2",
  "turnoverY3",
  "netWorth",
  "bankAccount",
  "bankIfsc",
  "employees",
  "sector",
  "state",
] as const;
type ProfileField = (typeof PROFILE_EDITABLE_FIELDS)[number];
const NUMERIC_PROFILE_FIELDS = new Set<ProfileField>(["turnoverY1", "turnoverY2", "turnoverY3", "netWorth", "employees"]);

export async function submitProfileChangeRequest(_prev: string | undefined, formData: FormData) {
  const user = await requireVendor();

  const existingPending = await db.profileChangeRequest.findFirst({
    where: { vendorId: user.vendorId!, status: "PENDING" },
  });
  if (existingPending) return "You already have a change request awaiting admin approval.";

  const profile = await db.vendorProfile.findUniqueOrThrow({ where: { id: user.vendorId! } });
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of PROFILE_EDITABLE_FIELDS) {
    if (!formData.has(field)) continue;
    const raw = String(formData.get(field) ?? "").trim();
    const current = (profile as unknown as Record<ProfileField, unknown>)[field];

    let next: string | number | null = raw === "" ? null : raw;
    if (NUMERIC_PROFILE_FIELDS.has(field)) {
      if (raw === "") {
        next = null;
      } else {
        const n = Number(raw);
        if (Number.isNaN(n)) return `Enter a valid number for ${field}.`;
        next = n;
      }
    }

    const currentCmp = current instanceof Date ? current.toISOString() : (current ?? null);
    if (currentCmp === next) continue;
    changes[field] = { from: currentCmp, to: next };
  }

  if (changes.pan && !is_valid_pan(String(changes.pan.to))) return "Enter a valid PAN (AAAAA0000A).";
  if (changes.gstin && !is_valid_gstin(String(changes.gstin.to)))
    return "Enter a valid GSTIN — the checksum digit does not verify.";
  if (Object.keys(changes).length === 0) return "No changes to submit.";

  const note = String(formData.get("note") ?? "").trim() || null;

  const reqRow = await db.profileChangeRequest.create({
    data: { vendorId: user.vendorId!, requestedById: user.id, changes: JSON.stringify(changes), note },
  });

  await appendAudit({
    actor: user.name ?? "Vendor",
    action: "PROFILE_CHANGE_REQUESTED",
    entityType: "ProfileChangeRequest",
    entityId: reqRow.id,
    summary: `Requested ${Object.keys(changes).length} field change(s) to the company profile`,
    payload: changes,
  });

  revalidatePath("/vendor/profile");
  return undefined;
}

export async function uploadVaultDocument(_prev: string | undefined, formData: FormData) {
  const user = await requireVendor();
  const file = formData.get("file") as File | null;
  const docType = String(formData.get("docType") || "");
  if (!docType) return "Choose a document type.";
  if (!file || file.size === 0) return "Choose a file to upload.";
  if (file.size > 8_000_000) return "File exceeds 8 MB.";

  const bytes = Buffer.from(await file.arrayBuffer());

  let extractedJson = "{}";
  let status: "EXTRACTED" | "UPLOADED" = "UPLOADED";
  try {
    const { extractDocument } = await import("@/lib/engine/extract");
    const extraction = await extractDocument(bytes, docType);
    extractedJson = JSON.stringify({
      ...extraction.fields,
      _meta: { confidence: extraction.confidence, pages: extraction.pages },
    });
    status = extraction.ok ? "EXTRACTED" : "UPLOADED";
  } catch {
    // best-effort — the file is stored regardless of whether it could be read
  }

  const doc = await db.profileDocument.create({
    data: {
      vendorId: user.vendorId!,
      docType,
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      size: bytes.length,
      sha256: sha(bytes),
      bytes: new Uint8Array(bytes),
      extractedJson,
      status,
      approvalStatus: "PENDING",
    },
  });

  await appendAudit({
    actor: user.name ?? "Vendor",
    action: "DOCUMENT_UPLOADED",
    entityType: "ProfileDocument",
    entityId: doc.id,
    summary: `${file.name} uploaded to the document vault — pending admin approval`,
  });

  revalidatePath("/vendor/vault");
  return undefined;
}

/* ------------------------------ officer ------------------------------ */

export async function rerunVerification(bidId: string) {
  const user = await requireOfficer();
  await runVerification(bidId, `${user.name} (re-run)`);
  revalidatePath(`/dashboard/bids/${bidId}`);
}

export async function requestClarification(bidId: string, message: string, requestedDocType?: string) {
  const user = await requireOfficer();
  await db.clarification.create({
    data: { bidId, officerId: user.id, message, requestedDocType: requestedDocType || null, status: "OPEN" },
  });
  await db.bid.update({ where: { id: bidId }, data: { status: "CLARIFICATION_REQUESTED" } });
  await appendAudit({ actor: user.name ?? "Officer", action: "CLARIFICATION_REQUESTED", entityType: "Bid", entityId: bidId, summary: message.slice(0, 120) });
  revalidatePath(`/dashboard/bids/${bidId}`);
}

export async function setDocumentReview(bidDocId: string, action: "ACCEPTED" | "REJECTED" | "CLARIFY", note?: string) {
  const user = await requireOfficer();
  const doc = await db.bidDocument.update({ where: { id: bidDocId }, data: { officerAction: action, officerNote: note || null } });
  await appendAudit({ actor: user.name ?? "Officer", action: "DOCUMENT_REVIEWED", entityType: "BidDocument", entityId: bidDocId, summary: `${doc.fileName}: ${action}` });
  revalidatePath(`/dashboard/bids/${doc.bidId}`);
}

/** Notify every login account attached to a vendor company. */
async function notifyVendor(
  vendorId: string,
  n: { kind: string; title: string; body: string; href?: string; bidId?: string },
) {
  const users = await db.user.findMany({ where: { vendorId }, select: { id: true } });
  if (users.length === 0) return;
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href ?? null,
      bidId: n.bidId ?? null,
    })),
  });
}

/** Shared decision path — records the Decision, moves the bid, audits, notifies. */
async function applyDecision(
  bidId: string,
  verdict: "QUALIFIED" | "DISQUALIFIED",
  reason: string,
  officer: { id: string; name?: string | null },
  origin: "officer" | "ai-accepted",
) {
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: { tender: { select: { refNo: true, title: true } } },
  });
  if (!bid) throw new Error("Bid not found");

  await db.decision.upsert({
    where: { bidId },
    create: { bidId, officerId: officer.id, verdict, reason },
    update: { verdict, reason, decidedAt: new Date() },
  });
  await db.bid.update({ where: { id: bidId }, data: { status: verdict } });
  await appendAudit({
    actor: officer.name ?? "Officer",
    action: origin === "ai-accepted" ? "DECISION_RECORDED_AI_ACCEPTED" : "DECISION_RECORDED",
    entityType: "Bid",
    entityId: bidId,
    summary: `${verdict} on ${bid.tender.refNo}${origin === "ai-accepted" ? " (AI recommendation accepted)" : ""}`,
    payload: { reason, origin },
  });

  await notifyVendor(bid.vendorId, {
    kind: verdict === "DISQUALIFIED" ? "BID_DISQUALIFIED" : "BID_QUALIFIED",
    title:
      verdict === "DISQUALIFIED"
        ? `Bid not qualified — ${bid.tender.refNo}`
        : `Bid qualified — ${bid.tender.refNo}`,
    body:
      verdict === "DISQUALIFIED"
        ? `Your bid for "${bid.tender.title}" was not taken forward. Reason: ${reason}`
        : `Your bid for "${bid.tender.title}" has been qualified for technical evaluation.`,
    href: `/vendor/bids/${bidId}`,
    bidId,
  });

  revalidatePath(`/dashboard/bids/${bidId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bulk-verification");
  revalidatePath("/vendor");
  revalidatePath("/vendor/bids");
}

export async function recordDecision(bidId: string, verdict: "QUALIFIED" | "DISQUALIFIED", reason: string) {
  const user = await requireOfficer();
  await applyDecision(bidId, verdict, reason, user, "officer");
}

const RECO_TO_VERDICT: Record<string, "QUALIFIED" | "DISQUALIFIED" | null> = {
  Recommended: "QUALIFIED",
  "Not Recommended": "DISQUALIFIED",
  "Review Required": null,
};

/** Build the officer-facing reason string from the engine's own output. */
function reasonFromRun(run: {
  recommendation: string;
  score: number;
  rationale: string;
  checks: { label: string; status: string; detail: string }[];
}) {
  const blockers = run.checks.filter((c) => c.status === "failed");
  const head =
    run.recommendation === "Recommended"
      ? `AI recommendation accepted — compliance score ${run.score}/100, no blocking checks.`
      : `AI recommendation accepted — compliance score ${run.score}/100.`;
  const detail = blockers.length
    ? " Blocking checks: " + blockers.map((c) => `${c.label} (${c.detail})`).join("; ") + "."
    : "";
  return (head + detail).slice(0, 900);
}

/** Officer accepts the engine's recommendation for one bid, as-is. */
export async function acceptAiRecommendation(bidId: string) {
  const user = await requireOfficer();
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: { runs: { orderBy: { startedAt: "desc" }, take: 1, include: { checks: true } } },
  });
  const run = bid?.runs[0];
  if (!bid || !run) throw new Error("This bid has not been verified yet");
  const verdict = RECO_TO_VERDICT[run.recommendation];
  if (!verdict) {
    throw new Error('"Review Required" bids need a manual decision — open the dossier');
  }
  await applyDecision(bidId, verdict, reasonFromRun(run), user, "ai-accepted");
  return { verdict };
}

/** Officer accepts every clear AI recommendation on a tender in one pass. */
export async function acceptAllAiRecommendations(tenderId: string) {
  const user = await requireOfficer();
  const bids = await db.bid.findMany({
    where: { tenderId, status: { notIn: ["DRAFT", "WITHDRAWN"] }, decision: null },
    include: { runs: { orderBy: { startedAt: "desc" }, take: 1, include: { checks: true } } },
  });
  let qualified = 0;
  let disqualified = 0;
  let skipped = 0;
  for (const bid of bids) {
    const run = bid.runs[0];
    const verdict = run ? RECO_TO_VERDICT[run.recommendation] : null;
    if (!run || !verdict) {
      skipped++;
      continue;
    }
    await applyDecision(bid.id, verdict, reasonFromRun(run), user, "ai-accepted");
    verdict === "QUALIFIED" ? qualified++ : disqualified++;
  }
  revalidatePath("/dashboard/bulk-verification");
  return { qualified, disqualified, skipped };
}

/* --------------------------- notifications --------------------------- */

export async function markNotificationsRead(ids?: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authorised");
  await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  revalidatePath("/vendor");
}

/* --------------------- officer: vendor change approvals --------------- */

export async function reviewProfileChangeRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
) {
  const officer = await requireOfficer();
  const reqRow = await db.profileChangeRequest.findUnique({ where: { id } });
  if (!reqRow || reqRow.status !== "PENDING") throw new Error("Not found or already reviewed");

  if (decision === "APPROVED") {
    const changes = JSON.parse(reqRow.changes) as Record<string, { from: unknown; to: unknown }>;
    const data: Record<string, unknown> = {};
    for (const [field, diff] of Object.entries(changes)) data[field] = diff.to;
    await db.vendorProfile.update({ where: { id: reqRow.vendorId }, data });
  }

  await db.profileChangeRequest.update({
    where: { id },
    data: { status: decision, reviewedById: officer.id, reviewedAt: new Date(), reviewNote: note || null },
  });

  await appendAudit({
    actor: officer.name ?? "Officer",
    action: decision === "APPROVED" ? "PROFILE_CHANGE_APPROVED" : "PROFILE_CHANGE_REJECTED",
    entityType: "ProfileChangeRequest",
    entityId: id,
    summary: note || `Profile change request ${decision.toLowerCase()}`,
  });

  revalidatePath("/dashboard/approvals");
  revalidatePath("/vendor/profile");
}

export async function reviewVaultDocument(
  docId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
) {
  const officer = await requireOfficer();
  const doc = await db.profileDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.approvalStatus !== "PENDING") throw new Error("Not found or already reviewed");

  await db.profileDocument.update({
    where: { id: docId },
    data: { approvalStatus: decision, reviewedById: officer.id, reviewedAt: new Date(), reviewNote: note || null },
  });

  await appendAudit({
    actor: officer.name ?? "Officer",
    action: decision === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
    entityType: "ProfileDocument",
    entityId: docId,
    summary: note || `Vault document ${decision.toLowerCase()}`,
  });

  revalidatePath("/dashboard/approvals");
  revalidatePath("/vendor/vault");
}

export async function createTender(formData: FormData) {
  const user = await requireOfficer();
  const g = (k: string) => String(formData.get(k) ?? "");
  const refNo = g("refNo") || `GEM/2026/B/${Math.floor(1000000 + Math.random() * 8999999)}`;
  const closeDate = new Date(g("closeDate") || Date.now() + 14 * 864e5);

  const criteria: { label: string; type: string; config: string; mandatory: boolean }[] = [];
  const add = (on: string, label: string, type: string, config: object, mandatory = true) => {
    if (formData.get(on)) criteria.push({ label, type, config: JSON.stringify(config), mandatory });
  };
  const minTurnover = Number(g("minTurnover") || 0);
  const minExp = Number(g("minExperience") || 0);
  if (minTurnover > 0) criteria.push({ label: `Average annual turnover ≥ ₹${minTurnover} Cr (last 3 FY)`, type: "TURNOVER_MIN", config: JSON.stringify({ minCr: minTurnover, msmeRelaxable: !!formData.get("relaxMsme") }), mandatory: true });
  if (minExp > 0) criteria.push({ label: `One similar work of ≥ ₹${minExp} Cr`, type: "EXPERIENCE_VALUE", config: JSON.stringify({ minCr: minExp, startupRelaxable: !!formData.get("relaxStartup") }), mandatory: true });
  add("reqGst", "Active GST registration", "GST_ACTIVE", {});
  add("reqPf", "EPFO compliance for the declared workforce", "PF_COMPLIANCE", {});
  add("reqDebar", "Not debarred / blacklisted by any authority", "NO_DEBARMENT", {});
  add("reqOem", "Valid OEM authorisation", "OEM_AUTH", {});
  add("reqLocal", `Local content meeting ${g("localClass") || "Class-II"} threshold`, "LOCAL_CONTENT_CLASS", { class: g("localClass") || "Class-II" });
  add("reqIso", "Valid ISO 9001 certification", "ISO_VALID", {}, false);

  const docTypes = ["GST_CERT", "PAN_CARD", "TURNOVER_CERT", "EPFO_ECR", "MAKE_IN_INDIA"];
  if (formData.get("reqOem")) docTypes.push("OEM_AUTH");
  if (minExp > 0) docTypes.push("WORK_ORDER");
  if (formData.get("reqIso")) docTypes.push("ISO_CERT");

  const tender = await db.tender.create({
    data: {
      refNo,
      title: g("title"),
      buyer: g("buyer"),
      category: g("category") || "General",
      description: g("description"),
      estValueCr: Number(g("estValueCr") || 1),
      emdAmount: Number(g("emdAmount") || 0),
      localContentClass: g("localClass") || "Class-II",
      oemAuthRequired: !!formData.get("reqOem"),
      closeDate,
      status: "PUBLISHED",
      createdById: user.id,
      criteria: { create: criteria.map((c, i) => ({ ...c, order: i })) },
      requiredDocs: {
        create: docTypes.map((d, i) => ({
          docType: d,
          label: d.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()),
          mandatory: d !== "ISO_CERT",
          order: i,
        })),
      },
    },
  });
  await appendAudit({ actor: user.name ?? "Officer", action: "TENDER_PUBLISHED", entityType: "Tender", entityId: tender.id, summary: `Published ${tender.refNo}` });
  revalidatePath("/dashboard/tenders");
  redirect(`/dashboard/tenders/${tender.id}`);
}
