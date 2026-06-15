from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "EIPR-Agent"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./eipr_agent.db"

    JWT_SECRET_KEY: str = "change-this-in-production-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://frontend-six-flax-42.vercel.app",
    ]

    DEFAULT_LLM_PROVIDER: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_DEFAULT_MODEL: str = "llama3.2"

    ENCRYPTION_KEY: str = "change-this-32-char-encryption-key!"

    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    ENABLE_MLFLOW: bool = False

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
