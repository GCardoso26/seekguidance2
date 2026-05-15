from app.api.v1 import chat, games, health, mobile, replay_runtime
from fastapi import APIRouter

api_router = APIRouter(prefix="/v1")
api_router.include_router(health.router)
api_router.include_router(mobile.router)
api_router.include_router(replay_runtime.router)
api_router.include_router(games.router)
api_router.include_router(chat.router)
