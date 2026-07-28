from __future__ import annotations

import json
import logging

import grpc
from grpc import aio as grpc_aio

from app.core.config import settings
from generated import processor_pb2, processor_pb2_grpc

logger = logging.getLogger(__name__)


class DoclingGrpcClient:

    def __init__(self) -> None:
        self._channel: grpc_aio.Channel | None = None
        self._stub: processor_pb2_grpc.DocumentProcessorStub | None = None

    async def connect(self) -> None:
        self._channel = grpc_aio.insecure_channel(settings.docling_target)
        self._stub = processor_pb2_grpc.DocumentProcessorStub(self._channel)
        logger.info("Docling gRPC client connected to %s", settings.docling_target)

    async def close(self) -> None:
        if self._channel:
            await self._channel.close()

    async def extract_text(
        self, file_content: bytes, file_extension: str
    ) -> str:
        if self._stub is None:
            raise RuntimeError("Docling client not connected. Call connect() first.")

        request = processor_pb2.ProcessRequest(
            file_content=file_content,
            file_extension=file_extension,
        )
        response: processor_pb2.ProcessResponse = await self._stub.ProcessDocument(
            request, timeout=30
        )

        if response.status != "success":
            raise RuntimeError(f"Docling returned status: {response.status}")

        result = json.loads(response.json_data)
        raw_text = result.get("content_blocks", "")
        logger.info("Docling extracted %d chars of text", len(raw_text))
        return raw_text


docling_client = DoclingGrpcClient()
