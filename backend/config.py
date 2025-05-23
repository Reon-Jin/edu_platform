from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MYSQL_URI: str
    JWT_SECRET: str
    LLM_API_KEY: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
