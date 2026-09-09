import { PageHeading } from "@/components/dashboard/page-heading";
import { BulkAuditConsole } from "@/components/dashboard/bulk-audit-console";

export const metadata = { title: "Bulk AI Audit" };

export default function BulkVerificationPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Bulk AI Audit"
        subtitle="Ingest a full tender packet — Claude Vision extraction, OpenCV ELA forensics and NetworkX cartel detection in one pass"
      />
      <BulkAuditConsole />
    </div>
  );
}
