"""Divergência entre interpretações possíveis."""

from __future__ import annotations


def interpretation_divergence(ambiguities: list[str]) -> list[dict[str, str]]:
    return [{"ambiguity": a, "interpretations": "multiple_valid"} for a in ambiguities]
