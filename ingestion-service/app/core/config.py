from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    grpc_host: str = "0.0.0.0"
    grpc_port: int = 50051

    docling_service_host: str = "localhost"
    docling_service_port: int = 50052

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    use_pymupdf: bool = True

    @property
    def docling_target(self) -> str:
        return f"{self.docling_service_host}:{self.docling_service_port}"

    model_config = {"env_prefix": "INGESTION_"}


settings = Settings()
