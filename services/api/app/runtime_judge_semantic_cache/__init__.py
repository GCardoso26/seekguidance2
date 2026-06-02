"""Cache semântico Redis para respostas Judge."""

from app.runtime_judge_semantic_cache.cache import (
    SemanticCache,
    cache_stats_snapshot,
    get_semantic_cache,
    invalidate_game_cache,
)

__all__ = [
    "SemanticCache",
    "cache_stats_snapshot",
    "get_semantic_cache",
    "invalidate_game_cache",
]
