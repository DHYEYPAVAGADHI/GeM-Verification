"""
In-memory store over `mock_gov_db.json`.

This is the seam the whole verification layer sits behind. In production the
same method signatures would be backed by live adapters (GSTN, Protean/NSDL,
Udyam, MCA21, EPFO, CPPP) — the routers and the rule evaluator never learn
whether the answer came from a JSON file or a real registry.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from app.config import get_settings


class GovStore:
    def __init__(self, path: str) -> None:
        raw = json.loads(open(path, encoding="utf-8").read())
        self.meta: dict[str, Any] = raw.get("_meta", {})
        self.bidders: list[dict[str, Any]] = raw["bidders"]
        self._by_pan = {b["pan"]: b for b in self.bidders}
        self._by_gstin = {b["gstin"]: b for b in self.bidders}
        self._by_name = {b["legal_name"].lower(): b for b in self.bidders}
        self._by_cin = {b["cin"]: b for b in self.bidders if b.get("cin")}
        self._by_udyam = {
            b["udyam"]["number"]: b for b in self.bidders if b.get("udyam")
        }
        self._by_epfo = {
            b["epfo"]["code"]: b for b in self.bidders if b.get("epfo")
        }

    # ---- single-record lookups ---------------------------------------- #
    def by_pan(self, pan: str) -> dict | None:
        return self._by_pan.get((pan or "").strip().upper())

    def by_gstin(self, gstin: str) -> dict | None:
        return self._by_gstin.get((gstin or "").strip().upper())

    def by_udyam(self, number: str) -> dict | None:
        return self._by_udyam.get((number or "").strip().upper())

    def by_epfo(self, code: str) -> dict | None:
        return self._by_epfo.get((code or "").strip().upper())

    def by_identifier(self, ident: str) -> dict | None:
        ident = (ident or "").strip()
        return (
            self._by_cin.get(ident.upper())
            or self._by_pan.get(ident.upper())
            or self._by_name.get(ident.lower())
        )

    # ---- cross-record queries --------------------------------------- #
    def debarment_matches(self, pan: str | None, name: str | None) -> list[dict]:
        out: list[dict] = []
        for b in self.bidders:
            for rec in b.get("debarment_records", []):
                if pan and b["pan"] == pan.strip().upper():
                    out.append(rec)
                elif name and name.strip().lower() in rec["entity_name"].lower():
                    out.append(rec)
        return out

    def tender_bidders(self, tender_id: str) -> list[dict]:
        return [b for b in self.bidders if b.get("tender_id") == tender_id]

    def all_directors(self) -> list[tuple[str, dict]]:
        """(bidder_name, director) pairs — feeds the cartel graph in Phase 2."""
        return [(b["legal_name"], d) for b in self.bidders for d in b["directors"]]


@lru_cache
def get_store() -> GovStore:
    return GovStore(str(get_settings().mock_gov_db_path))
