"""Integridade de replay offline (governança v2) — stub."""

from __future__ import annotations

from typing import Any


def offline_replay_integrity_governance_stub(ok: bool) -> dict[str, Any]:
    return {
        "integrity_ok": ok,
        "assistant_notes": ["Falhas disparam modo read-only até sync bem-sucedido."],
        "replay_summary": {"checks": ["hash_chain", "journal_tail"]},
        "deterministic_alignment": {"status": "pass" if ok else "fail"},
        "lineage_replay_awareness": {"slice": "orig-v0"},
    }
