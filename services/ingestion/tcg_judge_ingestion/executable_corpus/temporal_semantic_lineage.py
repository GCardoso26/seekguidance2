"""Linha temporal semântica entre versões."""

from __future__ import annotations


def version_to_version_legality_diff(v_old: str, v_new: str) -> dict[str, str]:
    return {"from": v_old, "to": v_new, "status": "pending_semantic_diff"}
