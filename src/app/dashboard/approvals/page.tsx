import { ClipboardCheck, FileText } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { ApprovalActions } from "@/components/dashboard/approval-actions";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { db } from "@/lib/db";
import { DOC_TYPE_LABEL } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Vendor Approvals" };

const FIELD_LABEL: Record<string, string> = {
  orgName: "Legal name",
  constitution: "Constitution",
  cin: "CIN",
  registeredAddress: "Registered address",
  worksAddress: "Works address",
  pan: "PAN",
  gstin: "GSTIN",
  udyamNo: "Udyam number",
  startupDpiit: "DPIIT Startup recognition no.",
  epfoCode: "EPFO code",
  turnoverY1: "Turnover FY 2022-23",
  turnoverY2: "Turnover FY 2023-24",
  turnoverY3: "Turnover FY 2024-25",
  netWorth: "Net worth",
  bankAccount: "Bank account",
  bankIfsc: "IFSC",
  employees: "Employees",
  sector: "Sector",
  state: "State",
};

export default async function ApprovalsPage() {
  const [changeRequests, docs] = await Promise.all([
    db.profileChangeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { vendor: true },
    }),
    db.profileDocument.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { uploadedAt: "asc" },
      include: { vendor: true },
    }),
  ]);

  const requesterIds = [...new Set(changeRequests.map((r) => r.requestedById))];
  const requesters = requesterIds.length
    ? await db.user.findMany({ where: { id: { in: requesterIds } } })
    : [];
  const requesterMap = new Map(requesters.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <PageHeading
        title="Vendor Approvals"
        subtitle="Company-profile edits and document-vault uploads awaiting your sign-off"
      />

      <section>
        <h2 className="text-base font-bold text-ink">
          Profile change requests <span className="text-ink-muted">({changeRequests.length})</span>
        </h2>

        {changeRequests.length === 0 ? (
          <div className="mt-3">
            <Empty title="No pending profile changes" icon={ClipboardCheck} />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {changeRequests.map((r) => {
              const changes = JSON.parse(r.changes) as Record<string, { from: unknown; to: unknown }>;
              const requester = requesterMap.get(r.requestedById);
              return (
                <div key={r.id} className="card card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{r.vendor.orgName}</p>
                      <p className="text-xs text-ink-muted">
                        Requested by {requester?.name ?? "Vendor"}
                        {requester?.email ? ` (${requester.email})` : ""} · {formatDateTime(r.createdAt)}
                      </p>
                      {r.note && <p className="mt-1 text-xs italic text-ink-muted">&ldquo;{r.note}&rdquo;</p>}
                    </div>
                    <ApprovalActions kind="profile" id={r.id} />
                  </div>
                  <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {Object.entries(changes).map(([field, diff]) => (
                      <li key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-ink">{FIELD_LABEL[field] ?? field}:</span>
                        <span className="text-ink-muted line-through">{String(diff.from ?? "—")}</span>
                        <span className="text-ink-muted">→</span>
                        <span className="font-medium text-risk-review">{String(diff.to ?? "—")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-bold text-ink">
          Document vault uploads <span className="text-ink-muted">({docs.length})</span>
        </h2>

        {docs.length === 0 ? (
          <div className="mt-3">
            <Empty title="No pending document uploads" icon={FileText} />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="card card-pad flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{d.vendor.orgName}</p>
                  <a
                    href={`/api/doc/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> {d.fileName}
                  </a>
                  <p className="mt-1 text-xs text-ink-muted">
                    <Pill tone="bg-slate-100 text-ink-soft">{DOC_TYPE_LABEL[d.docType] ?? d.docType}</Pill>{" "}
                    uploaded {formatDateTime(d.uploadedAt)}
                  </p>
                </div>
                <ApprovalActions kind="document" id={d.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
