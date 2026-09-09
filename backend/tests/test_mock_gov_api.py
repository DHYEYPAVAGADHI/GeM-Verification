"""Smoke tests for the Phase-1 mock government sandbox."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import validators as V

KEY = {"X-API-Key": "sandbox_demo_key"}
DB = json.loads((Path(__file__).resolve().parents[1] / "app/data/mock_gov_db.json").read_text())
BIDDERS = DB["bidders"]

client = TestClient(app)


def test_dataset_is_structurally_sound():
    for b in BIDDERS:
        assert V.is_valid_pan(b["pan"]), b["pan"]
        assert V.is_valid_gstin(b["gstin"]), b["gstin"]
        if b.get("udyam"):
            assert V.is_valid_udyam(b["udyam"]["number"])
        for d in b["directors"]:
            assert V.is_valid_din(d["din"])


def test_cartel_case_shares_din_and_address():
    sunrise = next(b for b in BIDDERS if b["legal_name"].startswith("Sunrise"))
    nimbus = next(b for b in BIDDERS if b["legal_name"].startswith("Nimbus"))
    sun_dins = {d["din"] for d in sunrise["directors"]}
    nim_dins = {d["din"] for d in nimbus["directors"]}
    assert sun_dins & nim_dins, "cartel bidders must share a DIN"
    assert sunrise["registered_address"] == nimbus["registered_address"]


def test_fraud_case_has_turnover_gap():
    deccan = next(b for b in BIDDERS if b["legal_name"].startswith("Deccan"))
    hint = deccan["forensic_hint"]
    assert hint["type"] == "FORGED_TURNOVER"
    assert deccan["income_tax"]["turnover_declared_cr"] < hint["claimed_turnover_cr"]


def test_requires_api_key():
    r = client.post("/v1/verify/pan", json={"pan": BIDDERS[0]["pan"]})
    assert r.status_code == 401


def test_pan_happy_path():
    b = BIDDERS[0]
    r = client.post("/v1/verify/pan", headers=KEY, json={"pan": b["pan"], "name": b["legal_name"]})
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is True
    assert body["data"]["registered_name"] == b["legal_name"]
    assert body["data"]["name_match"] == "EXACT"
    assert body["latency_ms"] > 0
    assert body["request_id"].startswith("req_")


def test_pan_rejects_malformed():
    r = client.post("/v1/verify/pan", headers=KEY, json={"pan": "NOTAPAN"})
    assert r.status_code == 422


def test_gstin_checksum_enforced():
    good = BIDDERS[0]["gstin"]
    bad = good[:14] + ("A" if good[14] != "A" else "B")  # break the check digit
    assert client.post("/v1/verify/gstin", headers=KEY, json={"gstin": good}).status_code == 200
    assert client.post("/v1/verify/gstin", headers=KEY, json={"gstin": bad}).status_code == 422


def test_directors_lookup_returns_shared_din():
    r = client.post("/v1/verify/directors", headers=KEY, json={"identifier": "Nimbus Solutions Pvt Ltd"})
    assert r.status_code == 200
    dins = {d["din"] for d in r.json()["data"]["directors"]}
    assert "07439281" in dins


def test_udyam_and_epfo_and_debarment():
    apollo = BIDDERS[0]
    assert client.post("/v1/verify/udyam", headers=KEY,
                       json={"udyam_number": apollo["udyam"]["number"]}).json()["verified"] is True
    assert client.post("/v1/verify/epfo", headers=KEY,
                       json={"establishment_code": apollo["epfo"]["code"]}).json()["verified"] is True
    deb = client.post("/v1/debarment/search", headers=KEY, json={"pan": apollo["pan"]}).json()
    assert deb["data"]["debarred"] is False


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))
