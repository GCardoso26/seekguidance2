"""Perfis de dataset compactos para dispositivos (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_profile_stub(name: str) -> dict[str, Any]:
    return {
        "profile": name,
        "replay_summary": {"rows": 150, "compaction": "v0"},
        "assistant_notes": ["Perfil móvel é subconjunto judge-grade; lineage completo pode estar na cloud."],
        "sync_hints": ["Checksum antes de aplicar patch incremental."],
        "deterministic_alignment": {"manifest": f"mdp-{name}"},
        "mobile_constraints": {"max_mb": 64},
        "offline_confidence": 0.57,
        "lineage_replay_awareness": {"slice": f"mdp-{name}"},
    }
