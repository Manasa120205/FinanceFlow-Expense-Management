"""API Version 1 Router Aggregator."""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.budgets import router as budgets_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.profile import router as profile_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(transactions_router)
api_router.include_router(budgets_router)
api_router.include_router(dashboard_router)
api_router.include_router(profile_router)
