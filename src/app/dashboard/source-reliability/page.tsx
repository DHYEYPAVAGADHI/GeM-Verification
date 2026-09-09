import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Source Reliability" };

export default function Page() {
  return (
    <ComingSoon
      title="Source Reliability"
      description="Track the accuracy and availability of each government integration so officers know how much weight to place on an automated check."
      bullets={[
        "Uptime and response-time history per portal",
        "Mismatch rate between portal data and verified documents",
        "Automatic fallback to manual review when a source is degraded",
      ]}
    />
  );
}
