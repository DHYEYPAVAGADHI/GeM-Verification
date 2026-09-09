import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RiskLevel = "low" | "review" | "high";

export function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 50) return "review";
  return "high";
}

export const riskMeta: Record<
  RiskLevel,
  { label: string; text: string; bg: string; stroke: string }
> = {
  low: { label: "Low Risk", text: "text-risk-low", bg: "bg-risk-low-bg", stroke: "#15803d" },
  review: { label: "Needs Review", text: "text-risk-review", bg: "bg-risk-review-bg", stroke: "#b45309" },
  high: { label: "High Risk", text: "text-risk-high", bg: "bg-risk-high-bg", stroke: "#b91c1c" },
};

export const recommendationMeta: Record<string, { text: string; bg: string }> = {
  Recommended: { text: "text-risk-low", bg: "bg-risk-low-bg" },
  "Review Required": { text: "text-risk-review", bg: "bg-risk-review-bg" },
  "Not Recommended": { text: "text-risk-high", bg: "bg-risk-high-bg" },
};

export function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(d: string | Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function inr(cr: number): string {
  return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}

export function initials(name: string): string {
  return name
    .replace(/\b(Pvt|Private|Ltd|Limited|LLP)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
