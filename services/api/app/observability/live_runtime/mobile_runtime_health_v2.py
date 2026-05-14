"""Saúde do runtime móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_health_v2_stub(ok: bool) -> dict[str, Any]:
    return {
        "healthy": ok,
        "assistant_notes": ["v2 agrega storage + sync + replay em um painel operacional."],
        "replay_summary": {"checks": ["journal", "queue", "thermal"]},
        "deterministic_alignment": {"status": "green" if ok else "amber"},
        "lineage_replay_awareness": {"slice": "mrhv2"},
    }
