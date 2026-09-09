"""
Vendor Verification & Self-Updating Registration Engine
======================================================
The bridge between the public tender-discovery page (`/tenders`) and the
private evaluation dashboard.

  * POST /v1/sandbox/vendor/verify    — look an entity up by PAN or GSTIN
  * POST /v1/sandbox/vendor/register  — self-register (multipart + PDFs)

Both are deliberately unauthenticated (sandbox self-service). The registry is
a flat CSV (`gem_bidders_registry_1000.csv`); `register` appends a new row and
stores the uploaded statutory PDFs under `uploads/{bidder_id}/`.
"""
from __future__ import annotations

import csv
import re
import threading
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.config import get_settings
from app.models.schemas import (
    VendorNotFound,
    VendorRecord,
    VendorRegisterResponse,
    VendorVerifyRequest,
)

router = APIRouter(prefix="/v1/sandbox/vendor", tags=["vendor-sandbox"])
settings = get_settings()

# Column order of the registry — new rows MUST match this exactly.
CSV_FIELDS = [
    "bidder_id",
    "company_name",
    "login_email",
    "aadhaar_number",
    "pan_number",
    "gstin",
    "cin_number",
    "is_msme",
    "udyam_reg_no",
    "fy_turnover_cr",
    "ca_udin",
    "mii_percentage",
    "director_name",
    "director_din",
    "registered_address",
    "tampered_flag",
]

# Standard 10-char PAN. (A stricter company-only form is ^[A-Z]{3}C[A-Z][0-9]{4}[A-Z]$
# but that rejects LLP / firm / trust PANs, so we accept the general shape here.)
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

# Serialise the read-count-append critical section so two concurrent
# registrations can never mint the same bidder_id or interleave rows.
_write_lock = threading.Lock()


# --------------------------------------------------------------------------- #
# helpers                                                                    #
# --------------------------------------------------------------------------- #
def _registry_path() -> Path:
    path = settings.registry_csv_path
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Registry dataset missing at {path}",
        )
    return path


def _as_bool(value: str) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes"}


def _as_float(value: str, default: float = 0.0) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return default


def _iter_rows(path: Path):
    with path.open("r", newline="", encoding="utf-8") as fh:
        yield from csv.DictReader(fh)


def _find(path: Path, identifier: str) -> dict | None:
    """Case-insensitive lookup on pan_number OR gstin."""
    needle = identifier.strip().upper()
    for row in _iter_rows(path):
        if (row.get("pan_number") or "").strip().upper() == needle:
            return row
        if (row.get("gstin") or "").strip().upper() == needle:
            return row
    return None


def _identifier_exists(path: Path, pan: str, gstin: str) -> bool:
    pan_u, gstin_u = pan.strip().upper(), gstin.strip().upper()
    for row in _iter_rows(path):
        if (row.get("pan_number") or "").strip().upper() == pan_u:
            return True
        if (row.get("gstin") or "").strip().upper() == gstin_u:
            return True
    return False


def _row_count(path: Path) -> int:
    with path.open("r", newline="", encoding="utf-8") as fh:
        return sum(1 for _ in csv.DictReader(fh))


def _record_from_row(row: dict) -> VendorRecord:
    return VendorRecord(
        bidder_id=row["bidder_id"],
        company_name=row["company_name"],
        login_email=row.get("login_email", ""),
        pan_number=row["pan_number"],
        gstin=row["gstin"],
        cin_number=row.get("cin_number", ""),
        is_msme=_as_bool(row.get("is_msme", "False")),
        udyam_reg_no=row.get("udyam_reg_no") or "NA",
        fy_turnover_cr=_as_float(row.get("fy_turnover_cr")),
        ca_udin=row.get("ca_udin", ""),
        mii_percentage=_as_float(row.get("mii_percentage")),
        director_name=row.get("director_name", ""),
        director_din=row.get("director_din", ""),
        registered_address=row.get("registered_address", ""),
        tampered_flag=_as_bool(row.get("tampered_flag", "False")),
    )


async def _save_pdf(file: UploadFile, dest_dir: Path, stem: str, *, required: bool) -> str | None:
    """Validate + persist one upload. Returns the saved filename (or None)."""
    if file is None or not file.filename:
        if required:
            raise HTTPException(400, f"'{stem}' is a mandatory PDF upload.")
        return None

    payload = await file.read()
    if not payload:
        if required:
            raise HTTPException(400, f"'{stem}' is empty.")
        return None

    is_pdf_ct = (file.content_type or "").lower() in {"application/pdf", "application/x-pdf"}
    is_pdf_ext = file.filename.lower().endswith(".pdf")
    is_pdf_magic = payload[:5] == b"%PDF-"
    if not (is_pdf_magic or (is_pdf_ct and is_pdf_ext)):
        raise HTTPException(400, f"'{stem}' must be a valid PDF document.")
    if len(payload) > 15 * 1024 * 1024:
        raise HTTPException(400, f"'{stem}' exceeds the 15 MB limit.")

    dest_dir.mkdir(parents=True, exist_ok=True)
    out = dest_dir / f"{stem}.pdf"
    out.write_bytes(payload)
    return out.name


# --------------------------------------------------------------------------- #
# 1. verify                                                                  #
# --------------------------------------------------------------------------- #
@router.post(
    "/verify",
    response_model=VendorRecord,
    responses={404: {"model": VendorNotFound}},
    summary="Verify a vendor by PAN or GSTIN against the national mock registry",
)
async def verify_vendor(body: VendorVerifyRequest) -> VendorRecord:
    identifier = body.identifier.strip()
    if len(identifier) not in (10, 15):
        raise HTTPException(422, "Identifier must be a 10-character PAN or a 15-character GSTIN.")

    row = _find(_registry_path(), identifier)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=VendorNotFound().model_dump(),
        )
    return _record_from_row(row)


# --------------------------------------------------------------------------- #
# 2. register                                                                #
# --------------------------------------------------------------------------- #
@router.post(
    "/register",
    response_model=VendorRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Self-register a new entity — appends to the CSV and stores PDFs",
)
async def register_vendor(
    company_name: str = Form(...),
    cin_number: str = Form(...),
    pan_number: str = Form(...),
    gstin: str = Form(...),
    is_msme: bool = Form(...),
    fy_turnover_cr: float = Form(...),
    ca_udin: str = Form(...),
    mii_percentage: float = Form(...),
    director_name: str = Form(...),
    director_din: str = Form(...),
    registered_address: str = Form(...),
    udyam_reg_no: str = Form("NA"),
    login_email: str = Form(""),
    turnover_certificate: UploadFile = File(...),
    gst_certificate: UploadFile = File(...),
    udyam_certificate: UploadFile | None = File(None),
) -> VendorRegisterResponse:
    pan = pan_number.strip().upper()
    gst = gstin.strip().upper()

    # --- structural validation ------------------------------------------------
    if not PAN_RE.match(pan):
        raise HTTPException(400, "Invalid PAN — expected a 10-character PAN, e.g. AAAAA0000A.")
    if not GSTIN_RE.match(gst):
        raise HTTPException(400, "Invalid GSTIN — expected a 15-character GSTIN, e.g. 27AAAAA0000A1Z5.")
    if gst[2:12] != pan:
        raise HTTPException(
            400,
            f"GSTIN / PAN mismatch — this GSTIN belongs to PAN {gst[2:12]}, not {pan}.",
        )
    if is_msme and (not udyam_reg_no or udyam_reg_no.strip().upper() == "NA"):
        raise HTTPException(400, "Udyam registration number is required when the entity is an MSME.")
    if not (0 <= mii_percentage <= 100):
        raise HTTPException(400, "Make-in-India percentage must be between 0 and 100.")
    if fy_turnover_cr < 0:
        raise HTTPException(400, "FY turnover cannot be negative.")

    path = _registry_path()

    with _write_lock:
        # --- duplicate guard (inside the lock: authoritative) ----------------
        if _identifier_exists(path, pan, gst):
            raise HTTPException(400, "An entity with this PAN or GSTIN is already registered.")

        bidder_id = f"BID_{_row_count(path) + 1000}"

        new_row = {
            "bidder_id": bidder_id,
            "company_name": company_name.strip(),
            "login_email": login_email.strip().lower(),
            "aadhaar_number": "[Aadhaar Redacted]",
            "pan_number": pan,
            "gstin": gst,
            "cin_number": cin_number.strip(),
            "is_msme": "True" if is_msme else "False",
            "udyam_reg_no": (udyam_reg_no.strip() or "NA") if is_msme else "NA",
            "fy_turnover_cr": f"{fy_turnover_cr:.2f}",
            "ca_udin": ca_udin.strip(),
            "mii_percentage": f"{mii_percentage:.1f}",
            "director_name": director_name.strip(),
            "director_din": director_din.strip(),
            "registered_address": registered_address.strip(),
            "tampered_flag": "False",
        }

        # --- persist the PDFs first; only append the row if they all land ----
        dest_dir = settings.uploads_dir / bidder_id
        saved = {
            "turnover_certificate": await _save_pdf(
                turnover_certificate, dest_dir, "turnover_certificate", required=True
            ),
            "gst_certificate": await _save_pdf(
                gst_certificate, dest_dir, "gst_certificate", required=True
            ),
            "udyam_certificate": await _save_pdf(
                udyam_certificate, dest_dir, "udyam_certificate", required=False
            ),
        }

        newline_needed = _needs_trailing_newline(path)
        with path.open("a", newline="", encoding="utf-8") as fh:
            if newline_needed:
                fh.write("\n")
            csv.DictWriter(fh, fieldnames=CSV_FIELDS).writerow(new_row)

    return VendorRegisterResponse(
        bidder_id=bidder_id,
        company_name=new_row["company_name"],
    )


def _needs_trailing_newline(path: Path) -> bool:
    """csv.writer won't add a leading newline — make sure the last row ended one."""
    with path.open("rb") as fh:
        try:
            fh.seek(-1, 2)
        except OSError:
            return False
        return fh.read(1) not in (b"\n", b"\r")
