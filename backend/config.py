# backend/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MYSQL_URI: str

    class Config:
        # 告诉 Pydantic 去 backend 目录下找 .env
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        env_file_encoding = "utf-8"

settings = Settings()
