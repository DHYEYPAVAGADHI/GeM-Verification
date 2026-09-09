import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "User Management" };

export default function Page() {
  return (
    <ComingSoon
      title="User Management"
      description="Manage procurement officers, reviewers and auditors, their organisations and their access to tenders and verification runs."
      bullets={[
        "Role-based access — Officer, Reviewer, Auditor, Admin",
        "Organisation and tender-level scoping",
        "Every action attributed in the audit trail",
      ]}
    />
  );
}
