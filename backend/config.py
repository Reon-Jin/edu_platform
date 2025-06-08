from pydantic_settings import BaseSettings
from sqlmodel import create_engine
from pathlib import Path
from typing import Optional
import pdfkit

class Settings(BaseSettings):
    MYSQL_URI: str
    DEEPSEEK_API_KEY: str
    DEEPSEEK_ENDPOINT: str
    KNOWLEDGE_BASE_DIR: str = "backend/knowledge/"
    WKHTMLTOPDF_PATH: Optional[str] = None

    class Config:
        env_file = str(Path(__file__).parent / ".env")
        env_file_encoding = "utf-8"

settings = Settings()

# 数据库引擎
engine = create_engine(
    settings.MYSQL_URI,
    echo=True,
    connect_args={"charset": "utf8mb4"}
)

# Deepseek 设置
DEEPSEEK_API_KEY = settings.DEEPSEEK_API_KEY
DEEPSEEK_ENDPOINT = settings.DEEPSEEK_ENDPOINT

# pdfkit 配置
if settings.WKHTMLTOPDF_PATH:
    PDFKIT_CONFIG = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_PATH)
else:
    PDFKIT_CONFIG = None
