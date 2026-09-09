import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { createTender } from "@/lib/actions";

export const metadata: Metadata = { title: "New Tender" };

export default function NewTenderPage() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/tenders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> All tenders
      </Link>
      <PageHeading title="Publish a Tender" subtitle="Define the eligibility criteria the engine will check every bid against" />

      <form action={createTender} className="space-y-6">
        <section className="card card-pad space-y-4">
          <h2 className="text-base font-bold text-ink">Tender details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Reference no.</label>
              <input name="refNo" placeholder="Auto-generated if blank" className="field mt-1" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" defaultValue="IT Hardware & Networking" className="field mt-1" />
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input name="title" required className="field mt-1" placeholder="Supply & installation of…" />
          </div>
          <div>
            <label className="label">Buyer *</label>
            <input name="buyer" required className="field mt-1" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" rows={3} className="field mt-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Estimated value (₹ Cr)</label>
              <input name="estValueCr" type="number" step="0.1" defaultValue="10" className="field mt-1" />
            </div>
            <div>
              <label className="label">EMD amount (₹)</label>
              <input name="emdAmount" type="number" defaultValue="1000000" className="field mt-1" />
            </div>
            <div>
              <label className="label">Bid close date</label>
              <input name="closeDate" type="date" className="field mt-1" />
            </div>
          </div>
        </section>

        <section className="card card-pad space-y-4">
          <h2 className="text-base font-bold text-ink">Eligibility criteria</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Minimum average turnover (₹ Cr)</label>
              <input name="minTurnover" type="number" step="1" defaultValue="25" className="field mt-1" />
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                <input type="checkbox" name="relaxMsme" defaultChecked /> Relax for MSME / Startup
              </label>
            </div>
            <div>
              <label className="label">Minimum similar-work value (₹ Cr)</label>
              <input name="minExperience" type="number" step="1" defaultValue="6" className="field mt-1" />
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                <input type="checkbox" name="relaxStartup" defaultChecked /> Relax for DPIIT Startup
              </label>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["reqGst", "Active GST registration", true],
              ["reqPf", "EPFO / labour compliance", true],
              ["reqDebar", "Debarment screening", true],
              ["reqOem", "OEM authorisation required", false],
              ["reqLocal", "Make in India / local content", true],
              ["reqIso", "Valid ISO 9001 (optional)", false],
            ].map(([name, label, checked]) => (
              <label key={name as string} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-soft">
                <input type="checkbox" name={name as string} defaultChecked={checked as boolean} />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label className="label">Local content class</label>
            <select name="localClass" className="field mt-1 w-auto">
              <option>Class-II</option>
              <option>Class-I</option>
            </select>
          </div>
        </section>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">Publish tender</button>
          <Link href="/dashboard/tenders" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
