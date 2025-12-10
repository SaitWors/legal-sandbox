# services/api/app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

from app.api.v1 import documents_mem  # используем in-memory вариант

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Legal Sandbox API (LR-4)")

# CORS (если фронт на localhost:3000)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_mem.router, prefix="/api/v1")

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
