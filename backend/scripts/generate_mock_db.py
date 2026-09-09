"""
Generate `app/data/mock_gov_db.json` — the simulated government-records dataset.

Five realistic Indian bidders with structurally sound PAN / GSTIN / Udyam
identifiers, plus two deliberately planted edge cases:

  * FRAUD   — Deccan Traders LLP: the ITR-derived turnover on record (₹2.10 Cr)
              is far below the ₹8.00 Cr figure their submitted CA certificate
              will claim (checked in Phase 2 by the rule evaluator + ELA).
  * CARTEL  — Sunrise Systems Pvt Ltd & Nimbus Solutions Pvt Ltd share the same
              Director Identification Number (07439281) AND the same registered
              address — a classic bid-rigging signature for the networkx graph.

Deterministic: Faker is seeded, so re-running always produces the same file.

Usage:
    pip install faker
    python scripts/generate_mock_db.py
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.validators import build_gstin  # noqa: E402

try:
    from faker import Faker
except ImportError:  # pragma: no cover
    print("This generator needs Faker:  pip install faker", file=sys.stderr)
    sys.exit(1)

OUT = Path(__file__).resolve().parents[1] / "app" / "data" / "mock_gov_db.json"

fake = Faker("en_IN")
Faker.seed(26100)  # SIH problem-statement number — reproducible runs

SHARED_DIN = "07439281"
SHARED_ADDRESS = "Unit 4, 2nd Floor, Okhla Industrial Estate Phase III, New Delhi 110020"


def pan(entity_char: str, name: str, serial: int) -> str:
    """AAAAA1234A with a valid holder-type char (pos 4) and name initial (pos 5)."""
    prefix = "".join(c for c in name.upper() if c.isalpha())[:3].ljust(3, "X")
    initial = next((c for c in name.upper() if c.isalpha()), "X")
    return f"{prefix}{entity_char}{initial}{serial:04d}{initial}"


def director(name: str, din: str | None = None) -> dict:
    return {
        "din": din or fake.numerify("0#######"),
        "name": name,
        "designation": "Director",
    }


def base_record(**kw) -> dict:
    """Fill common fields; explicit kwargs override."""
    rec = {
        "constitution": "Private Limited Company",
        "incorporation_date": None,
        "cin": None,
        "pan_status": "ACTIVE",
        "aadhaar_seeding_status": "LINKED",
        "gst_status": "Active",
        "gst_registration_date": "2017-07-01",
        "gst_taxpayer_type": "Regular",
        "gst_filing": {"last_return": "GSTR-3B", "last_period": "072026", "regular": True, "delayed_returns_12m": 0},
        "udyam": None,
        "dpiit_startup": None,
        "epfo": None,
        "esic": None,
        "income_tax": {"latest_ay": "2026-27", "itr_filed": True, "turnover_declared_cr": 0.0, "audit_u44ab": True},
        "bank": {"account": fake.numerify("50#########"), "ifsc": "SBIN0001234", "penny_drop_name_match": True},
        "make_in_india": {"declared_local_content_pct": None, "supplier_class": None, "bom_ca_attested": False},
        "msme_emd_exemption": False,
        "debarment_records": [],
        "forensic_hint": None,
        "tender_id": "GEM/2026/B/4471209",
    }
    rec.update(kw)
    return rec


def main() -> None:
    bidders: list[dict] = []

    # 1 — clean, well-capitalised manufacturer -----------------------------
    p1 = pan("C", "Apollo Instruments", 1234)
    bidders.append(base_record(
        legal_name="Apollo Instruments Pvt Ltd",
        pan=p1,
        gstin=build_gstin("27", p1),
        cin="U33110MH2011PTC219845",
        incorporation_date="2011-05-18",
        registered_address="Plot D-14, MIDC Industrial Area, Andheri East, Mumbai 400093",
        directors=[director("R. S. Kulkarni", "01122334"), director("M. R. Kulkarni", "01122335")],
        udyam={"number": "UDYAM-MH-18-0021547", "enterprise_type": "Small", "major_activity": "Manufacturing", "valid": True, "date_of_registration": "2020-08-12"},
        epfo={"code": "MHBAN0021547000", "status": "Active", "member_count": 214, "last_ecr_period": "072026"},
        esic={"code": "31000214760000999", "status": "Active"},
        income_tax={"latest_ay": "2026-27", "itr_filed": True, "turnover_declared_cr": 42.6, "audit_u44ab": True},
        make_in_india={"declared_local_content_pct": 62, "supplier_class": "Class-II", "bom_ca_attested": True},
        msme_emd_exemption=True,
    ))

    # 2 — large listed company, not MSME ---------------------------------
    p2 = pan("C", "Bharat Networks", 5678)
    bidders.append(base_record(
        legal_name="Bharat Networks Ltd",
        constitution="Public Limited Company",
        pan=p2,
        gstin=build_gstin("29", p2),
        cin="L64200KA2004PLC034512",
        incorporation_date="2004-02-11",
        registered_address="Prestige Tech Park, Sarjapur Road, Bengaluru 560103",
        directors=[director("A. Venkataraman", "02233445"), director("S. Iyer", "02233446"), director("P. Menon", "02233447")],
        udyam=None,
        epfo={"code": "KNBNG0034512000", "status": "Active", "member_count": 1180, "last_ecr_period": "072026"},
        income_tax={"latest_ay": "2026-27", "itr_filed": True, "turnover_declared_cr": 121.4, "audit_u44ab": True},
        make_in_india={"declared_local_content_pct": 55, "supplier_class": "Class-II", "bom_ca_attested": True},
        msme_emd_exemption=False,
    ))

    # 3 — FRAUD : forged turnover ---------------------------------------
    p3 = pan("F", "Deccan Traders", 9012)
    bidders.append(base_record(
        legal_name="Deccan Traders LLP",
        constitution="Limited Liability Partnership",
        pan=p3,
        gstin=build_gstin("24", p3),
        cin="AAF-2291",  # LLPIN
        incorporation_date="2019-11-03",
        registered_address="27 Ashram Road, Navrangpura, Ahmedabad 380009",
        directors=[director("H. K. Patel", "03344556"), director("N. H. Patel", "03344557")],
        udyam={"number": "UDYAM-GJ-03-0099211", "enterprise_type": "Micro", "major_activity": "Trading", "valid": True, "date_of_registration": "2021-01-30"},
        epfo={"code": "GJAHD0099211000", "status": "Inactive", "member_count": 0, "last_ecr_period": "022026"},
        income_tax={"latest_ay": "2026-27", "itr_filed": True, "turnover_declared_cr": 2.10, "audit_u44ab": False},
        gst_filing={"last_return": "GSTR-3B", "last_period": "042026", "regular": False, "delayed_returns_12m": 5},
        make_in_india={"declared_local_content_pct": 38, "supplier_class": "Class-II", "bom_ca_attested": False},
        msme_emd_exemption=True,
        debarment_records=[{
            "entity_name": "Deccan Infra Projects (associate)",
            "authority": "State PWD, Gujarat",
            "reason": "Caution list — abandoned contract, 2024",
            "from_date": "2024-05-01",
            "till_date": "2027-04-30",
        }],
        forensic_hint={
            "type": "FORGED_TURNOVER",
            "claimed_turnover_cr": 8.00,
            "on_record_turnover_cr": 2.10,
            "note": "Submitted CA turnover certificate to be tested with Error Level Analysis in Phase 2.",
        },
    ))

    # 4 & 5 — CARTEL : shared DIN + shared address ----------------------
    p4 = pan("C", "Sunrise Systems", 3456)
    bidders.append(base_record(
        legal_name="Sunrise Systems Pvt Ltd",
        pan=p4,
        gstin=build_gstin("07", p4),
        cin="U72900DL2018PTC331245",
        incorporation_date="2018-04-15",
        registered_address=SHARED_ADDRESS,
        directors=[director("V. Ahuja", SHARED_DIN), director("K. Ahuja", "07439282")],
        udyam={"number": "UDYAM-DL-06-0033145", "enterprise_type": "Small", "major_activity": "Services", "valid": True, "date_of_registration": "2019-06-20"},
        epfo={"code": "DLCPM0033145000", "status": "Active", "member_count": 61, "last_ecr_period": "072026"},
        income_tax={"latest_ay": "2026-27", "itr_filed": True, "turnover_declared_cr": 15.2, "audit_u44ab": True},
        make_in_india={"declared_local_content_pct": 51, "supplier_class": "Class-II", "bom_ca_attested": False},
        msme_emd_exemption=True,
        forensic_hint={"type": "CARTEL", "shares_din_with": "Nimbus Solutions Pvt Ltd", "shared_din": SHARED_DIN},
    ))

    p5 = pan("C", "Nimbus Solutions", 7890)
    bidders.append(base_record(
        legal_name="Nimbus Solutions Pvt Ltd",
        pan=p5,
        gstin=build_gstin("07", p5),
        cin="U72900DL2017PTC318890",
        incorporation_date="2017-09-27",
        registered_address=SHARED_ADDRESS,
        directors=[director("V. Ahuja", SHARED_DIN), director("R. Sethi", "09988776")],
        udyam={"number": "UDYAM-DL-06-0031889", "enterprise_type": "Small", "major_activity": "Services", "valid": True, "date_of_registration": "2018-02-14"},
        epfo={"code": "DLCPM0031889000", "status": "Active", "member_count": 74, "last_ecr_period": "072026"},
        income_tax={"latest_ay": "2026-27", "itr_filed": True, "turnover_declared_cr": 18.9, "audit_u44ab": True},
        make_in_india={"declared_local_content_pct": 49, "supplier_class": "Class-II", "bom_ca_attested": False},
        msme_emd_exemption=True,
        forensic_hint={"type": "CARTEL", "shares_din_with": "Sunrise Systems Pvt Ltd", "shared_din": SHARED_DIN},
    ))

    payload = {
        "_meta": {
            "generated_by": "scripts/generate_mock_db.py",
            "faker_locale": "en_IN",
            "faker_seed": 26100,
            "generated_on": date.today().isoformat(),
            "record_count": len(bidders),
            "planted_cases": {
                "fraud": "Deccan Traders LLP (turnover 2.10 Cr on record vs 8.00 Cr claimed)",
                "cartel": f"Sunrise Systems + Nimbus Solutions (shared DIN {SHARED_DIN} & address)",
            },
            "disclaimer": "Synthetic data for the SIH prototype. Not real taxpayers.",
        },
        "bidders": bidders,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT}  ({len(bidders)} bidders)")
    for b in bidders:
        print(f"  {b['legal_name']:<32} PAN {b['pan']}  GSTIN {b['gstin']}")


if __name__ == "__main__":
    main()
