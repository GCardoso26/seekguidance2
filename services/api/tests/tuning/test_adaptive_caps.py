"""Tuning adaptive caps."""

from __future__ import annotations

from app.core.config import Settings
from app.tuning import adaptive_branch_cap


def test_entropy_prune_reduces() -> None:
    s = Settings(
        database_url="postgresql+asyncpg://x",
        redis_url="redis://x",
        graph_explosion_entropy_prune_threshold=0.5,
    )
    low = adaptive_branch_cap(s, query_complexity=0.5, classifier_confidence=0.9, entropy=0.9)
    high = adaptive_branch_cap(s, query_complexity=0.5, classifier_confidence=0.9, entropy=0.1)
    assert low <= high
