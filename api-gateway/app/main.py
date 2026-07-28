from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.grpc_client import grpc_client
from app.routes.resume import router as resume_router
from app.routes.matchmaking import router as matchmaking_router
from app.routes.locations import router as locations_router

resource = Resource.create({"service.name": "api-gateway"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(insecure=True)))
trace.set_tracer_provider(provider)
HTTPXClientInstrumentor().instrument()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await grpc_client.connect()
    yield
    await grpc_client.close()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FastAPIInstrumentor.instrument_app(app)
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(resume_router)
app.include_router(matchmaking_router)
app.include_router(locations_router)
