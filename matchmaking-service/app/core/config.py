from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://matchmaking:matchmaking_secret@postgres:5432/matchmaking"
    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    jwt_secret: str = "jobber-jwt-secret-change-in-production-2024"

    model_config = {"env_prefix": "MATCHMAKING_"}


settings = Settings()
