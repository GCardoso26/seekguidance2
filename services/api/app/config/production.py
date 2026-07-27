"""Constantes de produção — pool DB, cache TTL, rate limits."""

from __future__ import annotations

import os

# Gunicorn + Uvicorn (Render): WORKERS = (2 x CPU) + 1
# Dockerfile.production atual usa 1× uvicorn — manter workers baixos no pooler.
GUNICORN_WORKERS = 4
GUNICORN_WORKER_CLASS = "uvicorn.workers.UvicornWorker"
GUNICORN_KEEP_ALIVE = 5
GUNICORN_TIMEOUT = 120

# SQLAlchemy async pool (Supabase Session pooler ~pool_size 15).
# Antes: 20+10=30 por processo → EMAXCONNSESSION. Orçamento API ≤ ~6–7.
def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value >= 0 else default


DB_POOL_SIZE = _env_int("DB_POOL_SIZE", 4)
DB_MAX_OVERFLOW = _env_int("DB_MAX_OVERFLOW", 2)
DB_POOL_TIMEOUT = _env_int("DB_POOL_TIMEOUT", 30)
DB_POOL_RECYCLE = _env_int("DB_POOL_RECYCLE", 1800)

# Cache TTL (segundos) — usado por serviços com Redis
CACHE_TTL: dict[str, int] = {
    "leaderboards": 300,
    "player_stats": 600,
    "tournament_standings": 60,
    "card_catalog": 86_400,
}

# Rate limiting (referência; middleware usa app/core/rate_limit.py)
RATE_LIMIT_DEFAULT = "100/minute"
RATE_LIMIT_PUBLIC_API = "1000/hour"
