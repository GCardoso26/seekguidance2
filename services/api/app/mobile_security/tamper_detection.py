"""Detecção de adulteração local (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def tamper_detection_stub(flagged: bool) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"flagged": flagged, "signals": ["hash_mismatch", "clock_skew"] if flagged else []},
        sync_hints=["Se flagged, isolar slice e pedir revisão de juiz head."],
        deterministic_alignment={"tamper_token": "bad" if flagged else "good"},
        mobile_constraints={"isolate_on_flag": True},
        offline_confidence=0.3 if flagged else 0.82,
        assistant_notes=["Detecção heurística; não substitui auditoria central."],
        lineage_replay_slice="tamper-v0",
    )
