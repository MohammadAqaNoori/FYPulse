from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.api.v1.routes import auth, users, projects, recommendations, generator

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routes ─────────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth.router,            prefix=API_PREFIX)
app.include_router(users.router,           prefix=API_PREFIX)
app.include_router(projects.router,        prefix=API_PREFIX)
app.include_router(recommendations.router, prefix=API_PREFIX)
app.include_router(generator.router,       prefix=API_PREFIX)


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": settings.VERSION, "env": settings.ENVIRONMENT}
