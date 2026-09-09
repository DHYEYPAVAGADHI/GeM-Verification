"""
Structural validators for Indian statutory identifiers.

These check that an identifier is *mathematically well-formed* — they do not
call any live registry. The mock gov API uses them to reject malformed input
before it ever hits the simulated database, exactly as a real KYC provider
(Sandbox.co.in / Setu) does.
"""
from __future__ import annotations

import re
from datetime import date

# --------------------------------------------------------------------------- #
# PAN — Permanent Account Number : AAAAA1234A                                  #
# 5 letters + 4 digits + 1 letter.                                            #
#   pos 4 : holder type   (P individual, C company, H HUF, F firm/LLP,        #
#           A AOP, T trust, B BOI, L local authority, J artificial juridical, #
#           G government)                                                     #
#   pos 5 : first character of the surname / entity name                      #
# --------------------------------------------------------------------------- #
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
PAN_HOLDER_TYPES = {
    "P": "Individual",
    "C": "Company",
    "H": "HUF",
    "F": "Firm / LLP",
    "A": "Association of Persons",
    "T": "Trust",
    "B": "Body of Individuals",
    "L": "Local Authority",
    "J": "Artificial Juridical Person",
    "G": "Government",
}


def is_valid_pan(pan: str) -> bool:
    return bool(PAN_RE.match((pan or "").strip().upper()))


def pan_holder_type(pan: str) -> str | None:
    if not is_valid_pan(pan):
        return None
    return PAN_HOLDER_TYPES.get(pan.strip().upper()[3])


# --------------------------------------------------------------------------- #
# GSTIN — Goods & Services Tax Identification Number : 22AAAAA0000A1Z5         #
#   pos 1-2  : state code (01-38, 97-99)                                      #
#   pos 3-12 : PAN of the taxpayer                                            #
#   pos 13   : entity number for that PAN within the state (1-9, then A-Z)    #
#   pos 14   : 'Z' (reserved)                                                 #
#   pos 15   : checksum (base-36, alternating factor 2/1, mod 36)             #
# --------------------------------------------------------------------------- #
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$")
_GSTIN_CODEPOINTS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

STATE_CODES: dict[str, str] = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
    "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
    "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra",
    "28": "Andhra Pradesh (old)", "29": "Karnataka", "30": "Goa",
    "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
    "37": "Andhra Pradesh", "38": "Ladakh",
}


def gstin_check_digit(first_14: str) -> str:
    """Return the 15th (checksum) character for the first 14 chars of a GSTIN."""
    factor, total, n = 2, 0, len(_GSTIN_CODEPOINTS)
    for ch in reversed(first_14):
        cp = _GSTIN_CODEPOINTS.index(ch)
        addend = factor * cp
        factor = 1 if factor == 2 else 2
        addend = (addend // n) + (addend % n)
        total += addend
    return _GSTIN_CODEPOINTS[(n - (total % n)) % n]


def is_valid_gstin(gstin: str) -> bool:
    g = (gstin or "").strip().upper()
    if not GSTIN_RE.match(g):
        return False
    if g[:2] not in STATE_CODES:
        return False
    return gstin_check_digit(g[:14]) == g[14]


def gstin_state(gstin: str) -> str | None:
    g = (gstin or "").strip().upper()
    return STATE_CODES.get(g[:2]) if len(g) >= 2 else None


def build_gstin(state_code: str, pan: str, entity_no: str = "1") -> str:
    """Compose a valid GSTIN from a state code + PAN (+ entity number)."""
    stem = f"{state_code}{pan.upper()}{entity_no}Z"
    return stem + gstin_check_digit(stem)


# --------------------------------------------------------------------------- #
# Udyam Registration Number : UDYAM-XX-00-0000000                             #
# --------------------------------------------------------------------------- #
UDYAM_RE = re.compile(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$")


def is_valid_udyam(number: str) -> bool:
    return bool(UDYAM_RE.match((number or "").strip().upper()))


# --------------------------------------------------------------------------- #
# DIN — Director Identification Number : 8 digits                             #
# CIN — Corporate Identity Number : e.g. U72200MH2012PTC071204                #
# --------------------------------------------------------------------------- #
DIN_RE = re.compile(r"^[0-9]{8}$")
CIN_RE = re.compile(r"^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$")
UDIN_RE = re.compile(r"^[0-9]{2}[A-Z0-9]{16}$")


def is_valid_din(din: str) -> bool:
    return bool(DIN_RE.match((din or "").strip()))


def is_valid_cin(cin: str) -> bool:
    return bool(CIN_RE.match((cin or "").strip().upper()))


def financial_year(d: date) -> str:
    """India FY label for a date, e.g. 2024-25 for anything Apr'24 – Mar'25."""
    start = d.year if d.month >= 4 else d.year - 1
    return f"{start}-{str(start + 1)[-2:]}"
