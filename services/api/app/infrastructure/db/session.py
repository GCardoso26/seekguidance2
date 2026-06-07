import os
from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlparse, urlunparse

from app.config.production import (
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    DB_POOL_TIMEOUT,
)
from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _connect_args_for_database_url(database_url: str) -> dict:
    """RDS e Supabase exigem TLS; asyncpg ignora ?sslmode= na URL sem connect_args."""
    clean = database_url.replace("+asyncpg", "")
    parsed = urlparse(clean)
    query = parse_qs(parsed.query)
    qs_ssl = (query.get("sslmode", [None])[0] or "").strip().lower()

    ssl_mode = os.environ.get("DATABASE_SSL", "").strip().lower()
    host = (parsed.hostname or "").lower()

    needs_ssl = (
        ssl_mode in ("require", "true", "1")
        or qs_ssl in ("require", "verify-ca", "verify-full")
        or host.endswith(".rds.amazonaws.com")
        or host.endswith(".supabase.co")
        or "pooler.supabase.com" in host
    )
    if needs_ssl:
        return {"ssl": "require"}
    return {}


def _async_engine_url(database_url: str) -> str:
    """asyncpg não aceita ?sslmode= na URL (TypeError); SSL vai em connect_args."""
    parsed = urlparse(database_url)
    if not parsed.query:
        return database_url
    return urlunparse(parsed._replace(query=""))


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        connect_args = _connect_args_for_database_url(settings.database_url)
        pool_kwargs: dict = {
            "echo": settings.environment == "development",
            "pool_pre_ping": True,
            "connect_args": connect_args,
        }
        if settings.environment == "production":
            pool_kwargs.update(
                pool_size=DB_POOL_SIZE,
                max_overflow=DB_MAX_OVERFLOW,
                pool_timeout=DB_POOL_TIMEOUT,
                pool_recycle=DB_POOL_RECYCLE,
            )
        _engine = create_async_engine(
            _async_engine_url(settings.database_url),
            **pool_kwargs,
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
