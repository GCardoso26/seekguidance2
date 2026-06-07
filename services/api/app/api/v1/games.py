from uuid import UUID

from app.api.deps import DbSession
from app.infrastructure.db.models import Game
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

router = APIRouter(prefix="/games", tags=["games"])


class GameResponse(BaseModel):
    id: UUID
    slug: str
    display_name: str
    publisher: str
    enabled: bool


@router.get("", response_model=list[GameResponse])
async def list_games(session: DbSession) -> list[GameResponse]:
    stmt = select(Game).where(Game.enabled.is_(True)).order_by(Game.display_name)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        GameResponse(
            id=r.id,
            slug=r.slug,
            display_name=r.display_name,
            publisher=r.publisher,
            enabled=r.enabled,
        )
        for r in rows
    ]
