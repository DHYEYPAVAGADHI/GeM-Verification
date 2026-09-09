# GeM Verify — Compliance Engine (Python / FastAPI)

Decoupled backend for the SIH 2026 bid-compliance platform (Problem Statement 26100).
The Next.js frontend lives in the repo root (`../src`); this service owns the
verification logic, document forensics and government-source simulation.

> **Phase 1 — done:** the mock Government Sandbox API + synthetic dataset.
> Phases 2–4 (AI Vision extraction, rule evaluator, OpenCV ELA, NetworkX cartel
> graph, Celery/Postgres) build on this seam.

## Run it

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # Phase 1 only needs: fastapi uvicorn pydantic pydantic-settings faker httpx pytest
python scripts/generate_mock_db.py      # writes app/data/mock_gov_db.json
uvicorn app.main:app --reload --port 8000
```

- Interactive docs: **http://localhost:8000/docs**
- Health: `GET /health`
- Every `/v1/*` call needs header `X-API-Key: sandbox_demo_key`

```bash
pytest -q     # 9 tests: dataset integrity, cartel/fraud invariants, API contract
```

## Project layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS for the Next.js frontend
│   ├── config.py               # pydantic-settings, env prefix GEMV_
│   ├── models/schemas.py       # request / response models (Setu-shaped)
│   ├── routers/mock_gov_api.py  # /v1/verify/* simulated endpoints
│   ├── services/
│   │   ├── validators.py       # PAN regex, GSTIN checksum, Udyam/DIN/CIN, GSTIN builder
│   │   └── gov_store.py        # in-memory index over mock_gov_db.json (the adapter seam)
│   └── data/mock_gov_db.json   # generated dataset (5 bidders)
├── scripts/generate_mock_db.py  # seeded Faker generator (deterministic)
├── tests/test_mock_gov_api.py
└── requirements.txt
```

## Mock Government Sandbox API

Contract mirrors commercial KYC aggregators (Sandbox.co.in / Setu): one JSON
envelope for every response, `X-API-Key` auth, structural validation before
lookup, simulated latency, per-call `request_id`.

| Method & path | Simulates | Notes |
|---|---|---|
| `POST /v1/verify/pan` | Income Tax / Protean (NSDL) | name-match scoring, holder-type from PAN char 4 |
| `POST /v1/verify/gstin` | GST Network | **rejects a bad checksum digit (422)**, returns filing regularity |
| `POST /v1/verify/udyam` | Ministry of MSME | enterprise class, validity |
| `POST /v1/verify/directors` | MCA21 | company master data + director list (feeds cartel graph) |
| `POST /v1/verify/epfo` | EPFO | establishment status, member count |
| `POST /v1/debarment/search` | CPPP + GeM sanctions | search by PAN or name |
| `GET  /v1/_sandbox/bidders` | — | dev-only introspection of the dataset |

### Example

```bash
curl -s -X POST localhost:8000/v1/verify/gstin \
  -H "X-API-Key: sandbox_demo_key" -H "Content-Type: application/json" \
  -d '{"gstin":"27APOCA1234A1ZB"}' | jq
```

## The synthetic dataset (`mock_gov_db.json`)

5 bidders with **structurally sound** identifiers — every PAN matches
`[A-Z]{5}[0-9]{4}[A-Z]` with a valid holder-type char, every GSTIN carries a
**correct base-36 checksum digit** (computed by `validators.build_gstin`), every
Udyam number and DIN is format-valid. Two edge cases are planted:

| Bidder | State | Turnover on record | Planted case |
|---|---|---|---|
| Apollo Instruments Pvt Ltd | Maharashtra | ₹42.6 Cr | clean baseline, MSME-Small |
| Bharat Networks Ltd | Karnataka | ₹121.4 Cr | clean, large, not MSME |
| **Deccan Traders LLP** | Gujarat | **₹2.10 Cr** | **FRAUD** — CA certificate will claim ₹8.00 Cr (ELA target); also GST filing irregular + a debarment record |
| **Sunrise Systems Pvt Ltd** | Delhi | ₹15.2 Cr | **CARTEL** — shares DIN `07439281` + registered address with Nimbus |
| **Nimbus Solutions Pvt Ltd** | Delhi | ₹18.9 Cr | **CARTEL** — same DIN + address as Sunrise |

Regenerate deterministically any time: `python scripts/generate_mock_db.py`
(Faker is seeded with `26100`).

## Configuration

All env keys are prefixed `GEMV_` (see `.env.example`). Key ones:
`GEMV_MOCK_API_KEY`, `GEMV_MOCK_LATENCY_MIN_MS` / `_MAX_MS`,
`GEMV_FRONTEND_ORIGINS` (CORS allow-list, JSON array).

## How this connects to the frontend

The `../src` Next.js app currently runs its own TypeScript verification engine.
The intended end state: that engine's **Government Source Gateway** calls this
FastAPI service instead of its local mock — same request/response shapes, so it
is a base-URL swap. Phases 2–4 move the heavy AI/forensics work here where
PyMuPDF, OpenCV and NetworkX belong.

## Roadmap

- **Phase 2** — AI Vision extraction (PyMuPDF + Claude Vision → structured JSON), OpenCV Error Level Analysis pipeline, `pyzbar` QR validation
- **Phase 3** — deterministic rule evaluator, NetworkX cartel graph, compliance scoring, Celery/Redis async jobs, Postgres persistence
- **Phase 4** — auditable dossier generation, wire the Next.js frontend to this API
