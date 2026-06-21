from fastapi import APIRouter

from app.ops.health_check import build_health_payload

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """Health check canônico — usado por load balancers e smoke tests."""
    return await build_health_payload()
