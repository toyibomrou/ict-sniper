"""
Configuration centrale du Bridge MT5.
Toutes les variables sensibles viennent du fichier .env
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # ─── API Security ──────────────────────────
    API_SECRET_KEY: str = "dev-key-change-in-production"
    API_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h

    # ─── MT5 Connection ────────────────────────
    MT5_LOGIN: int = 0
    MT5_PASSWORD: str = ""
    MT5_SERVER: str = ""
    MT5_PATH: str = ""

    # ─── Server ────────────────────────────────
    BRIDGE_HOST: str = "0.0.0.0"
    BRIDGE_PORT: int = 5555
    BRIDGE_LOG_LEVEL: str = "info"

    # ─── CORS ──────────────────────────────────
    CORS_ORIGINS: str = "https://ict-sniper.vercel.app,http://localhost:3000"

    # ─── Rate Limiting ─────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
