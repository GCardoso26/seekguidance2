"""Detecção de split ontológico."""

from __future__ import annotations


def ontology_split_detected(shift_score: float) -> bool:
    return shift_score > 0.1
