import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  ClipboardCheck,
  FileStack,
  Gavel,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  PlayCircle,
  ScanEye,
  ScrollText,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
export type NavSection = { title: string; items: NavItem[] };

export const navSections: NavSection[] = [
  {
    title: "Verification",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Bulk AI Audit", href: "/dashboard/bulk-verification", icon: ScanEye },
      { label: "Tenders", href: "/dashboard/tenders", icon: Gavel },
      { label: "Bids", href: "/dashboard/bids", icon: FileStack },
      { label: "Documents", href: "/dashboard/documents", icon: Boxes },
      { label: "Clarifications", href: "/dashboard/clarifications", icon: MessagesSquare },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Risk Analytics", href: "/dashboard/risk-analytics", icon: BarChart3 },
      { label: "Source Reliability", href: "/dashboard/source-reliability", icon: Activity },
    ],
  },
  {
    title: "Audit & Compliance",
    items: [
      { label: "Audit Trail", href: "/dashboard/audit-trail", icon: ScrollText },
      { label: "Verification Replay", href: "/dashboard/verification-replay", icon: PlayCircle },
      { label: "Reports", href: "/dashboard/reports", icon: ListChecks },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Vendor Approvals", href: "/dashboard/approvals", icon: ClipboardCheck },
      { label: "Government Sources", href: "/dashboard/government-sources", icon: Building2 },
      { label: "Rules Engine", href: "/dashboard/rules-engine", icon: SlidersHorizontal },
      { label: "User Management", href: "/dashboard/users", icon: Users },
    ],
  },
];
