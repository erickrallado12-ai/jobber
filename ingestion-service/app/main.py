from __future__ import annotations

import asyncio
import logging
import uuid

import grpc
from grpc import aio as grpc_aio
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer
from prometheus_client import start_http_server

from app.core.config import settings
from app.core.docling_client import docling_client
from app.models.resume import ResumeModel
from app.services.llm_service import normalize_resume

from generated import resume_pb2, resume_pb2_grpc

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

resource = Resource.create({"service.name": "ingestion-service"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(insecure=True)))
trace.set_tracer_provider(provider)
GrpcInstrumentorServer().instrument()

start_http_server(9051)
logger.info("Prometheus metrics server on :9051")


class ResumeProcessorServicer(resume_pb2_grpc.ResumeProcessorServicer):

    async def ProcessResume(  # noqa: N802
        self,
        request: resume_pb2.ResumeRequest,
        context: grpc.aio.ServicerContext,
    ) -> resume_pb2.ResumeResponse:

        logger.info(
            "Received resume: extension=%s, size=%d bytes",
            request.file_extension,
            len(request.file_content),
        )

        try:
            raw_text = await docling_client.extract_text(
                file_content=request.file_content,
                file_extension=request.file_extension,
            )
        except NotImplementedError:
            logger.warning("Docling stub not wired – using placeholder raw text")
            raw_text = (
                "John Doe\njohn.doe@example.com\n+1 555-123-4567\n"
                "San Francisco, CA\n\n"
                "Senior Software Engineer with 8 years of experience in distributed systems.\n\n"
                "EXPERIENCE\n"
                "Acme Corp | Senior Engineer | 2020-01 – Present\n"
                "- Led migration to microservices architecture\n"
                "- Reduced API latency by 40%\n\n"
                "TechStart | Software Engineer | 2016-06 – 2019-12\n"
                "- Built real-time data pipeline\n\n"
                "EDUCATION\n"
                "MIT | BS Computer Science | 2012 – 2016 | GPA: 3.8\n\n"
                "SKILLS\n"
                "Python, Go, gRPC, Kubernetes, PostgreSQL, Redis, AWS"
            )
        except Exception as exc:
            logger.error("Docling extraction failed: %s", exc)
            await context.abort(grpc.StatusCode.INTERNAL, f"Docling error: {exc}")

        try:
            resume_model: ResumeModel = await normalize_resume(raw_text)
        except Exception as exc:
            logger.error("LLM normalization failed: %s", exc)
            await context.abort(grpc.StatusCode.INTERNAL, f"LLM error: {exc}")

        return _model_to_response(resume_model)


def _model_to_response(model: ResumeModel) -> resume_pb2.ResumeResponse:
    pd = model.personal_details
    return resume_pb2.ResumeResponse(
        personal_details=resume_pb2.PersonalDetails(
            first_name=pd.first_name,
            last_name=pd.last_name,
            email=pd.email,
            phone=pd.phone,
            country_code=pd.country_code,
            address=pd.address,
            avatar_url=pd.avatar_url,
        ),
        bio=model.bio,
        experience=[
            resume_pb2.Experience(
                id=exp.id or str(uuid.uuid4()),
                company=exp.company,
                position=exp.position,
                location=exp.location,
                start_date=exp.start_date,
                end_date=exp.end_date,
                is_current=exp.is_current,
                highlights=exp.highlights,
            )
            for exp in model.experience
        ],
        education=[
            resume_pb2.Education(
                id=edu.id or str(uuid.uuid4()),
                institution=edu.institution,
                degree=edu.degree,
                field_of_study=edu.field_of_study,
                start_date=edu.start_date,
                end_date=edu.end_date,
                gpa=edu.gpa,
                description=edu.description,
            )
            for edu in model.education
        ],
        skills=model.skills,
    )


async def serve() -> None:
    server = grpc_aio.server()
    resume_pb2_grpc.add_ResumeProcessorServicer_to_server(
        ResumeProcessorServicer(), server
    )
    server.add_insecure_port(f"{settings.grpc_host}:{settings.grpc_port}")

    await docling_client.connect()

    from app.services.llm_service import _get_client
    _get_client()
    logger.info("OpenAI client pre-warmed")

    await server.start()
    logger.info(
        "Ingestion gRPC server running on %s:%s",
        settings.grpc_host,
        settings.grpc_port,
    )

    try:
        await server.wait_for_termination()
    finally:
        await docling_client.close()


if __name__ == "__main__":
    asyncio.run(serve())
