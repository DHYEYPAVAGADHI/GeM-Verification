"""
Public Tenders API  —  GET /v1/public/tenders
============================================
The "browse" half of GeM's *public browse → private apply* workflow.

Deliberately **unauthenticated**: no `X-API-Key`, no JWT. Anyone can list
ongoing bids; only *participating* (uploading a bid) requires a signed-in
account, which the Next.js frontend enforces at the "Participate" click.

Mirrors the shape the real GeM bid-listing exposes: a GeM bid number, the
buyer ministry / department, item, quantity and the bid-submission end date.
Backed by a static synthetic dataset — swap `_TENDERS` for a DB/registry
adapter and nothing downstream changes.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Query

from app.models.schemas import PublicTender, PublicTenderList

router = APIRouter(prefix="/v1/public", tags=["public-tenders"])

SortKey = Literal["end_date_asc", "end_date_desc", "value_desc"]

# --------------------------------------------------------------------------- #
# synthetic "Ongoing Bids" — GeM-style bid numbers, real ministry names       #
# --------------------------------------------------------------------------- #
_TENDERS: list[dict] = [
    {
        "id": "GEM_2026_B_5544021",
        "bid_no": "GEM/2026/B/5544021",
        "title": "Supply of Laptops (i7, 16GB) for field offices",
        "ministry": "Ministry of Electronics and Information Technology",
        "department": "National Informatics Centre",
        "category": "Computers & Laptops",
        "quantity": 1200,
        "est_value_cr": 18.4,
        "emd_amount": 1_840_000,
        "mse_exemption": True,
        "start_date": "2026-08-20",
        "end_date": "2026-09-18",
    },
    {
        "id": "GEM_2026_B_5544198",
        "bid_no": "GEM/2026/B/5544198",
        "title": "Annual Rate Contract — Surgical Gloves (Nitrile, Sterile)",
        "ministry": "Ministry of Health and Family Welfare",
        "department": "Central Medical Services Society",
        "category": "Medical Consumables",
        "quantity": 2_500_000,
        "est_value_cr": 6.7,
        "emd_amount": 670_000,
        "mse_exemption": True,
        "start_date": "2026-08-28",
        "end_date": "2026-09-10",
    },
    {
        "id": "GEM_2026_B_5545677",
        "bid_no": "GEM/2026/B/5545677",
        "title": "Track Maintenance Machinery — spare parts & consumables",
        "ministry": "Ministry of Railways",
        "department": "Northern Railway",
        "category": "Industrial Spares",
        "quantity": 340,
        "est_value_cr": 42.1,
        "emd_amount": 4_200_000,
        "mse_exemption": False,
        "start_date": "2026-08-15",
        "end_date": "2026-09-25",
    },
    {
        "id": "GEM_2026_B_5546012",
        "bid_no": "GEM/2026/B/5546012",
        "title": "Solar Rooftop Plants (100 kWp) — turnkey installation",
        "ministry": "Ministry of New and Renewable Energy",
        "department": "Solar Energy Corporation of India",
        "category": "Renewable Energy Works",
        "quantity": 22,
        "est_value_cr": 29.8,
        "emd_amount": 2_980_000,
        "mse_exemption": False,
        "start_date": "2026-09-01",
        "end_date": "2026-10-05",
    },
    {
        "id": "GEM_2026_B_5546541",
        "bid_no": "GEM/2026/B/5546541",
        "title": "Office Furniture — modular workstations and chairs",
        "ministry": "Ministry of Finance",
        "department": "Central Board of Direct Taxes",
        "category": "Furniture & Fixtures",
        "quantity": 850,
        "est_value_cr": 3.2,
        "emd_amount": 320_000,
        "mse_exemption": True,
        "start_date": "2026-08-30",
        "end_date": "2026-09-14",
    },
    {
        "id": "GEM_2026_B_5547203",
        "bid_no": "GEM/2026/B/5547203",
        "title": "Housekeeping & Sanitation Services — 3 campuses (2 years)",
        "ministry": "Ministry of Education",
        "department": "University Grants Commission",
        "category": "Manpower Services",
        "quantity": 1,
        "est_value_cr": 11.5,
        "emd_amount": 1_150_000,
        "mse_exemption": True,
        "start_date": "2026-08-22",
        "end_date": "2026-09-12",
    },
    {
        "id": "GEM_2026_B_5547889",
        "bid_no": "GEM/2026/B/5547889",
        "title": "Bulletproof Jackets (Level IV) — BIS certified",
        "ministry": "Ministry of Home Affairs",
        "department": "Central Reserve Police Force",
        "category": "Defence & Security Equipment",
        "quantity": 15_000,
        "est_value_cr": 96.0,
        "emd_amount": 9_600_000,
        "mse_exemption": False,
        "start_date": "2026-08-10",
        "end_date": "2026-09-30",
    },
    {
        "id": "GEM_2026_B_5548334",
        "bid_no": "GEM/2026/B/5548334",
        "title": "Mail Delivery Vehicles — electric two-wheelers",
        "ministry": "Ministry of Communications",
        "department": "Department of Posts",
        "category": "Vehicles",
        "quantity": 4_000,
        "est_value_cr": 52.0,
        "emd_amount": 5_200_000,
        "mse_exemption": False,
        "start_date": "2026-09-02",
        "end_date": "2026-09-22",
    },
    {
        "id": "GEM_2026_B_5549001",
        "bid_no": "GEM/2026/B/5549001",
        "title": "Highway CCTV & ANPR camera systems — supply and commissioning",
        "ministry": "Ministry of Road Transport and Highways",
        "department": "National Highways Authority of India",
        "category": "Surveillance Systems",
        "quantity": 620,
        "est_value_cr": 24.3,
        "emd_amount": 2_430_000,
        "mse_exemption": True,
        "start_date": "2026-08-25",
        "end_date": "2026-09-16",
    },
    {
        "id": "GEM_2026_B_5549770",
        "bid_no": "GEM/2026/B/5549770",
        "title": "Drone-based crop survey services — 4 states",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "department": "Department of Agriculture & Cooperation",
        "category": "Geospatial Services",
        "quantity": 1,
        "est_value_cr": 8.9,
        "emd_amount": 890_000,
        "mse_exemption": True,
        "start_date": "2026-09-03",
        "end_date": "2026-10-01",
    },
]


def _days_left(end: str) -> int:
    return (date.fromisoformat(end) - datetime.now(timezone.utc).date()).days


def _row(t: dict) -> PublicTender:
    return PublicTender(**t, days_left=_days_left(t["end_date"]))


@router.get("/tenders", response_model=PublicTenderList, summary="List ongoing bids (no auth)")
async def list_public_tenders(
    ministry: str | None = Query(
        default=None, description="Exact ministry name to filter by"
    ),
    q: str | None = Query(default=None, description="Free-text match on title / bid number"),
    sort: SortKey = Query(default="end_date_asc"),
) -> PublicTenderList:
    rows = list(_TENDERS)

    if ministry:
        rows = [t for t in rows if t["ministry"].lower() == ministry.strip().lower()]
    if q:
        needle = q.strip().lower()
        rows = [
            t for t in rows
            if needle in t["title"].lower() or needle in t["bid_no"].lower()
        ]

    reverse = sort.endswith("_desc")
    key = (lambda t: t["est_value_cr"]) if sort == "value_desc" else (lambda t: t["end_date"])
    rows.sort(key=key, reverse=reverse)

    ministries = sorted({t["ministry"] for t in _TENDERS})
    return PublicTenderList(
        count=len(rows),
        ministries=ministries,
        results=[_row(t) for t in rows],
    )


@router.get("/tenders/{tender_id}", response_model=PublicTender, summary="Single ongoing bid (no auth)")
async def get_public_tender(tender_id: str) -> PublicTender:
    from fastapi import HTTPException

    for t in _TENDERS:
        if t["id"] == tender_id or t["bid_no"] == tender_id:
            return _row(t)
    raise HTTPException(status_code=404, detail="Tender not found")
