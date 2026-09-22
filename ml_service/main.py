import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router

app = FastAPI(
    title="FYPulse ML Service",
    version="1.0.0",
    description="ML/NLP engine for FYPulse — scraping, preprocessing, similarity, recommendations",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/ml")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "ml_service"}
