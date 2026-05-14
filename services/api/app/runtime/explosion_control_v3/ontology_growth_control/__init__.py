"""Controlo de crescimento de ontologia."""

from __future__ import annotations


def ontology_growth_control(terms: int, *, cap: int) -> dict[str, object]:
    return {"prune": terms > cap, "terms": terms}
