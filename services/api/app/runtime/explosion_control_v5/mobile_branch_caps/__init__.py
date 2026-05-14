"""Limites de largura de ramo no mobile (stub)."""

from __future__ import annotations

from typing import Any


def mobile_branch_caps_stub(width: int) -> dict[str, Any]:
    cap = 12
    return {
        "width": width,
        "cap": cap,
        "pruned": max(0, width - cap),
        "assistant_notes": ["Pruning mobile-safe; preservar heads para resume determinístico."],
        "replay_summary": {"open_branches": width},
        "sync_hints": ["Enviar apenas deltas de ramos podados."],
        "deterministic_alignment": {"token": "mbc-v0"},
        "mobile_constraints": {"cap": cap},
        "offline_confidence": 0.64,
        "lineage_replay_awareness": {"slice": "branch-cap-v0"},
    }
