"""Application Configuration and Environment Settings."""
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PennyFlow API"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./financeflow.db"
    
    # Security & JWT
    JWT_SECRET: str = "dev_secret_key_change_me_in_production_environment_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost",
        "http://localhost:80",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @property
    def normalized_database_url(self) -> str:
        """Ensure database URLs are compatible with PostgreSQL and Serverless SQLite runtimes."""
        import os
        import shutil
        url = self.DATABASE_URL

        # 1. PostgreSQL URL normalization
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://") and not url.startswith("postgresql+"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)

        # 2. Serverless / Vercel SQLite write-path handling
        # On Vercel / AWS Lambda, the root is read-only. Relocate SQLite to /tmp/financeflow.db
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"))
        if url.startswith("sqlite") and is_serverless:
            tmp_db_path = "/tmp/financeflow.db"
            bundled_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "financeflow.db"))
            if not os.path.exists(tmp_db_path) and os.path.exists(bundled_db_path):
                try:
                    shutil.copy2(bundled_db_path, tmp_db_path)
                except Exception:
                    pass
            return f"sqlite:///{tmp_db_path}"

        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
