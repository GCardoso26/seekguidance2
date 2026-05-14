"""Limite semântico de ramos (soft cap por confiança)."""

from __future__ import annotations


def semantic_branch_limit(n_branches: int, *, confidence: float, hard_cap: int) -> int:
    conf = max(0.0, min(1.0, confidence))
    soft = int(hard_cap * (0.5 + 0.5 * conf))
    return max(1, min(hard_cap, min(n_branches, soft)))
