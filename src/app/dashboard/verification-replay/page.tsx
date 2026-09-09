import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Verification Replay" };

export default function Page() {
  return (
    <ComingSoon
      title="Verification Replay"
      description="Step through any completed verification exactly as it ran — every extraction, portal call and scoring decision, in order, with the evidence attached."
      bullets={[
        "Frame-by-frame timeline of a verification run",
        "Side-by-side document view with highlighted extracted fields",
        "Replay against updated rules to see how a score would change",
      ]}
    />
  );
}
