from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CV Builder API Gateway"
    debug: bool = True

    cors_origins: list[str] = ["http://localhost:3000"]

    ingestion_service_host: str = "localhost"
    ingestion_service_port: int = 50051

    matchmaking_service_url: str = "http://localhost:8001"

    @property
    def ingestion_target(self) -> str:
        return f"{self.ingestion_service_host}:{self.ingestion_service_port}"

    model_config = {"env_prefix": "GATEWAY_"}


settings = Settings()
