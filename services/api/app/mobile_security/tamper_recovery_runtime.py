"""Recuperação pós-tamper (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def tamper_recovery_runtime_stub(recovered: bool) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"recovered": recovered},
        sync_hints=["Isolar slice afetado; revalidar com juiz head."],
        deterministic_alignment={"token": "trr-v3"},
        mobile_constraints={"read_only_until_clear": not recovered},
        offline_confidence=0.4 if not recovered else 0.75,
        assistant_notes=["Recovery seguro com checkpoint determinístico."],
        lineage_replay_slice="trr-v3",
    )
