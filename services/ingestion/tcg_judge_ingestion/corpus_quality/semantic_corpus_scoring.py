"""Score semântico agregado do corpus (proxy)."""

from __future__ import annotations


def semantic_corpus_score(avg_ruling_conf: float, coverage: float) -> float:
    return round(max(0.0, min(1.0, 0.6 * avg_ruling_conf + 0.4 * coverage)), 4)
