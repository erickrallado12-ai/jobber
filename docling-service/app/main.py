from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import threading
from main_grpc import serve
from processor import DoclingProcessor

@asynccontextmanager
async def lifespan(app: FastAPI):
    grpc_thread = threading.Thread(target=serve, daemon=True)
    grpc_thread.start()
    print("Servidor gRPC iniciado.")
    yield

app = FastAPI(lifespan=lifespan)
processor = DoclingProcessor()

class ProcessRequest(BaseModel):
    file_path: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/process")
async def process(request: ProcessRequest):
    try:
        data = processor.process_document(request.file_path)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))