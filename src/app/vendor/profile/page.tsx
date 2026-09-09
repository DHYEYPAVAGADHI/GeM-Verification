import { CheckCircle2, CircleAlert } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { gateway } from "@/lib/engine/gateway";
import { inr } from "@/lib/utils";
import { ProfileChangeForm, type PendingChange, type ReviewedChange } from "@/components/vendor/profile-change-form";

function Verified({ ok, source }: { ok: boolean; source: string }) {
  return ok ? (
    <span className="chip bg-risk-low-bg text-risk-low">
      <CheckCircle2 className="h-3 w-3" /> Verified · {source}
    </span>
  ) : (
    <span className="chip bg-risk-review-bg text-risk-review">
      <CircleAlert className="h-3 w-3" /> Not verified
    </span>
  );
}

function Row({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="flex items-center gap-3">
        <span className="data text-sm font-medium text-ink">{value || "—"}</span>
        {badge}
      </span>
    </div>
  );
}

export default async function VendorProfilePage() {
  const session = await auth();
  const profile = await db.vendorProfile.findUniqueOrThrow({
    where: { id: session!.user.vendorId! },
    include: { documents: true },
  });

  const [pan, gst, udyam, mca, epfo, dpiit, pendingRow, lastReviewedRow] = await Promise.all([
    gateway.pan(profile.pan),
    gateway.gstin(profile.gstin),
    gateway.udyam(profile.udyamNo),
    gateway.mca(profile.cin),
    gateway.epfo(profile.epfoCode),
    gateway.dpiit(profile.startupDpiit),
    db.profileChangeRequest.findFirst({
      where: { vendorId: profile.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.profileChangeRequest.findFirst({
      where: { vendorId: profile.id, status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);

  const pending: PendingChange | null = pendingRow
    ? {
        id: pendingRow.id,
        changes: JSON.parse(pendingRow.changes),
        note: pendingRow.note,
        createdAt: pendingRow.createdAt.toISOString(),
      }
    : null;
  const lastReviewed: ReviewedChange | null = lastReviewedRow
    ? {
        id: lastReviewedRow.id,
        status: lastReviewedRow.status as "APPROVED" | "REJECTED",
        reviewNote: lastReviewedRow.reviewNote,
        reviewedAt: lastReviewedRow.reviewedAt?.toISOString() ?? null,
      }
    : null;

  const avgTurnover = ((profile.turnoverY1 ?? 0) + (profile.turnoverY2 ?? 0) + (profile.turnoverY3 ?? 0)) / 3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Company Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your digital vendor file. Every registration is checked live against its source.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Entity</h2>
          <div className="mt-2">
            <Row label="Legal name" value={profile.orgName} />
            <Row label="Constitution" value={profile.constitution} />
            <Row label="CIN" value={profile.cin} badge={profile.cin ? <Verified ok={mca.found && mca.status === "Active"} source="MCA21" /> : undefined} />
            <Row label="Registered address" value={profile.registeredAddress} />
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Statutory registrations</h2>
          <div className="mt-2">
            <Row label="PAN" value={profile.pan} badge={<Verified ok={pan.found && pan.status === "ACTIVE"} source="Income Tax" />} />
            <Row label="GSTIN" value={profile.gstin} badge={<Verified ok={gst.found && gst.status === "Active"} source="GSTN" />} />
            <Row label="Udyam" value={profile.udyamNo} badge={profile.udyamNo ? <Verified ok={udyam.found} source="Udyam" /> : undefined} />
            <Row label="DPIIT Startup" value={profile.startupDpiit} badge={profile.startupDpiit ? <Verified ok={dpiit.found} source="DPIIT" /> : undefined} />
            <Row label="EPFO code" value={profile.epfoCode} badge={profile.epfoCode ? <Verified ok={epfo.found && epfo.status === "Active"} source="EPFO" /> : undefined} />
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Financials</h2>
          <div className="mt-2">
            <Row label="Turnover FY 2022-23" value={profile.turnoverY1 ? inr(profile.turnoverY1) : "—"} />
            <Row label="Turnover FY 2023-24" value={profile.turnoverY2 ? inr(profile.turnoverY2) : "—"} />
            <Row label="Turnover FY 2024-25" value={profile.turnoverY3 ? inr(profile.turnoverY3) : "—"} />
            <Row label="3-year average" value={inr(avgTurnover)} />
            <Row label="Net worth" value={profile.netWorth ? inr(profile.netWorth) : "—"} />
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-base font-bold text-ink">Banking & workforce</h2>
          <div className="mt-2">
            <Row label="Bank account" value={profile.bankAccount ? `••••${profile.bankAccount.slice(-4)}` : "—"} />
            <Row label="IFSC" value={profile.bankIfsc} />
            <Row label="Employees (declared)" value={String(profile.employees ?? "—")} />
            <Row label="EPFO members" value={epfo.found ? String((epfo.data as { memberCount?: number })?.memberCount ?? "—") : "—"} />
          </div>
        </section>
      </div>

      <ProfileChangeForm
        profile={{
          orgName: profile.orgName,
          constitution: profile.constitution,
          cin: profile.cin,
          registeredAddress: profile.registeredAddress,
          worksAddress: profile.worksAddress,
          pan: profile.pan,
          gstin: profile.gstin,
          udyamNo: profile.udyamNo,
          startupDpiit: profile.startupDpiit,
          epfoCode: profile.epfoCode,
          turnoverY1: profile.turnoverY1,
          turnoverY2: profile.turnoverY2,
          turnoverY3: profile.turnoverY3,
          netWorth: profile.netWorth,
          bankAccount: profile.bankAccount,
          bankIfsc: profile.bankIfsc,
          employees: profile.employees,
          sector: profile.sector,
          state: profile.state,
        }}
        pending={pending}
        lastReviewed={lastReviewed}
      />
    </div>
  );
}
