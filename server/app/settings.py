from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    hermes_base_url: str | None = None
    hermes_api_key: SecretStr | None = None
    # Model and provider for the intake cards and summary; unset means the Hermes profile default.
    hermes_intake_model: str | None = None
    hermes_intake_provider: str | None = None
    # Unset means gated routes answer 503.
    access_code: SecretStr | None = None
    # False only behind another login (Vercel deployment protection); everywhere else the code stays required.
    access_required: bool = True
    app_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://localhost:4173",
    ]
    allowed_hosts: Annotated[list[str], NoDecode] = ["localhost", "127.0.0.1"]
    # Per-student notes. Set to a writable path (e.g. /tmp/learners) where the app dir is read-only.
    learners_dir: Path = Path(__file__).parent.parent / "data" / "learners"

    @field_validator("app_origins", "allowed_hosts", mode="before")
    @classmethod
    def split_commas(cls, value: object) -> object:
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
