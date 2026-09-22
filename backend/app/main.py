"""Main FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

from app.api.v1 import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("financeflow")


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
    logger.info("Shutting down FinanceFlow API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-ready RESTful API for FinanceFlow — Personal Finance & "
        "Expense Management Platform. Provides robust endpoints for authentication, "
        "transaction management, budget tracking, financial analytics, and user isolation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
def health_check():
    """Verify service availability and active environment."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


# Register v1 API routes
app.include_router(api_router)
