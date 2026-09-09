import { PageShell } from "@/components/motion/page-shell";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
