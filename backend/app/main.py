"""Main FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

from sqlalchemy import text
from app.api.v1 import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pennyflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and teardown."""
    logger.info("Initializing database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
    yield
    logger.info("Shutting down PennyFlow API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-ready RESTful API for PennyFlow — Personal Finance & "
        "Expense Management Platform. Provides robust endpoints for authentication, "
        "transaction management, budget tracking, financial analytics, and user isolation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
# Strictly allow production PennyFlow domains, preview deployments, localhost, and local network IPs
allowed_origins = [
    "https://pennyflow-in.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost",
]
if isinstance(settings.CORS_ORIGINS, list):
    for origin in settings.CORS_ORIGINS:
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https://pennyflow[a-zA-Z0-9\-_]*\.vercel\.app|https://.*\.loca\.lt|http://(192\.168|10|172\.(1[6-9]|2[0-9]|3[0-1]))\.\d+\.\d+(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return user-friendly validation error messages without leaking internal tracebacks."""
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid value.")
        errors.append({"field": field, "message": msg})
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input validation error occurred. Please verify provided data.",
            "errors": errors
        }
    )


@app.get("/health", tags=["Health"], summary="System healthcheck endpoint")
@app.get("/api/v1/health", tags=["Health"], summary="API v1 healthcheck endpoint")
def health_check():
    """Verify service availability and active database connectivity."""
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Healthcheck database ping failed: {e}")
        db_status = "disconnected"

    is_healthy = db_status == "connected"
    return JSONResponse(
        status_code=status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "database": db_status,
            "project": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT
        }
    )


# Register v1 API routes
app.include_router(api_router)
