"""Alinhamento semântico cross-fonte (stub determinístico)."""

from __future__ import annotations

from typing import Any


def alignment_score(text_a: str, text_b: str) -> float:
    """Heurística lexical trivial (substituir por embedding + calibragem)."""
    ta, tb = set(text_a.lower().split()), set(text_b.lower().split())
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    return round(inter / max(1, union), 4)


def alignment_report(a: str, b: str) -> dict[str, Any]:
    return {"score": alignment_score(a, b), "method": "token_jaccard_stub"}
