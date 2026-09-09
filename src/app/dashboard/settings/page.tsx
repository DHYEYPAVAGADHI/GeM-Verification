import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "System Settings" };

export default function Page() {
  return (
    <ComingSoon
      title="System Settings"
      description="Platform-wide configuration — integration credentials, OCR thresholds, retention policy and notification routing."
      bullets={[
        "Government API credentials and sandbox / production toggle",
        "Minimum OCR confidence before a field needs officer confirmation",
        "Audit-log retention and export policy",
      ]}
    />
  );
}
