"""Regressão de ontologia."""

from __future__ import annotations


def ontology_regression(shift: float, drift: float) -> float:
    return round(min(1.0, 0.6 * shift + 0.4 * drift), 4)
