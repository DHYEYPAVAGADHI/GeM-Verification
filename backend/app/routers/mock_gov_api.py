"""
Mock Government Sandbox API
==========================
Simulated endpoints for the identifiers a GeM technical-packet evaluation
touches: PAN, GSTIN, Udyam, MCA/DIN, EPFO and CPPP/GeM debarment.

Contract mirrors Sandbox.co.in / Setu:
  * bearer-style `X-API-Key` header
  * one JSON envelope shape for every response (see ApiEnvelope)
  * structural validation up-front (malformed identifier -> 422, not a lookup)
  * simulated network latency + a per-call request_id

Swap `prefix="/v1"` here for a live adapter and nothing downstream changes.
"""
from __future__ import annotations

import asyncio
import random
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.config import get_settings
from app.models.schemas import (
    ApiEnvelope,
    DebarmentSearchRequest,
    DirectorLookupRequest,
    EpfoVerifyRequest,
    GstinVerifyRequest,
    PanVerifyRequest,
    UdyamVerifyRequest,
)
from app.services.gov_store import get_store
from app.services import validators as V

router = APIRouter(prefix="/v1", tags=["mock-government-api"])
settings = get_settings()


# --------------------------------------------------------------------------- #
# shared helpers                                                             #
# --------------------------------------------------------------------------- #
async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if x_api_key != settings.mock_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key",
        )


async def _simulate_latency() -> int:
    ms = random.randint(settings.mock_latency_min_ms, settings.mock_latency_max_ms)
    await asyncio.sleep(ms / 1000)
    return ms


def _envelope(source: str, *, verified: bool, message: str, latency_ms: int,
              data: dict | None = None, status_code: int = 200) -> ApiEnvelope:
    return ApiEnvelope(
        request_id=f"req_{uuid.uuid4().hex[:20]}",
        source=source,
        verified=verified,
        status_code=status_code,
        message=message,
        latency_ms=latency_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=data,
    )


def _name_match(claimed: str | None, registered: str) -> str:
    if not claimed:
        return "NOT_CHECKED"
    a, b = claimed.strip().lower(), registered.strip().lower()
    if a == b:
        return "EXACT"
    return "PARTIAL" if a in b or b in a else "NO_MATCH"


# --------------------------------------------------------------------------- #
# PAN — Income Tax / Protean (NSDL)                                           #
# --------------------------------------------------------------------------- #
@router.post("/verify/pan", response_model=ApiEnvelope, dependencies=[Depends(require_api_key)])
async def verify_pan(body: PanVerifyRequest) -> ApiEnvelope:
    pan = body.pan.strip().upper()
    if not V.is_valid_pan(pan):
        raise HTTPException(422, "Malformed PAN — expected 5 letters, 4 digits, 1 letter")

    latency = await _simulate_latency()
    rec = get_store().by_pan(pan)
    if not rec:
        return _envelope("INCOME_TAX_PROTEAN", verified=False, latency_ms=latency,
                         status_code=404, message="PAN not found in records",
                         data={"pan": pan, "holder_type": V.pan_holder_type(pan)})

    return _envelope(
        "INCOME_TAX_PROTEAN", verified=rec["pan_status"] == "ACTIVE", latency_ms=latency,
        message=f"PAN {rec['pan_status']}",
        data={
            "pan": pan,
            "registered_name": rec["legal_name"],
            "holder_type": V.pan_holder_type(pan),
            "pan_status": rec["pan_status"],
            "aadhaar_seeding_status": rec["aadhaar_seeding_status"],
            "last_itr_ay": rec["income_tax"]["latest_ay"] if rec["income_tax"]["itr_filed"] else None,
            "name_match": _name_match(body.name, rec["legal_name"]),
        },
    )


# --------------------------------------------------------------------------- #
# GSTIN — GST Network (GSTN)                                                  #
# --------------------------------------------------------------------------- #
@router.post("/verify/gstin", response_model=ApiEnvelope, dependencies=[Depends(require_api_key)])
async def verify_gstin(body: GstinVerifyRequest) -> ApiEnvelope:
    gstin = body.gstin.strip().upper()
    if not V.GSTIN_RE.match(gstin):
        raise HTTPException(422, "Malformed GSTIN — expected 15 chars 99AAAAA9999A9Z9")
    if V.gstin_check_digit(gstin[:14]) != gstin[14]:
        raise HTTPException(422, "Invalid GSTIN — checksum digit does not verify")
    if gstin[:2] not in V.STATE_CODES:
        raise HTTPException(422, f"Unknown GST state code '{gstin[:2]}'")

    latency = await _simulate_latency()
    rec = get_store().by_gstin(gstin)
    if not rec:
        return _envelope("GSTN", verified=False, latency_ms=latency, status_code=404,
                         message="GSTIN not found",
                         data={"gstin": gstin, "state": V.gstin_state(gstin), "pan": gstin[2:12]})

    f = rec["gst_filing"]
    filing_rows = [
        {"return_type": f["last_return"], "period": f["last_period"],
         "status": "Filed" if f["regular"] else "Filed Late"},
        {"return_type": "GSTR-1", "period": f["last_period"], "status": "Filed"},
    ]
    return _envelope(
        "GSTN", verified=rec["gst_status"] == "Active", latency_ms=latency,
        message=f"GSTIN {rec['gst_status']}",
        data={
            "gstin": gstin,
            "legal_name": rec["legal_name"],
            "trade_name": rec["legal_name"],
            "pan": gstin[2:12],
            "constitution_of_business": rec["constitution"],
            "gstin_status": rec["gst_status"],
            "state": V.gstin_state(gstin),
            "date_of_registration": rec["gst_registration_date"],
            "taxpayer_type": rec["gst_taxpayer_type"],
            "principal_place_of_business": rec["registered_address"],
            "filing_status": filing_rows,
            "filing_regular": f["regular"],
            "delayed_returns_last_12m": f["delayed_returns_12m"],
        },
    )


# --------------------------------------------------------------------------- #
# Udyam — Ministry of MSME                                                    #
# --------------------------------------------------------------------------- #
@router.post("/verify/udyam", response_model=ApiEnvelope, dependencies=[Depends(require_api_key)])
async def verify_udyam(body: UdyamVerifyRequest) -> ApiEnvelope:
    number = body.udyam_number.strip().upper()
    if not V.is_valid_udyam(number):
        raise HTTPException(422, "Malformed Udyam number — expected UDYAM-XX-00-0000000")

    latency = await _simulate_latency()
    rec = get_store().by_udyam(number)
    if not rec or not rec.get("udyam"):
        return _envelope("UDYAM_PORTAL", verified=False, latency_ms=latency,
                         status_code=404, message="Udyam registration not found",
                         data={"udyam_number": number})

    u = rec["udyam"]
    return _envelope(
        "UDYAM_PORTAL", verified=u["valid"], latency_ms=latency,
        message="Udyam registration valid" if u["valid"] else "Udyam registration not valid",
        data={
            "udyam_number": number,
            "enterprise_name": rec["legal_name"],
            "enterprise_type": u["enterprise_type"],
            "major_activity": u["major_activity"],
            "pan": rec["pan"],
            "date_of_registration": u["date_of_registration"],
            "valid": u["valid"],
        },
    )


# --------------------------------------------------------------------------- #
# MCA21 — company master data + directors (feeds cartel detection)            #
# --------------------------------------------------------------------------- #
@router.post("/verify/directors", response_model=ApiEnvelope, dependencies=[Depends(require_api_key)])
async def verify_directors(body: DirectorLookupRequest) -> ApiEnvelope:
    latency = await _simulate_latency()
    rec = get_store().by_identifier(body.identifier)
    if not rec:
        return _envelope("MCA21", verified=False, latency_ms=latency, status_code=404,
                         message="No company / LLP found for identifier",
                         data={"identifier": body.identifier})

    return _envelope(
        "MCA21", verified=True, latency_ms=latency, message="Company master data retrieved",
        data={
            "cin": rec.get("cin"),
            "legal_name": rec["legal_name"],
            "company_status": "Active",
            "incorporation_date": rec.get("incorporation_date"),
            "registered_address": rec["registered_address"],
            "directors": rec["directors"],
        },
    )


# --------------------------------------------------------------------------- #
# EPFO — establishment compliance                                            #
# --------------------------------------------------------------------------- #
@router.post("/verify/epfo", response_model=ApiEnvelope, dependencies=[Depends(require_api_key)])
async def verify_epfo(body: EpfoVerifyRequest) -> ApiEnvelope:
    latency = await _simulate_latency()
    rec = get_store().by_epfo(body.establishment_code)
    if not rec or not rec.get("epfo"):
        return _envelope("EPFO", verified=False, latency_ms=latency, status_code=404,
                         message="Establishment code not found",
                         data={"establishment_code": body.establishment_code})

    e = rec["epfo"]
    return _envelope(
        "EPFO", verified=e["status"] == "Active", latency_ms=latency,
        message=f"Establishment {e['status']}",
        data={
            "establishment_code": e["code"],
            "establishment_name": rec["legal_name"],
            "status": e["status"],
            "member_count": e["member_count"],
            "last_ecr_period": e["last_ecr_period"],
        },
    )


# --------------------------------------------------------------------------- #
# Debarment — CPPP + GeM sanctions                                           #
# --------------------------------------------------------------------------- #
@router.post("/debarment/search", response_model=ApiEnvelope, dependencies=[Depends(require_api_key)])
async def search_debarment(body: DebarmentSearchRequest) -> ApiEnvelope:
    if not body.pan and not body.name:
        raise HTTPException(422, "Provide at least one of: pan, name")

    latency = await _simulate_latency()
    hits = get_store().debarment_matches(body.pan, body.name)
    return _envelope(
        "CPPP_GEM_SANCTIONS", verified=len(hits) == 0, latency_ms=latency,
        message="No active debarment" if not hits else f"{len(hits)} debarment record(s) found",
        data={"query": {"pan": body.pan, "name": body.name},
              "debarred": bool(hits), "records": hits},
    )


# --------------------------------------------------------------------------- #
# discovery — list what the sandbox knows (dev convenience, not a real API)   #
# --------------------------------------------------------------------------- #
@router.get("/_sandbox/bidders", tags=["sandbox-introspection"])
async def list_sandbox_bidders() -> dict:
    store = get_store()
    return {
        "meta": store.meta,
        "bidders": [
            {
                "legal_name": b["legal_name"],
                "pan": b["pan"],
                "gstin": b["gstin"],
                "udyam": b["udyam"]["number"] if b.get("udyam") else None,
                "epfo": b["epfo"]["code"] if b.get("epfo") else None,
                "cin": b.get("cin"),
                "forensic_hint": b.get("forensic_hint"),
            }
            for b in store.bidders
        ],
    }
