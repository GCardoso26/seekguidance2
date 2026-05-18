import os
from collections.abc import AsyncGenerator
from urllib.parse import urlparse

from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _connect_args_for_database_url(database_url: str) -> dict:
    """RDS exige TLS; SQLAlchemy/asyncpg não aplica ?ssl= na URL sozinho."""
    ssl_mode = os.environ.get("DATABASE_SSL", "").strip().lower()
    host = (urlparse(database_url.replace("+asyncpg", "")).hostname or "").lower()
    if ssl_mode in ("require", "true", "1") or host.endswith(".rds.amazonaws.com"):
        return {"ssl": "require"}
    return {}


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        connect_args = _connect_args_for_database_url(settings.database_url)
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.environment == "development",
            pool_pre_ping=True,
            connect_args=connect_args,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with get_session_factory()() as session:
        yield session
