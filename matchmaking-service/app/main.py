from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.routes import applications, auth, generation, jobs, matching, users

resource = Resource.create({"service.name": "matchmaking-service"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(insecure=True)))
trace.set_tracer_provider(provider)
HTTPXClientInstrumentor().instrument()


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    await client.embeddings.create(model=settings.openai_embedding_model, input="warmup")
    yield


app = FastAPI(title="Matchmaking Service", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FastAPIInstrumentor.instrument_app(app)
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(applications.router)
app.include_router(auth.router)
app.include_router(generation.router)
app.include_router(jobs.router)
app.include_router(users.router)
app.include_router(matching.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
