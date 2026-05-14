"""Score de integridade de ontologia."""

from __future__ import annotations


def ontology_integrity_score(*, mapping_conflicts: int, coverage: float) -> float:
    penalty = min(0.5, 0.05 * mapping_conflicts)
    cov = max(0.0, min(1.0, coverage))
    return round(max(0.0, min(1.0, cov - penalty)), 4)
