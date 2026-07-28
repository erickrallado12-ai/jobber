from __future__ import annotations

import grpc
from grpc import aio as grpc_aio

from app.core.config import settings

from generated import resume_pb2, resume_pb2_grpc


class ResumeGrpcClient:

    def __init__(self) -> None:
        self._channel: grpc_aio.Channel | None = None
        self._stub: resume_pb2_grpc.ResumeProcessorStub | None = None

    async def connect(self) -> None:
        self._channel = grpc_aio.insecure_channel(settings.ingestion_target)
        self._stub = resume_pb2_grpc.ResumeProcessorStub(self._channel)

    async def close(self) -> None:
        if self._channel:
            await self._channel.close()

    async def process_resume(
        self, file_content: bytes, file_extension: str
    ) -> resume_pb2.ResumeResponse:
        if self._stub is None:
            raise RuntimeError("gRPC client not connected. Call connect() first.")

        request = resume_pb2.ResumeRequest(
            file_content=file_content,
            file_extension=file_extension,
        )
        response: resume_pb2.ResumeResponse = await self._stub.ProcessResume(
            request, timeout=120
        )
        return response


grpc_client = ResumeGrpcClient()
