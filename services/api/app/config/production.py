"""Constantes de produção — pool DB, cache TTL, rate limits."""

from __future__ import annotations

# Gunicorn + Uvicorn (Render): WORKERS = (2 x CPU) + 1
GUNICORN_WORKERS = 4
GUNICORN_WORKER_CLASS = "uvicorn.workers.UvicornWorker"
GUNICORN_KEEP_ALIVE = 5
GUNICORN_TIMEOUT = 120

# SQLAlchemy async pool (Supabase pooler)
DB_POOL_SIZE = 20
DB_MAX_OVERFLOW = 10
DB_POOL_TIMEOUT = 30
DB_POOL_RECYCLE = 1800

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
