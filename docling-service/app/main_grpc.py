import grpc
from concurrent import futures
import json
import os
import tempfile
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer
from prometheus_client import start_http_server
from generated import processor_pb2, processor_pb2_grpc

resource = Resource.create({"service.name": "docling-service"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(insecure=True)))
trace.set_tracer_provider(provider)
GrpcInstrumentorServer().instrument()

start_http_server(9052)
print("Prometheus metrics server on :9052")


class DocumentProcessorService(processor_pb2_grpc.DocumentProcessorServicer):
    def __init__(self):
        self._processor = None

    def _get_processor(self):
        if self._processor is None:
            from processor import DoclingProcessor
            self._processor = DoclingProcessor()
            print("Docling processor initialized.")
        return self._processor

    def ProcessDocument(self, request, context):
        file_content = request.file_content
        file_extension = request.file_extension

        print(f"Received document: extension={file_extension}, size={len(file_content)} bytes")

        tmp_path = None
        try:
            processor = self._get_processor()

            with tempfile.NamedTemporaryFile(
                suffix=f".{file_extension}", delete=False, dir="/tmp"
            ) as tmp:
                tmp.write(file_content)
                tmp_path = tmp.name

            result_data = processor.process_document(tmp_path)

            return processor_pb2.ProcessResponse(
                status="success",
                json_data=json.dumps(result_data),
            )
        except Exception as e:
            print(f"Error processing document: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return processor_pb2.ProcessResponse(status="error", json_data="")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)


def _prewarm():
    try:
        from processor import DoclingProcessor
        _ = DoclingProcessor()
        print("Docling processor pre-warmed successfully.")
    except Exception as e:
        print(f"Pre-warm failed (will retry on first request): {e}")


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=5))
    servicer = DocumentProcessorService()
    processor_pb2_grpc.add_DocumentProcessorServicer_to_server(servicer, server)

    port = os.environ.get("DOCLING_GRPC_PORT", "50052")
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"Docling gRPC server listening on port {port}")

    import threading
    threading.Thread(target=_prewarm, daemon=True).start()

    server.wait_for_termination()


if __name__ == "__main__":
    serve()
