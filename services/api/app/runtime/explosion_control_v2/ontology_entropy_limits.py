"""Limites de entropia de ontologia."""

from __future__ import annotations


def ontology_entropy_limits(term_count: int, *, soft_cap: int = 400) -> dict[str, object]:
    return {"over_soft_cap": term_count > soft_cap, "term_count": term_count, "soft_cap": soft_cap}
