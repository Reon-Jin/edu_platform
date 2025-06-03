# backend/config.py

from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    MYSQL_URI: str
    DEEPSEEK_API_KEY: str
    DEEPSEEK_ENDPOINT: str
    KNOWLEDGE_BASE_DIR: str = "backend/knowledge/"

    class Config:
        # 明确告诉 Pydantic 要去 backend/ 目录下加载 .env
        env_file = str(Path(__file__).parent / ".env")

settings = Settings()
