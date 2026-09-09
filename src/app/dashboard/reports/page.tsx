import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <ComingSoon
      title="Reports"
      description="Generate the compliance dossier that goes into the official tender file — a timestamped summary of every check, flag and officer decision."
      bullets={[
        "Per-bidder compliance certificate (PDF)",
        "Tender-level comparison matrix",
        "Audit extract for oversight and RTI responses",
      ]}
    />
  );
}
