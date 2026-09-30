import os
from pydantic_settings import BaseSettings
from typing import List

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
_DB_PATH = os.path.join(_BASE_DIR, "quantum_fleet.db").replace("\\", "/")

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Quantum Green Fleet API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = f"sqlite:///{_DB_PATH}"

    # Auth
    SECRET_KEY: str = "quantum-fleet-secret-key-change-in-production-2024-xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Fuel Prices (INR)
    DEFAULT_PETROL_PRICE: float = 103.5
    DEFAULT_DIESEL_PRICE: float = 90.25
    DEFAULT_ELECTRIC_PRICE_PER_KWH: float = 8.0

    # Emission Factors (kg CO2 per liter)
    PETROL_EMISSION_FACTOR: float = 2.31
    DIESEL_EMISSION_FACTOR: float = 2.68
    HYBRID_EMISSION_FACTOR: float = 1.85

    # Directories
    MODELS_DIR: str = os.path.join(_BASE_DIR, "models").replace("\\", "/")
    DATASETS_DIR: str = os.path.join(_BASE_DIR, "datasets").replace("\\", "/")

    # Optional
    GEMINI_API_KEY: str = ""
    OSRM_API_URL: str = "https://router.project-osrm.org"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
