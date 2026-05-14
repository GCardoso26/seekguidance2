"""Regressão de drift de ontologia."""

from __future__ import annotations


def ontology_drift_regression(delta: float, *, threshold: float = 0.12) -> bool:
    return delta > threshold
