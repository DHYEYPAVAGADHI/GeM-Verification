import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Rules Engine" };

export default function Page() {
  return (
    <ComingSoon
      title="Rules Engine"
      description="Configure the statutory and tender-specific rules the compliance engine evaluates, and the weight each carries in the risk score."
      bullets={[
        "Editable eligibility rules — turnover, experience, local content, MSME / Startup exemptions",
        "Per-tender overrides with an approval trail",
        "Versioned rule sets so past verifications stay reproducible",
      ]}
    />
  );
}
