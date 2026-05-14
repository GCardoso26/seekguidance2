"""Diff semântico leve (produção: substituir por diff estruturado + LLM audit)."""

from __future__ import annotations

from difflib import SequenceMatcher


def semantic_similarity_ratio(a: str, b: str) -> float:
    return SequenceMatcher(a=a, b=b).ratio()
