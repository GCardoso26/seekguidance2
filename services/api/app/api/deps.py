from typing import Annotated

from app.application.rag_orchestrator import RagOrchestrator
from app.core.config import Settings, get_settings
from app.infrastructure.db.session import get_db_session
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_rag_orchestrator(settings: SettingsDep) -> RagOrchestrator:
    return RagOrchestrator(settings)
