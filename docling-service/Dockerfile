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
        /proto/processor.proto && \
    touch generated/__init__.py

RUN python -c "\
import pathlib, re; \
f=pathlib.Path('generated/processor_pb2_grpc.py'); \
f.write_text(re.sub(r'^import processor_pb2', 'from generated import processor_pb2', f.read_text(), flags=re.MULTILINE))"

FROM python:3.12-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 libfontconfig1 libxcb1 libx11-6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY docling-service/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 libfontconfig1 libxcb1 libx11-6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /install /usr/local
COPY docling-service/app ./app
COPY --from=stubs /build/generated ./app/generated

ENV PYTHONPATH=/app:/app/app
ENV PYTHONUNBUFFERED=1

EXPOSE 50052

CMD ["python", "-m", "app.main_grpc"]
