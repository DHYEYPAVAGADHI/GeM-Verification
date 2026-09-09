"""
GeM Verify — Compliance Engine (FastAPI)
=======================================
Phase 1: the mock government sandbox.

Run:
    uvicorn app.main:app --reload --port 8000

Docs:  http://localhost:8000/docs
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import ai_engines, mock_gov_api, public_tenders, vendor_sandbox
from app.services.gov_store import get_store

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    store = get_store()  # fail fast if the dataset is missing / malformed
    app.state.gov_records = len(store.bidders)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    summary="AI-powered bid compliance verification for the Government e-Marketplace (SIH 26100).",
    description=(
        "Phase 1 exposes a **mock Government Sandbox API** — simulated PAN, GSTIN, "
        "Udyam, MCA/DIN, EPFO and debarment endpoints backed by a synthetic dataset "
        "of 5 bidders (one forged-turnover case, one director-sharing cartel). "
        "Later phases add the AI Vision extraction layer, the deterministic rule "
        "evaluator, the OpenCV Error-Level-Analysis forensic pipeline and the "
        "NetworkX cartel-detection graph."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mock_gov_api.router)
app.include_router(public_tenders.router)
app.include_router(vendor_sandbox.router)
app.include_router(ai_engines.router)


@app.get("/", tags=["meta"])
async def root() -> dict:
    return {
        "service": settings.app_name,
        "version": "0.1.0",
        "phase": "1 — mock government sandbox",
        "environment": settings.environment,
        "docs": "/docs",
        "mock_api_key_header": "X-API-Key",
        "endpoints": [
            "GET  /v1/public/tenders            (no auth)",
            "GET  /v1/public/tenders/{id}       (no auth)",
            "POST /v1/sandbox/vendor/verify     (no auth)",
            "POST /v1/sandbox/vendor/register   (no auth, multipart)",
            "POST /v1/ai/extract                (no auth, Claude Vision)",
            "POST /v1/ai/forensics/ela          (no auth, image/jpeg out)",
            "GET  /v1/ai/cartel/check           (no auth, NetworkX)",
            "POST /v1/verify/pan",
            "POST /v1/verify/gstin",
            "POST /v1/verify/udyam",
            "POST /v1/verify/directors",
            "POST /v1/verify/epfo",
            "POST /v1/debarment/search",
            "GET  /v1/_sandbox/bidders",
        ],
    }


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok", "gov_records": get_store().bidders.__len__()}
