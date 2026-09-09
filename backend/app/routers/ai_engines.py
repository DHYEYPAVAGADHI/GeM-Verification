"""
AI Evaluation Engine
====================
SIH 2026 · Problem Statement 26100 — three AI/analytics endpoints that sit
behind the Next.js evaluation dashboard.

  POST /v1/ai/extract           Claude Vision → structured JSON from a scanned doc
  POST /v1/ai/forensics/ela     OpenCV Error-Level-Analysis heatmap (image/jpeg)
  GET  /v1/ai/cartel/check      NetworkX company↔director graph → cartel rings

All three are unauthenticated (internal evaluation calls) — front them with the
`require_api_key` dependency from `mock_gov_api` if you need to lock them down.
"""
from __future__ import annotations

import base64
import io
import json
import re
from datetime import datetime, timezone
from typing import Any, Literal

import anthropic
import cv2
import networkx as nx
import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import get_settings

router = APIRouter(prefix="/v1/ai", tags=["ai-engines"])
settings = get_settings()


# ═══════════════════════════════════════════════════════════════════════════
# 1. Vision AI Extractor                                                     #
# ═══════════════════════════════════════════════════════════════════════════
EXTRACTION_PROMPT = (
    "Extract the Company Name, PAN Number, GSTIN, and Total Turnover from this "
    "document. Return ONLY a valid JSON object with the keys: 'company_name', "
    "'pan_number', 'gstin', 'turnover_cr'. Do not include markdown formatting."
)

# Anthropic accepts these image media types.
_IMAGE_MAGIC: dict[str, bytes | None] = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/gif": b"GIF8",
    "image/webp": None,  # RIFF <size> WEBP — checked separately
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # Claude's per-image ceiling


class ExtractionResult(BaseModel):
    company_name: str | None = None
    pan_number: str | None = None
    gstin: str | None = None
    turnover_cr: Any | None = Field(
        default=None, description="Whatever the model returned for turnover (string or number)."
    )
    turnover_cr_value: float | None = Field(
        default=None, description="Best-effort numeric parse of turnover_cr, in ₹ crore."
    )


class ExtractionResponse(BaseModel):
    ok: bool
    parsed: bool
    model: str
    source_file: str
    media_type: str
    extracted: ExtractionResult
    raw_model_output: str


def _sniff_media_type(content_type: str | None, blob: bytes) -> str | None:
    """Trust the magic bytes over the client-supplied Content-Type."""
    if blob[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if blob[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if blob[:4] == b"GIF8":
        return "image/gif"
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
        return "image/webp"
    ct = (content_type or "").split(";")[0].strip().lower()
    return ct if ct in _IMAGE_MAGIC else None


_NUM_RE = re.compile(r"-?\d[\d,]*\.?\d*")


def _to_float(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        m = _NUM_RE.search(value.replace(",", ""))
        if m:
            try:
                return float(m.group())
            except ValueError:
                return None
    return None


def _coerce_json(text: str) -> dict[str, Any] | None:
    """Parse the model's reply even if it wrapped the JSON in prose / fences."""
    candidate = text.strip()
    fence = re.search(r"```(?:json)?\s*(.+?)\s*```", candidate, re.DOTALL)
    if fence:
        candidate = fence.group(1).strip()
    if not candidate.startswith("{"):
        start, end = candidate.find("{"), candidate.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = candidate[start : end + 1]
    try:
        obj = json.loads(candidate)
        return obj if isinstance(obj, dict) else None
    except (json.JSONDecodeError, ValueError):
        return None


@router.post("/extract", response_model=ExtractionResponse, summary="Claude Vision document extractor")
async def extract_document(file: UploadFile = File(...)) -> ExtractionResponse:
    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Anthropic API key not configured — set GEMV_ANTHROPIC_API_KEY (or ANTHROPIC_API_KEY).",
        )

    blob = await file.read()
    if not blob:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The uploaded file is empty.")
    if len(blob) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Image exceeds the {MAX_IMAGE_BYTES // (1024 * 1024)} MB limit for Vision extraction.",
        )

    media_type = _sniff_media_type(file.content_type, blob)
    if media_type is None:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Unsupported file type — upload a JPEG, PNG, GIF or WEBP scan of the document.",
        )

    b64 = base64.standard_b64encode(blob).decode("ascii")

    try:
        async with anthropic.AsyncAnthropic(api_key=api_key) as client:
            message = await client.messages.create(
                model=settings.anthropic_model,
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": b64,
                                },
                            },
                            {"type": "text", "text": EXTRACTION_PROMPT},
                        ],
                    }
                ],
            )
    except anthropic.AuthenticationError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Claude API rejected the API key.") from exc
    except anthropic.PermissionDeniedError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Claude API key lacks access to this model.") from exc
    except anthropic.RateLimitError as exc:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Claude API rate limit hit — retry shortly.") from exc
    except anthropic.APIConnectionError as exc:
        raise HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, "Could not reach the Claude API.") from exc
    except anthropic.APIStatusError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Claude API error (HTTP {exc.status_code}).") from exc
    except anthropic.APIError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Claude API error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 — never leak a 500 traceback to the frontend
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Vision extraction failed: {exc}") from exc

    raw_text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    ).strip()

    payload = _coerce_json(raw_text)
    if payload is None:
        return ExtractionResponse(
            ok=True,
            parsed=False,
            model=settings.anthropic_model,
            source_file=file.filename or "upload",
            media_type=media_type,
            extracted=ExtractionResult(),
            raw_model_output=raw_text,
        )

    turnover = payload.get("turnover_cr")
    return ExtractionResponse(
        ok=True,
        parsed=True,
        model=settings.anthropic_model,
        source_file=file.filename or "upload",
        media_type=media_type,
        extracted=ExtractionResult(
            company_name=(str(payload["company_name"]).strip() if payload.get("company_name") else None),
            pan_number=(str(payload["pan_number"]).strip().upper() if payload.get("pan_number") else None),
            gstin=(str(payload["gstin"]).strip().upper() if payload.get("gstin") else None),
            turnover_cr=turnover,
            turnover_cr_value=_to_float(turnover),
        ),
        raw_model_output=raw_text,
    )


# ═══════════════════════════════════════════════════════════════════════════
# 2. Forensic Tamper Detection — Error Level Analysis                        #
# ═══════════════════════════════════════════════════════════════════════════
_COLORMAPS: dict[str, int] = {
    "jet": cv2.COLORMAP_JET,
    "magma": cv2.COLORMAP_MAGMA,
    "turbo": cv2.COLORMAP_TURBO,
    "inferno": cv2.COLORMAP_INFERNO,
    "hot": cv2.COLORMAP_HOT,
}


@router.post("/forensics/ela", summary="Error-Level-Analysis tamper heatmap")
async def forensics_ela(
    file: UploadFile = File(...),
    quality: int = Query(90, ge=50, le=99, description="Re-compression JPEG quality."),
    colormap: Literal["jet", "magma", "turbo", "inferno", "hot"] = Query("jet"),
    amplify: float = Query(15.0, ge=1.0, le=60.0, description="Contrast gain on the residual."),
) -> StreamingResponse:
    blob = await file.read()
    if not blob:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The uploaded file is empty.")

    original = cv2.imdecode(np.frombuffer(blob, np.uint8), cv2.IMREAD_COLOR)
    if original is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Could not decode the image — upload a valid JPEG or PNG.",
        )

    # 1) re-encode the frame at `quality`% JPEG, then decode it back.
    #    (Done in-memory — mathematically identical to writing a temp .jpg and
    #    re-reading it, without the disk round-trip.)
    ok, recompressed_buf = cv2.imencode(".jpg", original, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Re-compression failed.")
    recompressed = cv2.imdecode(recompressed_buf, cv2.IMREAD_COLOR)

    # 2) residual = |original − recompressed|. Regions edited after the last save
    #    compress differently and light up.
    residual = cv2.absdiff(original, recompressed)

    # 3) amplify + collapse to a single intensity channel
    amplified = cv2.convertScaleAbs(residual, alpha=amplify, beta=0)
    intensity = cv2.cvtColor(amplified, cv2.COLOR_BGR2GRAY)
    intensity = cv2.normalize(intensity, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # 4) colour-map so tampered digits glow
    heatmap = cv2.applyColorMap(intensity, _COLORMAPS[colormap])

    ok, out_buf = cv2.imencode(".jpg", heatmap, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if not ok:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Heatmap encoding failed.")

    return StreamingResponse(
        io.BytesIO(out_buf.tobytes()),
        media_type="image/jpeg",
        headers={
            "Content-Disposition": 'inline; filename="ela_heatmap.jpg"',
            "X-ELA-Quality": str(quality),
            "X-ELA-Colormap": colormap,
            "X-ELA-Mean-Residual": f"{float(residual.mean()):.4f}",
            "X-ELA-Max-Residual": str(int(residual.max())),
        },
    )


# ═══════════════════════════════════════════════════════════════════════════
# 3. Cartel Graph Detection                                                  #
# ═══════════════════════════════════════════════════════════════════════════
_IGNORE_DIN = {"", "NA", "N/A", "NONE", "NULL", "NAN", "0", "-"}


class CartelRing(BaseModel):
    director_din: str
    director_name: str
    company_names: list[str]
    connected_bids: list[str]
    ring_size: int


class CartelReport(BaseModel):
    generated_at: str
    dataset: str
    bidders_scanned: int
    directors_scanned: int
    rings_found: int
    rings: list[CartelRing]


@router.get("/cartel/check", response_model=CartelReport, summary="NetworkX cartel-ring audit")
def cartel_check() -> CartelReport:
    path = settings.registry_csv_path
    if not path.exists():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"Registry dataset missing at {path}"
        )

    try:
        df = pd.read_csv(path, dtype=str).fillna("")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Could not read registry CSV: {exc}") from exc

    for column in ("company_name", "director_din", "bidder_id"):
        if column not in df.columns:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Registry CSV is missing the required '{column}' column.",
            )

    graph = nx.Graph()
    company_bids: dict[str, set[str]] = {}

    for row in df.itertuples(index=False):
        company = str(row.company_name).strip()
        din = str(row.director_din).strip()
        din_name = str(getattr(row, "director_name", "")).strip()
        bidder = str(row.bidder_id).strip()
        if not company:
            continue

        company_node = ("company", company)
        graph.add_node(company_node, kind="bidder", label=company)
        company_bids.setdefault(company, set())
        if bidder:
            company_bids[company].add(bidder)

        if din.upper() in _IGNORE_DIN:
            continue  # a blank / placeholder DIN is not a real shared director

        director_node = ("director", din)
        graph.add_node(director_node, kind="director", label=din, name=din_name)
        graph.add_edge(company_node, director_node)

    rings: list[CartelRing] = []
    directors_scanned = 0
    for node, attrs in graph.nodes(data=True):
        if attrs.get("kind") != "director":
            continue
        directors_scanned += 1
        companies = sorted({graph.nodes[nbr]["label"] for nbr in graph.neighbors(node)})
        if len(companies) > 1:  # one DIN → multiple distinct bidders = collusion signal
            bids = sorted({b for c in companies for b in company_bids.get(c, set())})
            rings.append(
                CartelRing(
                    director_din=str(attrs["label"]),
                    director_name=str(attrs.get("name", "")),
                    company_names=companies,
                    connected_bids=bids,
                    ring_size=len(companies),
                )
            )

    rings.sort(key=lambda r: (r.ring_size, len(r.connected_bids)), reverse=True)

    return CartelReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        dataset=path.name,
        bidders_scanned=len(company_bids),
        directors_scanned=directors_scanned,
        rings_found=len(rings),
        rings=rings,
    )
