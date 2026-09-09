import { db } from "@/lib/db";

/**
 * Government Source Gateway.
 *
 * Every portal is reached through one adapter with a stable interface.
 * `MockAdapter` (below) resolves against a seeded "government records"
 * database. In production a `LiveAdapter` would call APISetu / GSTN / MCA21
 * etc. — the calling code (rules, scoring, run) does not change.
 */

export type SourceStatus = "OPERATIONAL" | "DEGRADED" | "DOWN";

export type VerifyResult<T = Record<string, unknown>> = {
  source: string;
  found: boolean;
  status: string; // domain status: "Active" / "Suspended" / "Strike Off" ...
  data: T | null;
  checkedAt: string;
  latencyMs: number;
};

async function timed<T>(source: string, fn: () => Promise<Omit<VerifyResult<T>, "source" | "checkedAt" | "latencyMs">>): Promise<VerifyResult<T>> {
  const start = Date.now();
  const r = await fn();
  return {
    source,
    ...r,
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - start + Math.floor(Math.random() * 120),
  };
}

export const gateway = {
  async pan(pan?: string) {
    return timed("Income Tax / NSDL", async () => {
      if (!pan) return { found: false, status: "NOT_PROVIDED", data: null };
      const rec = await db.govPan.findUnique({ where: { pan } });
      return rec
        ? { found: true, status: rec.status, data: rec }
        : { found: false, status: "NOT_FOUND", data: null };
    });
  },

  async gstin(gstin?: string) {
    return timed("GSTN", async () => {
      if (!gstin) return { found: false, status: "NOT_PROVIDED", data: null };
      const rec = await db.govGstin.findUnique({ where: { gstin } });
      return rec
        ? { found: true, status: rec.status, data: rec }
        : { found: false, status: "NOT_FOUND", data: null };
    });
  },

  async udyam(udyamNo?: string | null) {
    return timed("Udyam Registration Portal", async () => {
      if (!udyamNo) return { found: false, status: "NOT_PROVIDED", data: null };
      const rec = await db.govUdyam.findUnique({ where: { udyamNo } });
      return rec
        ? { found: true, status: rec.status, data: rec }
        : { found: false, status: "NOT_FOUND", data: null };
    });
  },

  async mca(cin?: string | null) {
    return timed("MCA21", async () => {
      if (!cin) return { found: false, status: "NOT_PROVIDED", data: null };
      const rec = await db.govMca.findUnique({ where: { cin } });
      return rec
        ? { found: true, status: rec.status, data: { ...rec, directors: JSON.parse(rec.directors) } }
        : { found: false, status: "NOT_FOUND", data: null };
    });
  },

  async epfo(code?: string | null) {
    return timed("EPFO", async () => {
      if (!code) return { found: false, status: "NOT_PROVIDED", data: null };
      const rec = await db.govEpfo.findUnique({ where: { code } });
      return rec
        ? { found: true, status: rec.status, data: rec }
        : { found: false, status: "NOT_FOUND", data: null };
    });
  },

  async dpiit(recognitionNo?: string | null) {
    return timed("Startup India / DPIIT", async () => {
      if (!recognitionNo) return { found: false, status: "NOT_PROVIDED", data: null };
      const rec = await db.govDpiit.findUnique({ where: { recognitionNo } });
      return rec
        ? { found: true, status: "RECOGNISED", data: rec }
        : { found: false, status: "NOT_FOUND", data: null };
    });
  },

  async debarment(pan?: string, name?: string) {
    return timed("CPPP + GeM Sanctions", async () => {
      const hits = await db.govDebarment.findMany({
        where: {
          OR: [
            pan ? { pan } : undefined,
            name ? { entityName: { contains: name.split(" ")[0] } } : undefined,
          ].filter(Boolean) as never,
        },
      });
      const active = hits.filter((h) => !h.tillDate || h.tillDate > new Date());
      return {
        found: active.length > 0,
        status: active.length ? "DEBARRED" : "CLEAR",
        data: { hits: active } as never,
      };
    });
  },
};
