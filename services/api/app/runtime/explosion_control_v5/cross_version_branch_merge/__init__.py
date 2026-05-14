"""Merge de ramos cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_branch_merge_stub(v_old: str, v_new: str) -> dict[str, Any]:
    return {
        "from": v_old,
        "to": v_new,
        "convergence_confidence": 0.85,
        "assistant_notes": ["Supersedência temporal obrigatória em merges."],
    }
