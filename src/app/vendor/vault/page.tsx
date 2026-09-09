import { FileText } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Pill } from "@/components/ui/pill";
import { Empty } from "@/components/ui/empty";
import { VaultUploader } from "@/components/vendor/vault-uploader";
import { DOC_TYPE_LABEL, docStatusMeta } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

const approvalMeta: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pending admin approval", tone: "bg-risk-review-bg text-risk-review" },
  APPROVED: { label: "Approved", tone: "bg-risk-low-bg text-risk-low" },
  REJECTED: { label: "Rejected", tone: "bg-risk-high-bg text-risk-high" },
};

export default async function VaultPage() {
  const session = await auth();
  const docs = await db.profileDocument.findMany({
    where: { vendorId: session!.user.vendorId! },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Document Vault</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Upload each certificate once. Map it to any tender's requirements when you bid.
        </p>
      </div>

      <VaultUploader />

      {docs.length === 0 ? (
        <Empty title="Your vault is empty" hint="Documents you add here are reusable across every bid." icon={FileText} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-semibold">Document</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Read status</th>
                <th className="px-3 py-3 font-semibold">Approval</th>
                <th className="px-3 py-3 font-semibold">Expiry</th>
                <th className="px-5 py-3 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {docs.map((d) => {
                const expiringSoon = d.expiryDate && d.expiryDate.getTime() - Date.now() < 45 * 864e5;
                return (
                  <tr key={d.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3.5">
                      <a href={`/api/doc/${d.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 font-medium text-ink hover:text-brand-700">
                        <FileText className="h-4 w-4 text-ink-muted" />
                        {d.fileName}
                      </a>
                    </td>
                    <td className="px-3 py-3.5 text-ink-muted">{DOC_TYPE_LABEL[d.docType] ?? d.docType}</td>
                    <td className="px-3 py-3.5">
                      <Pill tone={docStatusMeta[d.status]?.tone}>{docStatusMeta[d.status]?.label}</Pill>
                    </td>
                    <td className="px-3 py-3.5">
                      <Pill tone={approvalMeta[d.approvalStatus]?.tone}>{approvalMeta[d.approvalStatus]?.label}</Pill>
                      {d.approvalStatus === "REJECTED" && d.reviewNote && (
                        <p className="mt-1 max-w-[220px] text-[11px] text-ink-muted">&ldquo;{d.reviewNote}&rdquo;</p>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      {d.expiryDate ? (
                        <span className={expiringSoon ? "font-semibold text-risk-review" : "text-ink-muted"}>
                          {formatDate(d.expiryDate)}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-muted">{formatDate(d.uploadedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
