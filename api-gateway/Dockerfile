FROM python:3.12-slim AS stubs

RUN apt-get update && apt-get install -y --no-install-recommends \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN pip install --no-cache-dir grpcio-tools "protobuf>=5.29.0,<6"

COPY proto/ /proto/

RUN mkdir -p generated && \
    python -m grpc_tools.protoc \
        -I/proto \
        --python_out=generated \
        --grpc_python_out=generated \
        /proto/resume.proto && \
    touch generated/__init__.py

RUN python -c "\
import pathlib, re; \
f=pathlib.Path('generated/resume_pb2_grpc.py'); \
f.write_text(re.sub(r'^import resume_pb2', 'from generated import resume_pb2', f.read_text(), flags=re.MULTILINE))"

FROM python:3.12-slim AS deps

WORKDIR /app
COPY api-gateway/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS runtime

WORKDIR /app

COPY --from=deps /install /usr/local
COPY --from=stubs /build/generated ./generated
COPY api-gateway/app ./app

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
