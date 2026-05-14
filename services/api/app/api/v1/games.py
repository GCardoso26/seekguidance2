from uuid import UUID

from app.api.deps import get_db_session
from app.infrastructure.db.models import Game
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/games", tags=["games"])


class GameResponse(BaseModel):
    id: UUID
    slug: str
    display_name: str
    publisher: str
    enabled: bool


@router.get("", response_model=list[GameResponse])
async def list_games(session: AsyncSession = Depends(get_db_session)) -> list[GameResponse]:
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
