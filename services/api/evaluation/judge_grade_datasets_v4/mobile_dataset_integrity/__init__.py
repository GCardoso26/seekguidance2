"""Integridade de dataset no cliente (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_integrity_stub(ok: bool) -> dict[str, Any]:
    return {
        "integrity_ok": ok,
        "replay_summary": {"checks": ["hash", "manifest", "row_count"]},
        "assistant_notes": ["Falhas de integridade: isolar slice e pedir re-sync."],
        "sync_hints": ["Nunca merge automático com integrity_ok=false."],
        "deterministic_alignment": {"status": "pass" if ok else "fail"},
        "mobile_constraints": {"verify_on_boot": True},
        "offline_confidence": 0.72 if ok else 0.25,
        "lineage_replay_awareness": {"slice": "mdi-v0"},
    }
