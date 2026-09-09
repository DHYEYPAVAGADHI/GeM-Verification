"""Application settings (12-factor, overridable via environment / .env)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="GEMV_", extra="ignore")

    app_name: str = "GeM Verify — Compliance Engine"
    environment: str = "development"

    # Mock government API
    mock_api_key: str = "sandbox_demo_key"
    mock_latency_min_ms: int = 80
    mock_latency_max_ms: int = 600
    mock_gov_db_path: Path = DATA_DIR / "mock_gov_db.json"

    # Vendor self-service sandbox (verify / self-register against the CSV registry)
    registry_csv_path: Path = DATA_DIR / "gem_bidders_registry_1000.csv"
    uploads_dir: Path = BASE_DIR.parent / "uploads"

    # CORS — the decoupled Next.js frontend
    frontend_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Phase 2+
    database_url: str = "postgresql+asyncpg://gemv:gemv@localhost:5432/gemv"
    redis_url: str = "redis://localhost:6379/0"

    # AI evaluation engine (Claude Vision). Accepts either the GEMV_-prefixed key
    # or the SDK-standard ANTHROPIC_API_KEY.
    anthropic_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GEMV_ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY"),
    )
    anthropic_model: str = "claude-3-5-sonnet-20240620"


@lru_cache
def get_settings() -> Settings:
    return Settings()
