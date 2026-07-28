from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://matchmaking:matchmaking_secret@localhost:5432/matchmaking"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    jwt_secret: str = "jobber-jwt-secret-change-in-production-2024"

    cors_origins: list[str] = ["http://localhost:3000"]

    app_name: str = "Jobber API"

    model_config = {"env_prefix": "GATEWAY_"}


settings = Settings()
