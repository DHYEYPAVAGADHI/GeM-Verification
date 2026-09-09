"""
Request / response models for the mock government API.

The response envelopes deliberately mirror the shapes returned by commercial
KYC aggregators (Sandbox.co.in, Setu, Signzy) so that swapping the mock router
for a live adapter in production is a base-URL change, not a rewrite.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


# --------------------------- generic envelope ----------------------------- #
class ApiEnvelope(BaseModel):
    request_id: str
    source: str
    verified: bool
    status_code: int = 200
    message: str
    latency_ms: int
    timestamp: str
    data: dict[str, Any] | None = None


# ------------------------------- PAN ------------------------------------- #
class PanVerifyRequest(BaseModel):
    pan: str = Field(..., examples=["APOCA1234A"])
    name: str | None = Field(default=None, description="Optional name for match scoring")


class PanData(BaseModel):
    pan: str
    registered_name: str
    holder_type: str
    pan_status: str
    aadhaar_seeding_status: str
    last_itr_ay: str | None = None
    name_match: Literal["EXACT", "PARTIAL", "NO_MATCH", "NOT_CHECKED"] = "NOT_CHECKED"


# ------------------------------ GSTIN ----------------------------------- #
class GstinVerifyRequest(BaseModel):
    gstin: str = Field(..., examples=["27APOCA1234A1ZB"])


class GstFilingRow(BaseModel):
    return_type: str
    period: str
    status: Literal["Filed", "Not Filed", "Filed Late"]


class GstinData(BaseModel):
    gstin: str
    legal_name: str
    trade_name: str
    pan: str
    constitution_of_business: str
    gstin_status: str
    state: str
    date_of_registration: str
    taxpayer_type: str
    principal_place_of_business: str
    filing_status: list[GstFilingRow]
    filing_regular: bool
    delayed_returns_last_12m: int


# ------------------------------ Udyam ---------------------------------- #
class UdyamVerifyRequest(BaseModel):
    udyam_number: str = Field(..., examples=["UDYAM-MH-18-0021547"])


class UdyamData(BaseModel):
    udyam_number: str
    enterprise_name: str
    enterprise_type: Literal["Micro", "Small", "Medium"]
    major_activity: str
    pan: str
    date_of_registration: str
    valid: bool


# ------------------------------ MCA / DIN ------------------------------ #
class DirectorLookupRequest(BaseModel):
    identifier: str = Field(..., description="CIN, PAN or legal name")


class DirectorRow(BaseModel):
    din: str
    name: str
    designation: str


class McaData(BaseModel):
    cin: str | None
    legal_name: str
    company_status: str
    incorporation_date: str | None
    registered_address: str
    directors: list[DirectorRow]


# ------------------------------ EPFO ---------------------------------- #
class EpfoVerifyRequest(BaseModel):
    establishment_code: str = Field(..., examples=["MHBAN0021547000"])


class EpfoData(BaseModel):
    establishment_code: str
    establishment_name: str
    status: str
    member_count: int
    last_ecr_period: str


# --------------------------- Debarment -------------------------------- #
class DebarmentSearchRequest(BaseModel):
    pan: str | None = None
    name: str | None = None


class DebarmentRow(BaseModel):
    entity_name: str
    authority: str
    reason: str
    from_date: str
    till_date: str | None = None


class DebarmentData(BaseModel):
    query: dict[str, str | None]
    debarred: bool
    records: list[DebarmentRow]


# ------------------------- Public tenders (no auth) ------------------------ #
class PublicTender(BaseModel):
    id: str = Field(..., description="URL-safe id used by the frontend apply route")
    bid_no: str = Field(..., examples=["GEM/2026/B/5544021"])
    title: str
    ministry: str
    department: str
    category: str
    quantity: int
    est_value_cr: float
    emd_amount: int
    mse_exemption: bool
    start_date: str
    end_date: str
    days_left: int


class PublicTenderList(BaseModel):
    count: int
    ministries: list[str]
    results: list[PublicTender]


# ------------------- Vendor verification / self-registration -------------- #
class VendorVerifyRequest(BaseModel):
    identifier: str = Field(
        ...,
        description="A 10-character PAN or a 15-character GSTIN.",
        examples=["OSTCY7400J", "33OSTCY7400J3ZW"],
    )


class VendorRecord(BaseModel):
    """A row of the national mock registry (aadhaar redacted)."""

    exists: bool = True
    bidder_id: str
    company_name: str
    login_email: str = ""
    pan_number: str
    gstin: str
    cin_number: str
    is_msme: bool
    udyam_reg_no: str
    fy_turnover_cr: float
    ca_udin: str
    mii_percentage: float
    director_name: str
    director_din: str
    registered_address: str
    tampered_flag: bool
    aadhaar_number: str = "[Aadhaar Redacted]"


class VendorNotFound(BaseModel):
    exists: bool = False
    message: str = "No entity found with this PAN/GSTIN in the national mock registry."


class VendorRegisterResponse(BaseModel):
    status: str = "success"
    bidder_id: str
    company_name: str
    message: str = "Entity registered successfully and added to national mock registry."
