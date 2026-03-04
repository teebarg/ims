from functools import lru_cache
from typing import Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Thrift Shop Inventory API"
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    database_url: str = Field(alias="DATABASE_URL")
    secret_key: str = Field(alias="SECRET_KEY")

    backend_cors_origins: list[AnyHttpUrl] | list[str] = Field(
        default_factory=lambda: ["http://localhost", "http://localhost:8000"]
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()

