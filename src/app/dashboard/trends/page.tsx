import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Trends & Insights" };

export default function Page() {
  return (
    <ComingSoon
      title="Trends & Insights"
      description="Longitudinal analysis of bidder compliance — how registration health, local content and debarment exposure move over quarters."
      bullets={[
        "Sector and state-level compliance benchmarks",
        "Repeat-bidder score history across tenders",
        "Emerging risk patterns detected by the engine",
      ]}
    />
  );
}
